/**
 * Audit Logger — fire-and-forget write helper for the Audit Logs module.
 *
 * Writes to localStorage under STORAGE_KEYS.AUDIT_LOGS and fans the change
 * out across same-tab consumers:
 *   • 'cgms:storage'        — makes useCollection pick up the change in-tab
 *   • 'audit-logs-updated'  — public event anyone can listen for
 *
 * Log shape:
 *   {
 *     id,
 *     userName,
 *     role,
 *     action:      'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT',
 *     module:      'Staff' | 'Offices' | 'Subscription' | 'Auth' | ...,
 *     description,
 *     timestamp:   number (epoch ms)
 *   }
 *
 * Capped at MAX_LOGS newest entries so the store can't grow without bound.
 */
import { STORAGE_KEYS, SAME_TAB_EVENT } from '../store';

const KEY = STORAGE_KEYS.AUDIT_LOGS;
const MAX_LOGS = 1000;
const AUDIT_EVENT = 'audit-logs-updated';

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `log-${crypto.randomUUID()}`;
  }
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeRead() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function broadcast() {
  try {
    window.dispatchEvent(new CustomEvent(SAME_TAB_EVENT, { detail: { key: KEY } }));
    window.dispatchEvent(new Event(AUDIT_EVENT));
  } catch {
    /* No-op — jsdom / unsupported envs. */
  }
}

/**
 * Append a new audit log. Silently no-ops if storage is unavailable.
 *   addAuditLog({ userName, role, action, module, description, orgId? });
 *
 * `orgId` is auto-filled from the logged-in user when the caller doesn't
 * supply one, so every row is tenant-scoped by default and the Audit Logs
 * page can safely filter by org for non-Super-Admin viewers.
 */
export function addAuditLog(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const current = getCurrentUserSnapshot();
  const row = {
    id:          makeId(),
    userName:    entry.userName || current.name || 'System',
    role:        entry.role     || current.role || '',
    action:      entry.action   || 'UPDATE',
    module:      entry.module   || 'Unknown',
    description: entry.description || '',
    orgId:       entry.orgId !== undefined ? entry.orgId : current.orgId,
    timestamp:   Date.now(),
  };

  const next = [row, ...safeRead()].slice(0, MAX_LOGS);
  safeWrite(next);
  broadcast();
  return row;
}

/**
 * Read the currently-logged-in user from AuthContext's localStorage mirror.
 * Used as a fallback when callers don't have `useAuth()` in scope.
 */
export function getCurrentUserSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return { name: 'System', role: '', orgId: null };
    const u = JSON.parse(raw) || {};
    return {
      name:  u.name || u.label || 'System',
      role:  (u.role || '').toString(),
      orgId: u.organisationId || u.orgId || null,
    };
  } catch {
    return { name: 'System', role: '', orgId: null };
  }
}

export const AUDIT_LOGS_UPDATED_EVENT = AUDIT_EVENT;
