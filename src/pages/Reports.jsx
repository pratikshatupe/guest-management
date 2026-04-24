import React, { useMemo, useState } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import ReportCards from '../components/ReportCards';
import Charts from '../components/Charts';
import StaffPerformance from '../components/StaffPerformance';
import ReportsTable from '../components/ReportsTable';
import {
  NoShowCancellationCard,
  OfficeComparisonChart,
  PeakHoursChart,
  ServiceSLAPanel,
  TopHostsCard,
  VisitDurationCard,
} from '../components/VisitorAnalytics';
import {
  computeVisitorStats,
  computeOfficeComparison,
  computePeakHours,
  computeServiceSLA,
  computeTopHosts,
} from '../utils/reportAnalytics';
import { downloadCsv, downloadXls, printToPdf } from '../utils/exporters';

/* ─── Date-range helpers ────────────────────────────────────────── */
const todayStr = () => new Date().toISOString().slice(0, 10);

function startOfWeek(d = new Date()) {
  const copy = new Date(d);
  const dow = copy.getDay(); /* 0 = Sun */
  copy.setDate(copy.getDate() - dow);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Returns { from, to } as ISO date strings (YYYY-MM-DD), inclusive. */
function resolveRange(range, customStart, customEnd) {
  const today = todayStr();
  if (range === 'today') return { from: today, to: today };
  if (range === 'week') {
    return {
      from: startOfWeek().toISOString().slice(0, 10),
      to:   today,
    };
  }
  if (range === 'custom') {
    return {
      from: customStart || '0000-01-01',
      to:   customEnd   || '9999-12-31',
    };
  }
  return { from: '0000-01-01', to: '9999-12-31' };
}

function withinRange(iso, from, to) {
  if (!iso) return false;
  const day = iso.slice(0, 10);
  return day >= from && day <= to;
}

/* ─── Range selector UI ─────────────────────────────────────────── */
const RANGE_OPTIONS = [
  { id: 'today',  label: 'Today'     },
  { id: 'week',   label: 'This Week' },
  { id: 'all',    label: 'All Time'  },
  { id: 'custom', label: 'Custom'    },
];

function RangeBar({ range, onRangeChange, customStart, customEnd, onCustomStart, onCustomEnd }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onRangeChange(opt.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              range === opt.id ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {range === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStart(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-400"
            aria-label="Custom range start"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEnd(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-400"
            aria-label="Custom range end"
          />
        </div>
      )}
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────── */
export default function Reports() {
  const { appointments, guestLog, services, staff, loading } = useAppointments();

  const [range, setRange]             = useState('week');
  const [customStart, setCustomStart] = useState(todayStr());
  const [customEnd, setCustomEnd]     = useState(todayStr());

  const resolvedRange = useMemo(
    () => resolveRange(range, customStart, customEnd),
    [range, customStart, customEnd],
  );

  /* Every chart / table / card reads from this one filtered subset. */
  const servicesInRange = useMemo(
    () => services.filter(
      (s) => withinRange(s.createdAt, resolvedRange.from, resolvedRange.to),
    ),
    [services, resolvedRange],
  );

  const summary = useMemo(() => ({
    visitors:          guestLog.length,
    appointments:      appointments.length,
    services:          servicesInRange.length,
    completedServices: servicesInRange.filter((s) => s.status === 'Completed').length,
    pendingServices:   servicesInRange.filter((s) => s.status === 'Pending').length,
  }), [appointments, guestLog, servicesInRange]);

  const daysForBarChart = range === 'today' ? 1 : range === 'week' ? 7 : 30;

  const visitorStats = useMemo(
    () => computeVisitorStats(appointments, guestLog, resolvedRange),
    [appointments, guestLog, resolvedRange],
  );
  const officeRows = useMemo(
    () => computeOfficeComparison(appointments, guestLog, staff, resolvedRange),
    [appointments, guestLog, staff, resolvedRange],
  );
  const peakHours = useMemo(
    () => computePeakHours(guestLog, appointments, resolvedRange),
    [guestLog, appointments, resolvedRange],
  );
  const sla = useMemo(
    () => computeServiceSLA(servicesInRange),
    [servicesInRange],
  );
  const topHosts = useMemo(
    () => computeTopHosts(guestLog, resolvedRange, 5),
    [guestLog, resolvedRange],
  );

  const exportRows = useMemo(() =>
    servicesInRange
      .slice()
      .sort((a, b) => (b.completedAt || b.createdAt || '').localeCompare(a.completedAt || a.createdAt || ''))
      .map((s) => ({
        visitor_name:   s.visitorName,
        service_type:   s.serviceType,
        assigned_staff: s.assignedStaff,
        status:         s.status,
        created_at:     s.createdAt || '',
        completed_at:   s.completedAt || '',
        notes:          s.notes || '',
      })),
    [servicesInRange],
  );

  const exportFileBase = `service-report-${resolvedRange.from}_${resolvedRange.to}`;

  const handleExportCsv  = () => downloadCsv(`${exportFileBase}.csv`, exportRows);
  const handleExportXls  = () => downloadXls(`${exportFileBase}.xls`, exportRows, { title: 'Service Report' });
  const handleExportPdf  = () => printToPdf(exportRows, {
    title:    'Service Report',
    subtitle: `Range: ${resolvedRange.from} → ${resolvedRange.to}`,
  });

  const canExport = exportRows.length > 0;

  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Reports</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {range === 'today'  ? "Today's activity."
                : range === 'week' ? 'Rolling last 7 days.'
                : range === 'custom' ? `Custom range: ${resolvedRange.from} → ${resolvedRange.to}.`
                : 'All-time activity.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RangeBar
              range={range}
              onRangeChange={setRange}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStart={setCustomStart}
              onCustomEnd={setCustomEnd}
            />
            <div className="inline-flex rounded-lg border border-sky-200 bg-white p-0.5">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!canExport}
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                title="Download as CSV"
              >
                ⬇ CSV
              </button>
              <button
                type="button"
                onClick={handleExportXls}
                disabled={!canExport}
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                title="Download as Excel (.xls)"
              >
                ⬇ Excel
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!canExport}
                className="rounded-md px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
                title="Print or Save as PDF"
              >
                ⬇ PDF
              </button>
            </div>
          </div>
        </div>

        <ReportCards stats={summary} />

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-700" />
          </div>
        ) : (
          <>
            <NoShowCancellationCard stats={visitorStats} />
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <VisitDurationCard stats={visitorStats} />
              <TopHostsCard rows={topHosts} />
            </div>
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <OfficeComparisonChart rows={officeRows} />
              <PeakHoursChart buckets={peakHours.buckets} peakHour={peakHours.peakHour} />
            </div>
            <ServiceSLAPanel sla={sla} />
            <Charts services={servicesInRange} days={daysForBarChart} />
            <StaffPerformance services={servicesInRange} staff={staff} />
            <ReportsTable services={servicesInRange} staff={staff} />
          </>
        )}
      </div>
    </div>
  );
}
