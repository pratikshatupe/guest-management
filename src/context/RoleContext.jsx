import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ACTIONS,
  AUTH_ROLE_TO_KEY,
  CURRENT_ROLE_STORAGE_KEY,
  DEFAULT_PERMISSIONS,
  LEGACY_PERMISSIONS_KEYS,
  MODULES,
  PERMISSIONS_STORAGE_KEY,
  ROLE_KEYS,
  SUPER_ADMIN_LOCKED_MODULES,
} from '../utils/defaultPermissions';
import {
  addRbacAuditLogs,
  diffRoleMatrix,
  getCurrentUserSnapshot,
} from '../utils/rbacAuditLogger';
import {
  ORG_OVERRIDES_STORAGE_KEY,
  clearOrgOverrides,
  readOrgOverrides,
  resolveRow,
  setOrgOverride as writeOrgOverride,
} from '../utils/orgPermissions';

/**
 * Global Role & Permission System.
 *
 * Single source of truth for:
 *   - currentRole       (one of ROLE_KEYS)
 *   - permissions       ({ [role]: { [module]: { view, create, edit, delete } } })
 *   - hasPermission()   (module, action) → boolean
 *
 * Persisted in localStorage under PERMISSIONS_STORAGE_KEY + CURRENT_ROLE_STORAGE_KEY.
 * The `storage` event listener fans changes out across tabs/components instantly,
 * so when Super Admin flips a toggle every consumer re-renders without a refresh.
 */

const RoleContext = createContext(null);

const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Quota or private mode — ignore. */
  }
};

/* Merge persisted permissions with defaults so newly added modules/roles
   automatically appear instead of silently being denied. Super Admin is
   *always* hydrated from DEFAULT_PERMISSIONS — never from persisted data —
   so legacy caches (pre-RBAC-fix) that granted operational access cannot
   resurrect when the app loads. Write-attempts to persist a tampered Super
   Admin row are also re-asserted by updatePermissions below.

   Director's `roles-permissions` row is also pinned to DEFAULT_PERMISSIONS
   so any stale v1 cache that recorded `none` for this module cannot survive
   a version bump — the Director always gets full access as per spec. */
const mergeWithDefaults = (persisted) => {
  const out = {};
  for (const role of Object.values(ROLE_KEYS)) {
    out[role] = {};
    const isSuperAdmin = role === ROLE_KEYS.SUPER_ADMIN;
    for (const m of MODULES) {
      const fromDefault = DEFAULT_PERMISSIONS[role][m.key];
      if (isSuperAdmin) {
        out[role][m.key] = { ...fromDefault };
        continue;
      }
      /* Director's roles-permissions is always pinned to DEFAULT so no stale
         cache entry can re-deny access after a permission promotion. */
      if (role === ROLE_KEYS.DIRECTOR && m.key === 'roles-permissions') {
        out[role][m.key] = { ...fromDefault };
        continue;
      }
      const fromPersisted = persisted?.[role]?.[m.key];
      out[role][m.key] = { ...fromDefault, ...(fromPersisted || {}) };
    }
  }
  return out;
};

/* Find the most recent persisted matrix — prefer the dynamic v1 key, else
   fall back to any legacy key so a tenant's edits survive the upgrade. */
const readPersistedMatrix = () => {
  const current = safeRead(PERMISSIONS_STORAGE_KEY, null);
  if (current) return current;
  for (const legacy of LEGACY_PERMISSIONS_KEYS) {
    const legacyVal = safeRead(legacy, null);
    if (legacyVal) return legacyVal;
  }
  return null;
};

