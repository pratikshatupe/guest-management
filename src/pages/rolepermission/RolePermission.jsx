import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Search,
  X,
  Users,
  ChevronDown,
  ChevronUp,
  Settings,
} from 'lucide-react';
import {
  MODULES,
  PERMISSIONS,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  cloneRole,
} from './mockApi';

const permColor = {
  view: '#60A5FA',
  create: '#34D399',
  edit: '#FBBF24',
  delete: '#F87171',
};

const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeText = (value, fallback = '') => value ?? fallback;

const getPermCount = (permissions) =>
  Object.values(permissions || {}).reduce((sum, list) => sum + safeArray(list).length, 0);

const initialState = {
  tenantId: 'org_1',
  roles: [],
};

export default function RolesPermissions({ tenantId = 'org_1' }) {
  const [state, setState] = useState({ ...initialState, tenantId });
  const [search, setSearch] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const roles = await getRoles();
      setState({ tenantId, roles });
      setSelectedRoleId((prev) => prev || roles?.[0]?.id || null);
      setLoading(false);
    };

    load();
  }, [tenantId]);

  const selectedRole = useMemo(() => {
    return state.roles.find((r) => r.id === selectedRoleId) || state.roles[0] || null;
  }, [state.roles, selectedRoleId]);

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.roles;

    return state.roles.filter((role) => {
      const name = safeText(role?.name).toLowerCase();
      const desc = safeText(role?.description).toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [search, state.roles]);

  useEffect(() => {
    if (!selectedRole && state.roles.length) setSelectedRoleId(state.roles[0].id);
  }, [selectedRole, state.roles]);

  const persistRoles = async (nextRoles) => {
    setState((prev) => ({ ...prev, roles: nextRoles }));
    const nextSelected = nextRoles.find((r) => r.id === selectedRoleId) || nextRoles[0] || null;
    setSelectedRoleId(nextSelected?.id || null);
  };

  const openCreate = () => {
    setDraft({
      name: '',
      description: '',
      color: '#94A3B8',
      userCount: 0,
      permissions: Object.fromEntries(MODULES.map((m) => [m.id, []])),
    });
    setEditMode(false);
    setShowRoleModal(true);
  };

  const openEdit = () => {
    if (!selectedRole) return;
    setDraft({
      name: selectedRole.name || '',
      description: selectedRole.description || '',
      color: selectedRole.color || '#94A3B8',
      userCount: selectedRole.userCount ?? 0,
      permissions: structuredClone(selectedRole.permissions || {}),
    });
    setEditMode(true);
    setShowRoleModal(true);
  };

  const closeModal = () => {
    setShowRoleModal(false);
    setDraft(null);
    setEditMode(false);
  };

  const togglePerm = (moduleId, perm) => {
    setDraft((prev) => {
      const current = safeArray(prev?.permissions?.[moduleId]);
      const next = current.includes(perm)
        ? current.filter((p) => p !== perm)
        : [...current, perm];

      return {
        ...prev,
        permissions: {
          ...(prev?.permissions || {}),
          [moduleId]: next,
        },
      };
    });
  };

  const toggleAllPerms = (moduleId) => {
    setDraft((prev) => {
      const current = safeArray(prev?.permissions?.[moduleId]);
      const next = current.length === PERMISSIONS.length ? [] : PERMISSIONS;

      return {
        ...prev,
        permissions: {
          ...(prev?.permissions || {}),
          [moduleId]: next,
        },
      };
    });
  };

  const toggleExpanded = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const handleSaveRole = async () => {
    if (!draft?.name?.trim()) return;

    if (editMode && selectedRole) {
      const updated = await updateRole(selectedRole.id, draft);
      const nextRoles = state.roles.map((r) => (r.id === selectedRole.id ? updated : r));
      await persistRoles(nextRoles);
    } else {
      const created = await createRole(draft);
      await persistRoles([created, ...state.roles]);
    }

    closeModal();
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) return;
    await deleteRole(deleteTarget.id);
    const nextRoles = state.roles.filter((r) => r.id !== deleteTarget.id);
    await persistRoles(nextRoles);
    setDeleteTarget(null);
  };

  const handleCloneRole = async (role) => {
    const cloned = await cloneRole(role.id);
    if (!cloned) return;
    await persistRoles([cloned, ...state.roles]);
    setSelectedRoleId(cloned.id);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/20 ring-1 ring-violet-500/30">
            <Shield className="h-5 w-5 text-violet-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Roles & Permissions</h1>
            <p className="text-sm text-slate-400">Tenant-isolated role management</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl shadow-black/20">
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search roles"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-white"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Roles ({filteredRoles.length})
              </div>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500"
                type="button"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Role
              </button>
            </div>

            <RoleList
              roles={filteredRoles}
              selectedRoleId={selectedRoleId}
              onSelect={setSelectedRoleId}
              loading={loading}
            />
          </aside>

          <section className="rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/20">
            {selectedRole ? (
              <>
                <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: selectedRole.color || '#A78BFA' }}
                      />
                      <h2 className="text-lg font-semibold text-white">
                        {safeText(selectedRole.name, 'Untitled Role')}
                      </h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {safeText(selectedRole.description, 'No description')}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={openEdit}
                      className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
                      type="button"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleCloneRole(selectedRole)}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                      type="button"
                    >
                      <Copy className="h-4 w-4" />
                      Clone
                    </button>
                    <button
                      onClick={() => setDeleteTarget(selectedRole)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-4 grid gap-3 sm:grid-cols-3">
                    <Metric label="Users" value={selectedRole.userCount ?? 0} />
                    <Metric label="Modules" value={Object.keys(selectedRole.permissions || {}).length} />
                    <Metric label="Permissions" value={getPermCount(selectedRole.permissions || {})} />
                  </div>

                  <PermissionMatrix
                    modules={MODULES}
                    permissions={PERMISSIONS}
                    role={editMode ? draft : selectedRole}
                    editMode={editMode}
                    expandedModules={expandedModules}
                    onToggleExpanded={toggleExpanded}
                    onTogglePerm={togglePerm}
                    onToggleAll={toggleAllPerms}
                  />
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center p-10 text-slate-400">
                No roles available for this tenant.
              </div>
            )}
          </section>
        </div>
      </div>

      {showRoleModal && (
        <RoleModal
          mode={editMode ? 'edit' : 'create'}
          draft={draft}
          onClose={closeModal}
          onChange={setDraft}
          onSave={handleSaveRole}
          modules={MODULES}
          permissions={PERMISSIONS}
          onTogglePerm={togglePerm}
          onToggleAll={toggleAllPerms}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete role"
          description={`Delete "${deleteTarget.name}" for this tenant? This action cannot be undone.`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteRole}
        />
      )}
    </div>
  );
}

