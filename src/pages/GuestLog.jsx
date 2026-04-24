import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useVisibleGuestLog, useVisibleStaff } from '../hooks/useVisibleData';
import Pagination from '../components/ui/Pagination';
import { downloadCsv, downloadXls, printToPdf } from '../utils/exporters';

const todayStr = () => new Date().toISOString().slice(0, 10);

/** Inclusive-range check on ISO datetime against YYYY-MM-DD bounds. */
function withinDay(iso, fromDay, toDay) {
  if (!iso) return false;
  const day = iso.slice(0, 10);
  if (fromDay && day < fromDay) return false;
  if (toDay   && day > toDay)   return false;
  return true;
}

function resolveRange(range, customStart, customEnd) {
  const today = todayStr();
  if (range === 'today') return { from: today, to: today };
  if (range === 'week') {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString().slice(0, 10), to: today };
  }
  if (range === 'month') {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return { from: d.toISOString().slice(0, 10), to: today };
  }
  if (range === 'custom') {
    return { from: customStart || '', to: customEnd || '' };
  }
  return { from: '', to: '' };
}

/**
 * Guest Log — driven entirely from the shared AppointmentContext.
 * Entries are created on check-in and closed out on check-out.
 */

const STATUS_BADGE = {
  Inside:        'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Checked Out': 'border-slate-200 bg-slate-100 text-slate-600',
};

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function durationMinutes(inIso, outIso) {
  if (!inIso) return null;
  const end = outIso ? new Date(outIso) : new Date();
  const start = new Date(inIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

function formatDuration(mins) {
  if (mins == null) return '—';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function StatusPill({ status }) {
  const cls = STATUS_BADGE[status] || 'border-slate-200 bg-slate-100 text-slate-500';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, tone }) {
  const toneCls = {
    violet:  'border-sky-100 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    slate:   'border-slate-100 bg-slate-50 text-slate-700',
  }[tone];
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneCls}`}>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1.5 text-[12px] font-semibold opacity-80">{label}</p>
    </div>
  );
}

function GuestLogCard({ entry, onCheckOut, canCheckOut }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-bold text-slate-800">{entry.guestName}</h4>
          <p className="truncate text-xs text-slate-500">
            {entry.company || '—'}{entry.type ? ` · ${entry.type}` : ''}
          </p>
        </div>
        <StatusPill status={entry.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Host</dt>
          <dd className="mt-0.5 truncate text-slate-700">{entry.host || '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Contact</dt>
          <dd className="mt-0.5 truncate text-slate-700">{entry.contactNumber || '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Check-in</dt>
          <dd className="mt-0.5 text-slate-700">{formatTime(entry.checkInTime)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Check-out</dt>
          <dd className="mt-0.5 text-slate-700">{formatTime(entry.checkOutTime)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Duration</dt>
          <dd className="mt-0.5 text-slate-700">
            {formatDuration(durationMinutes(entry.checkInTime, entry.checkOutTime))}
          </dd>
        </div>
      </dl>
      {entry.status === 'Inside' && canCheckOut && (
        <div className="mt-4 flex">
          <button
            type="button"
            onClick={() => onCheckOut?.(entry)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Check-out
          </button>
        </div>
      )}
    </div>
  );
}

export default function GuestLog() {
  const { loading, checkOutVisitor } = useAppointments();
  /* Role-scoped view — Super Admin/Director see everything in their org,
     Manager/Reception see office-scoped data, Service Staff see nothing. */
  const guestLog = useVisibleGuestLog();
  const staff    = useVisibleStaff();
  /* Guest Log only mutates via Check-out — gated as an `edit` on the
     guest-log module so Super Admin can revoke it from the matrix. */
  const { hasPermission } = useRole();
  const { user } = useAuth();
  const isReception = (user?.role || '').toLowerCase() === 'reception';
  const canCheckOut = hasPermission('guest-log', 'edit');
  /* Reception gets the minimal "front desk" view — no exports, no advanced
     filters (date/office/visitor type). The spec caps them to basic search
     + status and today/active visitors only. */
  const canExport   = hasPermission('guest-log', 'view') && !isReception;
  const showAdvancedFilters = !isReception;
  const handleCheckOut = useCallback((entry) => {
    if (!hasPermission('guest-log', 'edit')) return;
    checkOutVisitor(entry.id);
  }, [hasPermission, checkOutVisitor]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter]     = useState('all'); /* all | Walk-in | Appointment */
  const [officeFilter, setOfficeFilter] = useState('all');
  /* Reception's Guest Log defaults to "Today" — they're front-desk and only
     act on current-day visitors. Other roles see the full history. */
  const [range, setRange]               = useState(isReception ? 'today' : 'all');
  const [customStart, setCustomStart]   = useState(todayStr());
  const [customEnd, setCustomEnd]       = useState(todayStr());
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  /* Offices are derived from the scoped staff list so a Director only sees
     their organisation's offices (never cross-tenant). */
  const officeOptions = useMemo(() => {
    const offices = new Set();
    staff.forEach((s) => { if (s.officeId) offices.add(s.officeId); });
    return Array.from(offices).sort();
  }, [staff]);

  /* Quick host-name → officeId lookup for resolving an entry's office. */
  const staffIndex = useMemo(() => {
    const byName = new Map();
    const byId   = new Map();
    staff.forEach((s) => {
      if (s.name) byName.set(s.name.toLowerCase(), s.officeId || null);
      if (s.id)   byId.set(s.id, s.officeId || null);
    });
    return { byName, byId };
  }, [staff]);

  const resolvedRange = useMemo(
    () => resolveRange(range, customStart, customEnd),
    [range, customStart, customEnd],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guestLog
      .slice()
      .sort((a, b) => (b.checkInTime || '').localeCompare(a.checkInTime || ''))
      .filter((g) => {
        if (statusFilter !== 'all' && g.status !== statusFilter) return false;
        if (typeFilter   !== 'all' && (g.type || '') !== typeFilter) return false;
        if (range !== 'all') {
          const withinRange = withinDay(g.checkInTime, resolvedRange.from, resolvedRange.to);
          /* Reception always sees anyone still on-premises, even if their
             check-in date falls outside today's window (overnight visits). */
          const stillInside = isReception && g.status === 'Inside';
          if (!withinRange && !stillInside) return false;
        }
        if (officeFilter !== 'all') {
          const office = g.officeId
            || staffIndex.byName.get((g.host || '').toLowerCase())
            || null;
          if (office !== officeFilter) return false;
        }
        if (!q) return true;
        return (
          g.guestName?.toLowerCase().includes(q) ||
          g.company?.toLowerCase().includes(q) ||
          g.host?.toLowerCase().includes(q) ||
          g.contactNumber?.toLowerCase().includes(q)
        );
      });
  }, [guestLog, search, statusFilter, typeFilter, officeFilter, range, resolvedRange, staffIndex, isReception]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, officeFilter, range, customStart, customEnd]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    return filtered.slice(startIndex, startIndex + perPage);
  }, [filtered, page, perPage]);

  const stats = useMemo(() => ({
    total:      guestLog.length,
    inside:     guestLog.filter((g) => g.status === 'Inside').length,
    checkedOut: guestLog.filter((g) => g.status === 'Checked Out').length,
  }), [guestLog]);

  const exportRows = useMemo(
    () => filtered.map((g) => ({
      guest_name:   g.guestName,
      company:      g.company || '',
      type:         g.type || '',
      host:         g.host || '',
      contact:      g.contactNumber || '',
      check_in:     g.checkInTime || '',
      check_out:    g.checkOutTime || '',
      duration_min: durationMinutes(g.checkInTime, g.checkOutTime) ?? '',
      status:       g.status || '',
    })),
    [filtered],
  );

  const exportBase = useMemo(() => {
    const from = resolvedRange.from || 'all';
    const to   = resolvedRange.to   || 'time';
    return `guest-log-${from}_${to}`;
  }, [resolvedRange]);

  const handleExportCsv  = () => downloadCsv(`${exportBase}.csv`, exportRows);
  const handleExportXls  = () => downloadXls(`${exportBase}.xls`, exportRows, { title: 'Guest Log' });
  const handleExportPdf  = () =>
    printToPdf(exportRows, {
      title:    'Guest Log',
      subtitle: range === 'all'
        ? 'Full visitor history'
        : `Range: ${resolvedRange.from || '—'} → ${resolvedRange.to || '—'}`,
    });

  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Guest Log</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Real-time check-in and check-out history.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Visits"  value={stats.total}      tone="violet" />
          <StatCard label="Currently In"  value={stats.inside}     tone="emerald" />
          <StatCard label="Checked Out"   value={stats.checkedOut} tone="slate" />
        </div>

        <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
            {/* Top row — search + export */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by guest, company, host, phone…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 md:max-w-sm"
              />
              {canExport && (
                <div className="inline-flex rounded-lg border border-sky-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={exportRows.length === 0}
                    className="rounded-md px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                    title="Download as CSV"
                  >
                    ⬇ CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleExportXls}
                    disabled={exportRows.length === 0}
                    className="rounded-md px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                    title="Download as Excel (.xls)"
                  >
                    ⬇ Excel
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    disabled={exportRows.length === 0}
                    className="rounded-md px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                    title="Print or Save as PDF"
                  >
                    ⬇ PDF
                  </button>
                </div>
              )}
            </div>

            {/* Bottom row — filter toolbar. Reception gets a minimal version
                (status only); everyone else gets the full advanced set. */}
            <div className="flex flex-wrap items-center gap-2">
              {showAdvancedFilters && (
                <>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                    {[
                      { id: 'all',    label: 'All Time' },
                      { id: 'today',  label: 'Today' },
                      { id: 'week',   label: 'Last 7 Days' },
                      { id: 'month',  label: 'Last 30 Days' },
                      { id: 'custom', label: 'Custom' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRange(opt.id)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          range === opt.id ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {range === 'custom' && (
                    <>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-400"
                        aria-label="Custom range start"
                      />
                      <span className="text-xs text-slate-400">to</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-400"
                        aria-label="Custom range end"
                      />
                    </>
                  )}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"
                    aria-label="Visitor type"
                  >
                    <option value="all">All types</option>
                    <option value="Appointment">Pre-appointed</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                  <select
                    value={officeFilter}
                    onChange={(e) => setOfficeFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"
                    aria-label="Office"
                    disabled={officeOptions.length === 0}
                  >
                    <option value="all">All offices</option>
                    {officeOptions.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </>
              )}
              {isReception && (
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700">
                  Today's visitors
                </span>
              )}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"
                aria-label="Status"
              >
                <option value="all">All statuses</option>
                <option value="Inside">Inside</option>
                <option value="Checked Out">Checked Out</option>
              </select>
              {(range !== (isReception ? 'today' : 'all') || typeFilter !== 'all' || officeFilter !== 'all' || statusFilter !== 'all' || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setRange(isReception ? 'today' : 'all');
                    setTypeFilter('all');
                    setOfficeFilter('all');
                    setStatusFilter('all');
                    setSearch('');
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-700" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 text-4xl" aria-hidden="true">📋</div>
              <h4 className="text-sm font-semibold text-slate-700">No records found.</h4>
              <p className="mt-1 text-xs text-slate-400">
                Check in a visitor from the Appointments page to log them here.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:hidden">
                {paginated.map((g) => (
                  <GuestLogCard
                    key={g.id}
                    entry={g}
                    canCheckOut={canCheckOut}
                    onCheckOut={handleCheckOut}
                  />
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden w-full overflow-x-auto md:block">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Sr. No.</th>
                      <th className="px-4 py-3">Guest</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Host</th>
                      <th className="px-4 py-3">Check-in</th>
                      <th className="px-4 py-3">Check-out</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginated.map((g, idx) => (
                      <tr key={g.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-slate-500">{(page - 1) * perPage + idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{g.guestName}</div>
                          <div className="text-[11px] text-slate-400">{g.company || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{g.type || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{g.host || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{formatTime(g.checkInTime)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatTime(g.checkOutTime)}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDuration(durationMinutes(g.checkInTime, g.checkOutTime))}
                        </td>
                        <td className="px-4 py-3"><StatusPill status={g.status} /></td>
                        <td className="px-4 py-3 text-right">
                          {g.status === 'Inside' && canCheckOut ? (
                            <button
                              type="button"
                              onClick={() => handleCheckOut(g)}
                              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Check-out
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {filtered.length > 0 && (
          <Pagination
            page={page}
            perPage={perPage}
            total={filtered.length}
            onPageChange={setPage}
            onPerPageChange={(next) => { setPerPage(next); setPage(1); }}
            pageSizes={[5, 10, 20, 50]}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
          />
        )}
      </div>
    </div>
  );
}
