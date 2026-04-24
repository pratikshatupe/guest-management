import React, { useMemo, useState } from 'react';
import WalkInForm from '../components/WalkInForm';
import { useAppointments } from '../context/AppointmentContext';
import { useVisibleGuestLog, useVisibleStaff } from '../hooks/useVisibleData';
import { printVisitorBadge } from '../utils/printBadge';

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function StatusPill({ status }) {
  const cls = status === 'Inside'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-100 text-slate-600';
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

function WalkInCard({ entry, onCheckOut, onPrintBadge }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-bold text-slate-800">{entry.guestName}</h4>
          <p className="truncate text-xs text-slate-500">{entry.company || '—'}</p>
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
      </dl>
      {entry.status === 'Inside' && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onPrintBadge?.(entry)}
            className="flex-1 rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
          >
            🖨 Badge
          </button>
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

export default function WalkIn({ user }) {
  const { walkInCheckIn, checkOutVisitor } = useAppointments();
  const guestLog = useVisibleGuestLog();
  const staff    = useVisibleStaff();
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const walkIns = useMemo(
    () => guestLog
      .filter((g) => g.type === 'Walk-in')
      .sort((a, b) => (b.checkInTime || '').localeCompare(a.checkInTime || '')),
    [guestLog],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return walkIns.filter((g) => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (!q) return true;
      return (
        g.guestName?.toLowerCase().includes(q) ||
        g.company?.toLowerCase().includes(q) ||
        g.host?.toLowerCase().includes(q) ||
        g.contactNumber?.toLowerCase().includes(q)
      );
    });
  }, [walkIns, search, statusFilter]);

  const stats = useMemo(() => ({
    total:      walkIns.length,
    inside:     walkIns.filter((g) => g.status === 'Inside').length,
    checkedOut: walkIns.filter((g) => g.status === 'Checked Out').length,
  }), [walkIns]);

  const [lastCheckIn, setLastCheckIn] = useState(null);

  const handleSubmit = (form) => {
    setSubmitting(true);
    setTimeout(() => {
      const entry = walkInCheckIn(form);
      if (entry) setLastCheckIn(entry);
      setSubmitting(false);
    }, 200);
  };

  const handlePrintBadge = (entry) => {
    if (!entry) return;
    printVisitorBadge({
      id:            entry.id,
      guestName:     entry.guestName,
      company:       entry.company,
      host:          entry.host,
      purpose:       entry.purpose,
      checkInTime:   entry.checkInTime,
      photoDataUrl:  entry.photoDataUrl,
      idType:        entry.idType,
      idNumber:      entry.idNumber,
      officeName:    user?.officeName || '',
    });
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Walk-in Check-in</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Check in visitors without a prior appointment.
            {user?.name ? ` Reception: ${user.name}.` : ''}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total Walk-ins" value={stats.total}      tone="violet" />
          <StatCard label="Currently In"   value={stats.inside}     tone="emerald" />
          <StatCard label="Checked Out"    value={stats.checkedOut} tone="slate" />
        </div>

        {lastCheckIn && (
          <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">✓ {lastCheckIn.guestName} checked in.</p>
              <p className="text-xs opacity-80">
                Badge {lastCheckIn.id} · {formatTime(lastCheckIn.checkInTime)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePrintBadge(lastCheckIn)}
                className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
              >
                🖨 Print Badge
              </button>
              <button
                type="button"
                onClick={() => setLastCheckIn(null)}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Form card */}
        <section className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">New Walk-in</h3>
            <span className="text-[11px] font-semibold text-emerald-700">
              Status on submit → Inside
            </span>
          </div>
          <WalkInForm
            staff={staff}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        </section>

        {/* Walk-in list */}
        <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <h3 className="text-sm font-bold text-slate-800">Walk-in History</h3>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search walk-ins…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 md:w-60"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-400"
              >
                <option value="all">All statuses</option>
                <option value="Inside">Inside</option>
                <option value="Checked Out">Checked Out</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 text-4xl" aria-hidden="true">🚶</div>
              <h4 className="text-sm font-semibold text-slate-700">No records found.</h4>
              <p className="mt-1 text-xs text-slate-400">
                {walkIns.length === 0
                  ? 'Check in your first walk-in visitor above.'
                  : 'Try adjusting your search or status filter.'}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:hidden">
                {filtered.map((g) => (
                  <WalkInCard
                    key={g.id}
                    entry={g}
                    onCheckOut={(entry) => checkOutVisitor(entry.id)}
                    onPrintBadge={handlePrintBadge}
                  />
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden w-full overflow-x-auto md:block">
                <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Sr. No.</th>
                      <th className="px-4 py-3">Guest</th>
                      <th className="px-4 py-3">Host</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Check-in</th>
                      <th className="px-4 py-3">Check-out</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((g, idx) => (
                      <tr key={g.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{g.guestName}</div>
                          <div className="text-[11px] text-slate-400">{g.company || '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{g.host || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{g.contactNumber || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{formatTime(g.checkInTime)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatTime(g.checkOutTime)}</td>
                        <td className="px-4 py-3"><StatusPill status={g.status} /></td>
                        <td className="px-4 py-3 text-right">
                          {g.status === 'Inside' ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handlePrintBadge(g)}
                                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-700 hover:bg-sky-50"
                                title="Print badge"
                              >
                                🖨
                              </button>
                              <button
                                type="button"
                                onClick={() => checkOutVisitor(g.id)}
                                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Check-out
                              </button>
                            </div>
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
      </div>
    </div>
  );
}