function RoleList({ roles, selectedRoleId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-400">
        Loading roles...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {roles.map((role) => (
        <RoleCard
          key={role.id}
          role={role}
          active={selectedRoleId === role.id}
          onClick={() => onSelect(role.id)}
        />
      ))}
    </div>
  );
}

function RoleCard({ role, active, onClick }) {
  const permCount = getPermCount(role.permissions || {});
  return (
    <button
      onClick={onClick}
      type="button"
      className={[
        'w-full rounded-2xl border p-4 text-left transition-all duration-200',
        active
          ? 'border-violet-400/40 bg-violet-500/10 shadow-lg shadow-violet-950/30'
          : 'border-white/10 bg-slate-900/50 hover:border-white/20 hover:bg-slate-900',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{safeText(role.name, 'Untitled Role')}</div>
          <div className="mt-1 text-xs text-slate-400">{safeText(role.description, 'No description')}</div>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${role.color || '#94A3B8'}20`, color: role.color || '#94A3B8' }}
        >
          <Users className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{role.userCount ?? 0} users</span>
        <span>{permCount} permissions</span>
      </div>
    </button>
  );
}

function PermissionMatrix({
  modules,
  permissions,
  role,
  editMode,
  expandedModules,
  onToggleExpanded,
  onTogglePerm,
  onToggleAll,
}) {
  const currentPermissions = role?.permissions || {};

  return (
    <div className="space-y-3">
      {modules.map((module) => {
        const modulePerms = safeArray(currentPermissions[module.id]);
        const active = modulePerms.length > 0;
        const expanded = !!expandedModules[module.id];

        return (
          <div
            key={module.id}
            className={[
              'rounded-2xl border p-4 transition',
              active ? 'border-white/10 bg-white/5' : 'border-white/5 bg-white/[0.02]',
            ].join(' ')}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={() => !editMode && onToggleExpanded(module.id)}
                className="flex items-center gap-3 text-left"
              >
                <span className="text-base">{module.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{module.label}</div>
                  <div className="text-xs text-slate-400">
                    {active ? `${modulePerms.length} active permissions` : 'No access'}
                  </div>
                </div>
              </button>

              {editMode ? (
                <button
                  type="button"
                  onClick={() => onToggleAll(module.id)}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-500/20"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Toggle All
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleExpanded(module.id)}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-900"
                >
                  {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  Details
                </button>
              )}
            </div>

            {(editMode || expanded) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {permissions.map((perm) => {
                  const isOn = modulePerms.includes(perm);
                  return editMode ? (
                    <PermissionToggle
                      key={perm}
                      perm={perm}
                      enabled={isOn}
                      onClick={() => onTogglePerm(module.id, perm)}
                    />
                  ) : (
                    <span
                      key={perm}
                      className={[
                        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
                        isOn
                          ? 'border-transparent bg-white/10 text-white'
                          : 'border-white/5 bg-transparent text-slate-500',
                      ].join(' ')}
                    >
                      {perm}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PermissionToggle({ perm, enabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition',
        enabled
          ? 'border-transparent text-white shadow-sm'
          : 'border-white/10 bg-transparent text-slate-400 hover:bg-white/5',
      ].join(' ')}
      style={enabled ? { backgroundColor: `${permColor[perm] || '#64748B'}22` } : undefined}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: enabled ? (permColor[perm] || '#64748B') : '#475569' }}
      />
      {perm}
    </button>
  );
}

function RoleModal({ mode, draft, onClose, onChange, onSave, modules, permissions, onTogglePerm, onToggleAll }) {
  const canSave = !!draft?.name?.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold">{mode === 'edit' ? 'Edit Role' : 'Create Role'}</h3>
            <p className="text-sm text-slate-400">Tenant-scoped role configuration</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Role Name
              </label>
              <input
                value={draft?.name || ''}
                onChange={(e) => onChange((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/40"
                placeholder="Enter role name"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Description
              </label>
              <textarea
                value={draft?.description || ''}
                onChange={(e) => onChange((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/40"
                placeholder="Short role description"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Accent Color
              </label>
              <input
                value={draft?.color || '#94A3B8'}
                onChange={(e) => onChange((prev) => ({ ...prev, color: e.target.value }))}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none transition focus:border-violet-400/40"
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-white">Permission Matrix</div>
              <button
                onClick={() => {
                  const next = Object.fromEntries(modules.map((m) => [m.id, permissions]));
                  onChange((prev) => ({ ...prev, permissions: next }));
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                type="button"
              >
                Apply All Permissions
              </button>
            </div>

            <div className="space-y-3">
              {modules.map((module) => (
                <div key={module.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-base">{module.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{module.label}</div>
                        <div className="text-xs text-slate-400">Configure access for this module</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleAll(module.id)}
                      className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-900"
                    >
                      Toggle All
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {permissions.map((perm) => {
                      const enabled = safeArray(draft?.permissions?.[module.id]).includes(perm);
                      return (
                        <PermissionToggle
                          key={perm}
                          perm={perm}
                          enabled={enabled}
                          onClick={() => onTogglePerm(module.id, perm)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            type="button"
          >
            Cancel
          </button>
          <button
            disabled={!canSave}
            onClick={onSave}
            className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
          >
            {mode === 'edit' ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function ConfirmDialog({ title, description, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/40">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}