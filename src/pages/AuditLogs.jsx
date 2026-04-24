import React, { useEffect, useMemo, useState } from 'react';
import { useLog } from '../context/LogContext';
import LogTable from '../components/LogTable';
import Pagination from '../components/ui/Pagination';
import ConfirmModal from '../components/ui/ConfirmModal';

/* Group actions into broad categories for the action-type filter. */
function actionCategory(action) {
  const a = action.toLowerCase();
  if (/created|added|check-?in|walk-in/.test(a))  return 'create';
  if (/updated|edited|assigned/.test(a))           return 'update';
  if (/deleted|removed|rejected|no-show/.test(a))  return 'delete';
  if (/approved|started|completed|check-?out/.test(a)) return 'status';
  return 'other';
}

const CATEGORY_OPTIONS = [
  { id: 'all',    label: 'All actions' },
  { id: 'create', label: 'Create'      },
  { id: 'update', label: 'Update'      },
  { id: 'delete', label: 'Delete'      },
  { id: 'status', label: 'Status'      },
  { id: 'other',  label: 'Other'       },
];

function StatCard({ label, value, tone }) {
  const toneCls = {
    violet:  'border-sky-100 bg-sky-50 text-sky-700',
    green:   'border-green-100 bg-green-50 text-green-700',
    blue:    'border-blue-100 bg-blue-50 text-blue-700',
    red:     'border-red-100 bg-red-50 text-red-700',
  }[tone];
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneCls}`}>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1.5 text-[12px] font-semibold opacity-80">{label}</p>
    </div>
  );
}

export default function AuditLogs() {
  const { logs, clearLogs } = useLog();

  const [search, setSearch]             = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [userFilter, setUserFilter]     = useState('all');
  const [dateFilter, setDateFilter]     = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage]                 = useState(1);
  const [perPage, setPerPage]           = useState(20);
  const [confirmOpen, setConfirmOpen]   = useState(false);

  const moduleOptions = useMemo(() => {
    const set = new Set(logs.map((l) => l.module).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  const userOptions = useMemo(() => {
    const set = new Set(logs.map((l) => l.performedBy).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      if (moduleFilter !== 'all' && log.module !== moduleFilter) return false;
      if (userFilter !== 'all'   && log.performedBy !== userFilter) return false;
      if (categoryFilter !== 'all' && actionCategory(log.action) !== categoryFilter) return false;
      if (dateFilter && (log.timestamp || '').slice(0, 10) !== dateFilter) return false;
      if (!q) return true;
      const metadataBlob = Object.values(log.metadata || {}).join(' ').toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        (log.performedBy || '').toLowerCase().includes(q) ||
        metadataBlob.includes(q)
      );
    });
  }, [logs, search, moduleFilter, userFilter, categoryFilter, dateFilter]);

  /* Reset to page 1 when any filter narrows the list. */
  useEffect(() => { setPage(1); }, [search, moduleFilter, userFilter, categoryFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    return filtered.slice(startIndex, startIndex + perPage);
  }, [filtered, page, perPage]);

  const stats = useMemo(() => ({
    total:   logs.length,
    today:   logs.filter((l) => (l.timestamp || '').slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
    creates: logs.filter((l) => actionCategory(l.action) === 'create').length,
    deletes: logs.filter((l) => actionCategory(l.action) === 'delete').length,
  }), [logs]);

  const hasFilters = Boolean(
    search || moduleFilter !== 'all' || userFilter !== 'all' ||
    categoryFilter !== 'all' || dateFilter
  );

  const handleClear = () => {
    setConfirmOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Audit Logs</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Activity trail across every module. Updated live.
            </p>
          </div>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
            >
              Clear all logs
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total"     value={stats.total}   tone="violet" />
          <StatCard label="Today"     value={stats.today}   tone="blue" />
          <StatCard label="Creations" value={stats.creates} tone="green" />
          <StatCard label="Deletions" value={stats.deletes} tone="red" />
        </div>

        <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, user, or details…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 md:max-w-sm"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"
              >
                <option value="all">All modules</option>
                {moduleOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"
              >
                <option value="all">All users</option>
                {userOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"
              />
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setModuleFilter('all');
                    setUserFilter('all');
                    setCategoryFilter('all');
                    setDateFilter('');
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </div>
          </header>

          <LogTable rows={paginated} startIndex={(page - 1) * perPage} />

          {filtered.length > 0 && (
            <Pagination
              page={page}
              perPage={perPage}
              total={filtered.length}
              onPageChange={setPage}
              onPerPageChange={(next) => { setPerPage(next); setPage(1); }}
              pageSizes={[10, 20, 50, 100]}
            />
          )}
        </section>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Clear Audit Logs"
        message="Are you sure you want to delete the entire audit log? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { clearLogs(); setConfirmOpen(false); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