export function RoleProvider({ children, role: roleProp }) {
  const [permissions, setPermissions] = useState(() =>
    mergeWithDefaults(readPersistedMatrix()),
  );

  const [currentRole, setCurrentRoleState] = useState(() => {
    const stored = (() => {
      try { return localStorage.getItem(CURRENT_ROLE_STORAGE_KEY); } catch { return null; }
    })();
    return stored || ROLE_KEYS.SUPER_ADMIN;
  });

  /* Seed defaults to localStorage on first run so the matrix UI always reads
     the same shape it writes. */
  useEffect(() => {
    if (!safeRead(PERMISSIONS_STORAGE_KEY, null)) {
      safeWrite(PERMISSIONS_STORAGE_KEY, permissions);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Auth → role bridge. When the parent passes an auth role (e.g. from
     useAuth().user.role), keep the RBAC current_role in sync. */
  useEffect(() => {
    if (!roleProp) return;
    const mapped = AUTH_ROLE_TO_KEY[roleProp.toLowerCase()];
    if (mapped && mapped !== currentRole) {
      setCurrentRoleState(mapped);
      try { localStorage.setItem(CURRENT_ROLE_STORAGE_KEY, mapped); } catch {}
    }
  }, [roleProp, currentRole]);

  /* Cross-tab + cross-component sync. */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PERMISSIONS_STORAGE_KEY) {
        setPermissions(mergeWithDefaults(safeRead(PERMISSIONS_STORAGE_KEY, null)));
      }
      if (e.key === CURRENT_ROLE_STORAGE_KEY && e.newValue) {
        setCurrentRoleState(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    /* Same-window updates: components dispatch this synthetic event after
       writing to localStorage so other consumers in the same tab refresh too. */
    const onLocal = () => {
      setPermissions(mergeWithDefaults(safeRead(PERMISSIONS_STORAGE_KEY, null)));
    };
    window.addEventListener('rbac:permissions-updated', onLocal);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('rbac:permissions-updated', onLocal);
    };
  }, []);

  const setRole = useCallback((nextRole) => {
    if (!nextRole || !ROLE_KEYS[Object.keys(ROLE_KEYS).find((k) => ROLE_KEYS[k] === nextRole)]) {
      return;
    }
    setCurrentRoleState(nextRole);
    try { localStorage.setItem(CURRENT_ROLE_STORAGE_KEY, nextRole); } catch {}
  }, []);

  const updatePermissions = useCallback((next) => {
    const previous  = permissions;
    const candidate = mergeWithDefaults(typeof next === 'function' ? next(previous) : next);

    /* Safety net — Super Admin row is always forced back to spec defaults,
       never to "all granted". This preserves the rule that Super Admin is a
       platform owner (no operational access) and at the same time guarantees
       the SaaS owner can never be locked out of critical platform surfaces
       (dashboard, reports, offices, roles-permissions, subscription,
       audit-logs), by pinning `view` on for each. Write access is NOT
       re-asserted — operational write bits stay off per spec. */
    const superAdminDefaults = DEFAULT_PERMISSIONS[ROLE_KEYS.SUPER_ADMIN];
    candidate[ROLE_KEYS.SUPER_ADMIN] = {};
    for (const m of MODULES) {
      candidate[ROLE_KEYS.SUPER_ADMIN][m.key] = { ...superAdminDefaults[m.key] };
    }
    for (const locked of SUPER_ADMIN_LOCKED_MODULES) {
      const row = candidate[ROLE_KEYS.SUPER_ADMIN][locked] || { view: false, create: false, edit: false, delete: false };
      candidate[ROLE_KEYS.SUPER_ADMIN][locked] = { ...row, view: true };
    }

    setPermissions(candidate);
    safeWrite(PERMISSIONS_STORAGE_KEY, candidate);
    window.dispatchEvent(new Event('rbac:permissions-updated'));

    /* Audit — one log per role whose matrix actually changed. We record the
       before/after snapshots and a compact cell-level diff so the Audit Logs
       UI can render a meaningful side-by-side view. */
    try {
      const actor = getCurrentUserSnapshot();
      const entries = [];
      for (const roleKey of Object.values(ROLE_KEYS)) {
        const before = previous?.[roleKey]  || {};
        const after  = candidate?.[roleKey] || {};
        const changes = diffRoleMatrix(before, after, MODULES, ACTIONS);
        if (changes.length === 0) continue;
        entries.push({
          targetRole:        roleKey,
          beforePermissions: before,
          afterPermissions:  after,
          changes,
          orgId:             actor.orgId,
        });
      }
      if (entries.length) addRbacAuditLogs(entries);
    } catch { /* logging must never block a save */ }
  }, [permissions]);

  const setPermission = useCallback((role, moduleKey, action, value) => {
    updatePermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [moduleKey]: { ...prev[role]?.[moduleKey], [action]: value },
      },
    }));
  }, [updatePermissions]);

  const resetPermissions = useCallback(() => {
    updatePermissions(DEFAULT_PERMISSIONS);
  }, [updatePermissions]);

  /* Org-override sync so hasPermission picks up org-level changes from any
     tab / any caller without needing a reload. */
  const [orgOverrides, setOrgOverrides] = useState(() => readOrgOverrides());
  useEffect(() => {
    const refresh = () => setOrgOverrides(readOrgOverrides());
    const onStorage = (e) => { if (e.key === ORG_OVERRIDES_STORAGE_KEY) refresh(); };
    window.addEventListener('rbac:org-overrides-updated', refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('rbac:org-overrides-updated', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  /**
   * hasPermission(moduleKey, action, { orgId, role } = {})
   *
   * Resolves permissions strictly from the matrix — NO role-level bypass.
   * Super Admin is a platform owner and has explicit `none` rows for every
   * operational module per spec, so the generic matrix lookup is enough.
   * If the matrix is tampered with to deny critical platform modules, the
   * RoleContext updatePermissions guard pins `view` on for the SUPER_ADMIN_
   * LOCKED_MODULES so Super Admin can never be locked out of their own
   * surfaces.
   */
  const hasPermission = useCallback((moduleKey, action = 'view', opts = {}) => {
    const role = opts.role || currentRole;
    if (!role || !moduleKey) return false;

    let orgId = opts.orgId;
    if (orgId === undefined) {
      try {
        const raw = localStorage.getItem('cgms_user');
        const u = raw ? JSON.parse(raw) : null;
        orgId = u?.organisationId || u?.orgId || null;
      } catch { orgId = null; }
    }

    const row = resolveRow({
      role,
      orgId,
      moduleKey,
      defaultsByRole: permissions,
      orgOverrides,
    });
    return Boolean(row?.[action]);
  }, [permissions, currentRole, orgOverrides]);

  /* Org-override setters exposed to consumers (admin UIs) that want to
     manage per-organisation deltas on top of the default matrix. Super
     Admin-only use — behaviour is unaffected for roles without overrides. */
  const setOrgOverride = useCallback((orgId, role, moduleKey, action, value) => {
    writeOrgOverride(orgId, role, moduleKey, action, value);
    setOrgOverrides(readOrgOverrides());
  }, []);

  const clearOrg = useCallback((orgId) => {
    clearOrgOverrides(orgId);
    setOrgOverrides(readOrgOverrides());
  }, []);

  const value = useMemo(() => ({
    currentRole,
    setRole,
    permissions,
    orgOverrides,
    setOrgOverride,
    clearOrgOverrides: clearOrg,
    setPermission,
    updatePermissions,
    resetPermissions,
    hasPermission,
    /* Re-export for convenience so consumers don't double-import. */
    MODULES,
    ACTIONS,
    ROLE_KEYS,
  }), [currentRole, setRole, permissions, orgOverrides, setOrgOverride, clearOrg, setPermission, updatePermissions, resetPermissions, hasPermission]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}

/* Convenience predicate hook so JSX guards stay terse:
     {can('services','delete') && <DeleteButton />} */
export function useCan() {
  const { hasPermission } = useRole();
  return hasPermission;
}
