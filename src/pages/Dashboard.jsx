import React, { useEffect, useMemo, useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import {
  Users, CalendarCheck, Building2, UserCheck, AlertTriangle,
  BadgeCheck, LifeBuoy, UserPlus, CalendarPlus, FileBarChart2,
  ArrowRight, Clock3, CheckCircle2, Circle, Sparkles, Search, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import { useCollection, STORAGE_KEYS } from '../store';
import NoAccess from '../components/NoAccess';
import SuperAdminDashboard from './Dashboard/SuperAdminDashboard';
import { Pagination } from '../components/ui';
import {
  MOCK_ORGANIZATIONS, MOCK_OFFICES, MOCK_APPOINTMENTS,
  MOCK_STAFF, MOCK_VISITORS, MOCK_WALKINS, MOCK_SERVICES,
  MOCK_ROOMS,
} from '../data/mockData';

/**
 * Dashboard — unified entry for every role.
 *
 * Super Admin branches early to the platform dashboard (which is
 * intentionally different, not a tenant view). Every other role
 * (Director, Manager, Reception) lands on this org-scoped dashboard
 * which derives all metrics from the logged-in user's organisation.
 *
 * Tenant isolation: every collection is filtered by `user.orgId`
 * before a single metric is computed — a Director from one tenant
 * can never see another tenant's data even if the raw store contains
 * cross-tenant rows.
 */

/* ── helpers ──────────────────────────────────────────────────────── */

/** 24h → 12h with uppercase AM/PM. Accepts HH:mm, ISO, or epoch ms. */
function formatAmPm(input) {
  if (input == null || input === '') return '—';
  let d;
  if (typeof input === 'number') {
    d = new Date(input);
  } else if (/^\d{2}:\d{2}$/.test(String(input))) {
    const [hh, mm] = String(input).split(':').map(Number);
    d = new Date();
    d.setHours(hh, mm, 0, 0);
  } else {
    d = new Date(input);
  }
  if (Number.isNaN(d.getTime())) return '—';
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

/** Friendly date in en-GB — "19/04/2026". */
function formatDateGB(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Scope a record to the given org. Records without orgId are treated
 *  as legacy rows and pass through — see visibilityFilters.filterByOrg
 *  for the canonical behaviour. */
function byOrg(records, orgId) {
  if (!Array.isArray(records) || !orgId) return [];
  return records.filter((r) => !r?.orgId || r.orgId === orgId);
}

/* ── RBAC-gated top-level component ───────────────────────────────── */

export default function Dashboard({ user: propUser, setActivePage }) {
  const { user: authUser } = useAuth();
  const { hasPermission } = useRole();
  const user = propUser || authUser;

  /* Super Admin → platform overview, entirely different UI. */
  if ((user?.role || '').toLowerCase() === 'superadmin') {
    return <SuperAdminDashboard user={user} />;
  }

  if (!hasPermission('dashboard', 'view')) {
    return (
      <NoAccess
        module="Dashboard"
        onGoBack={setActivePage ? () => setActivePage('dashboard') : undefined}
      />
    );
  }

  return <OrgDashboard user={user} setActivePage={setActivePage} />;
}

/* ═══════════════════════════════════════════════════════════════════
 *   Director / Manager / Reception dashboard
 * ═══════════════════════════════════════════════════════════════════ */

function OrgDashboard({ user, setActivePage }) {
  const orgId = user?.organisationId || user?.orgId || null;

  const [orgs]         = useCollection(STORAGE_KEYS.ORGANIZATIONS, MOCK_ORGANIZATIONS);
  const [offices]      = useCollection(STORAGE_KEYS.OFFICES,       MOCK_OFFICES);
  const [appointments] = useCollection(STORAGE_KEYS.APPOINTMENTS,  MOCK_APPOINTMENTS);
  const [guestLog]     = useCollection(STORAGE_KEYS.GUEST_LOG,     MOCK_VISITORS);
  const [walkIns]      = useCollection(STORAGE_KEYS.WALKINS,       MOCK_WALKINS);
  const [staff]        = useCollection(STORAGE_KEYS.STAFF,         MOCK_STAFF);
  const [services]     = useCollection(STORAGE_KEYS.SERVICES,      MOCK_SERVICES);
  const [rooms]        = useCollection(STORAGE_KEYS.ROOMS,         MOCK_ROOMS);

  /* 30-second auto-refresh tick for the Recent Activity feed. */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  /* Brief initial skeleton so the user sees structure before the data
     flashes in. Real app would await an async fetch here. */
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 300);
    return () => window.clearTimeout(id);
  }, []);

  /* Derive the logged-in user's org object. Falls back to the first
     matching MOCK row by name so demo logins without a stored orgId
     still get something sensible. */
  const org = useMemo(() => {
    if (!orgId) {
      const nameMatch = (MOCK_ORGANIZATIONS || []).find(
        (o) => o?.name?.toLowerCase() === (user?.organisation || user?.company || '').toLowerCase(),
      );
      return nameMatch || MOCK_ORGANIZATIONS[0] || null;
    }
    return (orgs || []).find((o) => o?.id === orgId) || null;
  }, [orgs, orgId, user]);

  const effectiveOrgId = org?.id || orgId;
  const isTrial        = String(org?.status || org?.plan || '').toLowerCase() === 'trial';
  const trialDaysLeft  = Number(org?.trialDaysLeft) || null;

  /* Everything is scoped to the tenant before rendering. */
  const orgAppointments = useMemo(() => byOrg(appointments, effectiveOrgId), [appointments, effectiveOrgId]);
  const orgGuestLog     = useMemo(() => byOrg(guestLog, effectiveOrgId),     [guestLog, effectiveOrgId]);
  const orgWalkIns      = useMemo(() => byOrg(walkIns, effectiveOrgId),      [walkIns, effectiveOrgId]);
  const orgOffices      = useMemo(() => byOrg(offices, effectiveOrgId),      [offices, effectiveOrgId]);
  const orgStaff        = useMemo(() => byOrg(staff, effectiveOrgId),        [staff, effectiveOrgId]);
  const orgServices     = useMemo(() => byOrg(services, effectiveOrgId),     [services, effectiveOrgId]);
  const orgRooms        = useMemo(() => byOrg(rooms, effectiveOrgId),        [rooms, effectiveOrgId]);

  const firstName = (user?.name || '').split(' ')[0] || 'there';

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 dark:bg-[#050E1A]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        {/* Temp-password banner — shown only to Director / Manager /
            Reception / Service Staff users whose session carries
            mustChangePassword=true. SuperAdmin short-circuits at the
            top-level Dashboard component and never reaches this body. */}
        {user?.mustChangePassword && (
          <TempPasswordBanner
            onChangePassword={() => {
              /* Module 8 deep-link — land directly on Security tab. */
              if (typeof window !== 'undefined') {
                try {
                  const url = new URL(window.location.href);
                  url.pathname = '/settings';
                  url.searchParams.set('tab', 'security');
                  window.history.pushState({}, '', url);
                } catch { /* no-op */ }
              }
              setActivePage?.('settings');
            }}
          />
        )}

        {/* 1. Welcome Header */}
        <WelcomeHeader user={user} org={org} firstName={firstName} tick={tick} />

        {/* Trial Banner — only when plan = Trial with days remaining. */}
        {isTrial && trialDaysLeft != null && trialDaysLeft >= 0 && (
          <TrialBanner
            daysLeft={trialDaysLeft}
            onUpgrade={() => setActivePage?.('subscription')}
          />
        )}

        {/* 2. KPI Cards */}
        <KpiCards
          appointments={orgAppointments}
          guestLog={orgGuestLog}
          walkIns={orgWalkIns}
          offices={orgOffices}
          staff={orgStaff}
          onNavigate={setActivePage}
        />

        {/* 3. Critical Alerts */}
        <CriticalAlerts
          appointments={orgAppointments}
          services={orgServices}
          onNavigate={setActivePage}
        />

        {/* 4. Quick Actions */}
        <QuickActions onNavigate={setActivePage} />

        {/* 5. Visitor Trend Chart */}
        <VisitorTrendChart
          appointments={orgAppointments}
          guestLog={orgGuestLog}
          walkIns={orgWalkIns}
        />

        {/* 6. Recent Activity Feed */}
        <RecentActivity
          appointments={orgAppointments}
          guestLog={orgGuestLog}
          walkIns={orgWalkIns}
          services={orgServices}
          tick={tick}
        />

        {/* 7. Office Status Table */}
        <OfficeStatusTable
          offices={orgOffices}
          appointments={orgAppointments}
          walkIns={orgWalkIns}
          rooms={orgRooms}
          onNavigate={setActivePage}
        />

        {/* 8. Onboarding Checklist — Trial + incomplete setup only. */}
        <OnboardingChecklist
          isTrial={isTrial}
          offices={orgOffices}
          staff={orgStaff}
          appointments={orgAppointments}
          walkIns={orgWalkIns}
          org={org}
          onNavigate={setActivePage}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *   1. Welcome Header
 * ═══════════════════════════════════════════════════════════════════ */

function WelcomeHeader({ user, org, firstName, tick }) {
  /* Re-read the wall clock each poll tick so the header time stays
     fresh without scheduling a second timer. */
  const now = useMemo(() => new Date(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning'
                 : hour < 17 ? 'Good afternoon'
                 : 'Good evening';

  return (
    <header className="rounded-[14px] border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-[#142535] dark:bg-[#0A1828] sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-[Outfit,sans-serif] text-[20px] font-extrabold leading-tight text-[#0C2340] sm:text-[22px] dark:text-slate-100">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            Welcome back to <span className="font-bold text-sky-700 dark:text-sky-300">{org?.name || 'your organisation'}</span>
            {org?.location ? ` — ${org.location}.` : '.'}
          </p>
        </div>
        <div className="text-right text-[12px] text-slate-500 dark:text-slate-400">
          <div className="font-semibold">{formatDateGB(now)}.</div>
          <div className="mt-0.5">
            <span aria-hidden="true" className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {formatAmPm(now)} · Live.
          </div>
        </div>
      </div>
    </header>
  );
}

function TrialBanner({ daysLeft, onUpgrade }) {
  const urgent = daysLeft <= 3;
  return (
    <div
      role="status"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-[14px] border px-5 py-3 shadow-sm ${urgent
        ? 'border-red-300 bg-gradient-to-r from-red-50 to-amber-50 dark:border-red-500/30 dark:from-red-500/10 dark:to-amber-500/10'
        : 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/10'}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span aria-hidden="true" className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
          <Sparkles size={16} />
        </span>
        <div className="min-w-0">
          <p className={`text-[13px] font-extrabold ${urgent ? 'text-red-800 dark:text-red-300' : 'text-amber-800 dark:text-amber-300'}`}>
            {daysLeft === 0
              ? 'Your trial ends today.'
              : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left on your trial.`}
          </p>
          <p className="text-[12px] text-amber-700/80 dark:text-amber-200/70">
            Upgrade now to keep all your offices, staff and visitor data.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        title="View upgrade options"
        className={`inline-flex cursor-pointer items-center gap-2 rounded-[10px] border px-4 py-2 text-[12px] font-bold text-white shadow-sm transition ${urgent
          ? 'border-red-700 bg-red-700 hover:bg-red-800'
          : 'border-amber-700 bg-amber-700 hover:bg-amber-800'}`}
      >
        Upgrade Now <ArrowRight size={13} aria-hidden="true" />
      </button>
    </div>
  );
}

/* Temp-password banner — non-dismissable yellow strip prompting the
   user to update their temporary password. Module 11 will swap the
   CTA target to the real change-password page. */
function TempPasswordBanner({ onChangePassword }) {
  const [toast, setToast] = useState(null);

  const handleClick = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 2600);
    /* Fire the nav callback too so the destination (Settings →
       Security once Module 11 ships) picks up the intent. For now
       settings is a valid nav target; the toast sets expectations. */
    if (typeof onChangePassword === 'function') onChangePassword();
  };

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-3 shadow-sm dark:border-amber-500/30 dark:from-amber-500/10 dark:to-yellow-500/10"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden="true" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          ⚠
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold text-amber-800 dark:text-amber-200">
            You are using a temporary password.
          </p>
          <p className="text-[12px] text-amber-700/90 dark:text-amber-200/80">
            For security, please update it.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleClick}
        title="Change your password"
        className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border border-amber-700 bg-amber-700 px-4 py-2 text-[12px] font-bold text-white shadow-sm transition hover:bg-amber-800"
      >
        Change Password <ArrowRight size={12} aria-hidden="true" />
      </button>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-[10000] flex max-w-sm items-start gap-3 rounded-[10px] border border-sky-200 bg-sky-50 px-4 py-3 text-[13px] font-semibold text-sky-700 shadow-lg dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300"
        >
          Password change flow ships in Module 11.
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *   2. KPI Cards
 * ═══════════════════════════════════════════════════════════════════ */

function KpiCards({ appointments, guestLog, walkIns, offices, staff, onNavigate }) {
  const today = todayIso();
  const yday  = yesterdayIso();

  const countToday = (rows, dateKey = 'date') =>
    rows.filter((r) => (r?.[dateKey] || '').slice(0, 10) === today).length;
  const countYday = (rows, dateKey = 'date') =>
    rows.filter((r) => (r?.[dateKey] || '').slice(0, 10) === yday).length;

  const visitorsToday     = countToday(appointments) + walkIns.filter((w) => (w?.date || today) === today).length;
  const visitorsYesterday = countYday(appointments);
  const trendPct = visitorsYesterday === 0
    ? (visitorsToday > 0 ? 100 : 0)
    : Math.round(((visitorsToday - visitorsYesterday) / visitorsYesterday) * 100);

  const pendingAppointments = appointments.filter((a) => String(a?.status || '').toLowerCase() === 'pending').length;

  const activeOffices = offices.filter((o) => String(o?.status || 'Active').toLowerCase() === 'active');
  const officeNames = activeOffices.map((o) => o.name).filter(Boolean).slice(0, 3).join(', ')
    + (activeOffices.length > 3 ? ` +${activeOffices.length - 3} more` : '');

  const activeStaff = staff.filter((s) => String(s?.status || 'Active').toLowerCase() === 'active');
  const staffByRole = activeStaff.reduce((acc, s) => {
    const key = (s?.role || 'Staff').toString();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const staffBreakdown = Object.entries(staffByRole)
    .slice(0, 3)
    .map(([r, n]) => `${n} ${r}`)
    .join(', ') || 'No staff yet';

  const cards = [
    {
      key: 'visitors',
      label: "Today's Visitors",
      value: visitorsToday,
      sub: (
        <span className={trendPct > 0 ? 'text-emerald-600 dark:text-emerald-400' : trendPct < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}>
          {trendPct > 0 ? '↑' : trendPct < 0 ? '↓' : '→'} {Math.abs(trendPct)}% vs yesterday.
        </span>
      ),
      icon: Users,
      tone: 'violet',
      target: 'guest-log',
    },
    {
      key: 'appointments',
      label: 'Pending Appointments',
      value: pendingAppointments,
      sub: pendingAppointments === 0 ? 'All caught up.' : `${pendingAppointments} awaiting approval.`,
      icon: CalendarCheck,
      tone: 'amber',
      target: 'appointments',
    },
    {
      key: 'offices',
      label: 'Active Offices',
      value: activeOffices.length,
      sub: officeNames || 'No offices yet.',
      icon: Building2,
      tone: 'blue',
      target: 'offices',
    },
    {
      key: 'staff',
      label: 'Active Staff',
      value: activeStaff.length,
      sub: staffBreakdown,
      icon: UserCheck,
      tone: 'emerald',
      target: 'staff',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => <KpiCard key={c.key} {...c} onClick={() => onNavigate?.(c.target)} />)}
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, tone, onClick }) {
  const toneCls = {
    violet:  { bg: 'bg-sky-50 dark:bg-sky-500/15',   text: 'text-sky-700 dark:text-sky-300',   border: 'border-sky-200 dark:border-sky-400/30' },
    amber:   { bg: 'bg-amber-50 dark:bg-amber-500/15',     text: 'text-amber-700 dark:text-amber-300',     border: 'border-amber-200 dark:border-amber-500/30'   },
    blue:    { bg: 'bg-blue-50 dark:bg-blue-500/15',       text: 'text-blue-700 dark:text-blue-300',       border: 'border-blue-200 dark:border-blue-500/30'     },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-500/30' },
  }[tone] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Open ${label}`}
      className="group flex cursor-pointer flex-col gap-3 rounded-[14px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:border-[#142535] dark:bg-[#0A1828] dark:hover:border-sky-400/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] border ${toneCls.bg} ${toneCls.border} ${toneCls.text}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
        <ArrowRight size={14} aria-hidden="true" className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-sky-500 dark:text-slate-500" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 font-[Outfit,sans-serif] text-[30px] font-extrabold leading-none text-[#0C2340] dark:text-slate-100">
          {Number(value).toLocaleString('en-GB')}
        </p>
        <p className="mt-2 truncate text-[11px] text-slate-500 dark:text-slate-400">
          {sub}
        </p>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *   3. Critical Alerts (VIP pending / passes expiring / unassigned)
 * ═══════════════════════════════════════════════════════════════════ */

function CriticalAlerts({ appointments, services, onNavigate }) {
  const today = todayIso();

  const vipPending = appointments.filter((a) => {
    const isVip = a?.vip || a?.isVip || /vip/i.test(a?.purpose || '');
    return isVip && String(a?.status || '').toLowerCase() === 'pending';
  });

  /* "Passes expiring today" — appointments approved/confirmed with
     today's date. In production this would read badge expiry fields. */
  const passesExpiringToday = appointments.filter((a) => {
    const status = String(a?.status || '').toLowerCase();
    return (status === 'confirmed' || status === 'approved' || status === 'inside')
      && (a?.date || '').slice(0, 10) === today;
  });

  /* Post-v1 Services schema is a catalogue keyed by `assignedStaffIds`
     (array). An "unassigned" service is an Active catalogue entry
     with no staff assigned yet. */
  const unassignedServices = services.filter(
    (s) => !s?.assignedStaffIds?.length && String(s?.status || '').toLowerCase() !== 'inactive',
  );

  const items = [
    {
      key: 'vip',
      tone: 'red',
      Icon: AlertTriangle,
      title: `${vipPending.length} VIP appointment${vipPending.length === 1 ? '' : 's'} pending approval.`,
      body: vipPending.length === 0
        ? 'No VIP visits awaiting approval.'
        : vipPending.slice(0, 2).map((a) => a?.visitorName || a?.guestName).filter(Boolean).join(', ') + '.',
      action: 'Review',
      target: 'appointments',
      dim: vipPending.length === 0,
    },
    {
      key: 'passes',
      tone: 'amber',
      Icon: BadgeCheck,
      title: `${passesExpiringToday.length} pass${passesExpiringToday.length === 1 ? '' : 'es'} expiring today.`,
      body: passesExpiringToday.length === 0
        ? 'No passes expire today.'
        : 'Review today\'s check-ins to extend or close out.',
      action: 'View Today',
      target: 'guest-log',
      dim: passesExpiringToday.length === 0,
    },
    {
      key: 'services',
      tone: 'blue',
      Icon: LifeBuoy,
      title: `${unassignedServices.length} unassigned service request${unassignedServices.length === 1 ? '' : 's'}.`,
      body: unassignedServices.length === 0
        ? 'Every request has been assigned.'
        : unassignedServices.slice(0, 2).map((s) => s?.name).filter(Boolean).join(', ') + '.',
      action: 'Assign',
      target: 'services',
      dim: unassignedServices.length === 0,
    },
  ];

  return (
    <section aria-label="Critical Alerts">
      <h2 className="mb-2 px-1 text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
        Critical Alerts
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map(({ key, ...rest }) => <AlertCard key={key} {...rest} onClick={() => onNavigate?.(rest.target)} />)}
      </div>
    </section>
  );
}

function AlertCard({ tone, Icon, title, body, action, dim, onClick }) {
  const toneCls = {
    red:   'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
    amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    blue:  'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
  }[tone];
  const iconBg = {
    red:   'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    blue:  'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  }[tone];
  const btnCls = {
    red:   'border-red-700 bg-red-700 hover:bg-red-800',
    amber: 'border-amber-700 bg-amber-700 hover:bg-amber-800',
    blue:  'border-blue-700 bg-blue-700 hover:bg-blue-800',
  }[tone];

  return (
    <div
      className={`flex flex-col gap-3 rounded-[14px] border px-4 py-4 shadow-sm ${toneCls} ${dim ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-extrabold leading-snug">{title}</p>
          <p className="mt-1 text-[12px] leading-relaxed opacity-85">{body}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={dim}
        title={`${action} now`}
        className={`inline-flex cursor-pointer items-center justify-center gap-1.5 self-start rounded-[8px] border px-3 py-1.5 text-[11px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${btnCls}`}
      >
        {action} <ArrowRight size={11} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *   4. Quick Actions
 * ═══════════════════════════════════════════════════════════════════ */

function QuickActions({ onNavigate }) {
  const actions = [
    { key: 'walkin',  label: 'Add Walk-In',     Icon: UserPlus,       tone: 'emerald', target: 'walkin' },
    { key: 'appt',    label: 'New Appointment', Icon: CalendarPlus,   tone: 'violet',  target: 'appointments' },
    { key: 'staff',   label: 'Add Staff',       Icon: UserCheck,      tone: 'blue',    target: 'staff' },
    { key: 'report',  label: 'Run Report',      Icon: FileBarChart2,  tone: 'amber',   target: 'reports' },
  ];
  const toneCls = {
    violet:  'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-400/30 dark:hover:bg-sky-500/25',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/25',
    blue:    'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30 dark:hover:bg-blue-500/25',
    amber:   'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/25',
  };
  return (
    <section aria-label="Quick Actions">
      <h2 className="mb-2 px-1 text-[12px] font-extrabold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => onNavigate?.(a.target)}
            title={a.label}
            className={`inline-flex cursor-pointer items-center gap-3 rounded-[14px] border px-4 py-3 text-left font-semibold shadow-sm transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ${toneCls[a.tone]}`}
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 dark:bg-white/10">
              <a.Icon size={16} aria-hidden="true" />
            </span>
            <span className="text-[13px] font-bold">{a.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *   5. Visitor Trend Chart
 * ═══════════════════════════════════════════════════════════════════ */

const RANGE_DAYS = { week: 7, month: 30, last30: 30 };
const RANGE_LABEL = {
  week:   'This Week',
  month:  'This Month',
  last30: 'Last 30 Days',
};

function VisitorTrendChart({ appointments, guestLog, walkIns }) {
  const [range, setRange] = useState('week');
  const days = RANGE_DAYS[range] || 7;

  const series = useMemo(() => {
    const buckets = new Map();
    for (let i = days - 1; i >= 0; i -= 1) {
      buckets.set(daysAgoIso(i), 0);
    }
    const tally = (rows, key = 'date') => {
      for (const r of rows) {
        const d = (r?.[key] || '').slice(0, 10);
        if (buckets.has(d)) buckets.set(d, buckets.get(d) + 1);
      }
    };
    tally(appointments, 'date');
    tally(walkIns, 'date');
    tally(guestLog, 'date');
    return Array.from(buckets.entries()).map(([iso, count]) => {
      const d = new Date(`${iso}T00:00:00`);
      return {
        iso,
        label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        visitors: count,
      };
    });
  }, [appointments, walkIns, guestLog, days]);

  const total   = series.reduce((s, d) => s + d.visitors, 0);
  const average = series.length ? Math.round(total / series.length) : 0;
  const peak    = series.reduce((max, d) => Math.max(max, d.visitors), 0);

  return (
    <section aria-label="Visitor Trend" className="rounded-[14px] border border-slate-200 bg-white p-4 shadow-sm dark:border-[#142535] dark:bg-[#0A1828] sm:p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#0C2340] dark:text-slate-100">
            Visitor Trend
          </h3>
          <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
            {RANGE_LABEL[range]} across all offices.
          </p>
        </div>
        <div className="relative">
          <label htmlFor="trend-range" className="sr-only">Trend range</label>
          <select
            id="trend-range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="cursor-pointer appearance-none rounded-[10px] border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-[12px] font-semibold text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-200"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="last30">Last 30 Days</option>
          </select>
        </div>
      </header>

      <div className="h-[260px] w-full min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0EA5E9" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-[#142535]" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-slate-400 dark:text-slate-500"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-slate-400 dark:text-slate-500"
            />
            <Tooltip
              cursor={{ stroke: '#0EA5E9', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                fontSize: 12,
                fontWeight: 600,
              }}
              formatter={(value) => [`${value} visitor${value === 1 ? '' : 's'}`, 'Visitors']}
              labelStyle={{ color: '#0C2340', fontWeight: 700 }}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#0EA5E9"
              strokeWidth={2.4}
              fill="url(#trendArea)"
              dot={{ r: 3, stroke: '#0EA5E9', strokeWidth: 1.5, fill: '#fff' }}
              activeDot={{ r: 5, stroke: '#0D9488', strokeWidth: 2, fill: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 dark:border-[#142535]">
        <Summary label="Total" value={total} />
        <Summary label="Average per day" value={average} />
        <Summary label="Peak" value={peak} />
      </div>
    </section>
  );
}

function Summary({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-[Outfit,sans-serif] text-[20px] font-extrabold text-[#0C2340] dark:text-slate-100">
        {Number(value).toLocaleString('en-GB')}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *   6. Recent Activity
 * ═══════════════════════════════════════════════════════════════════ */

function RecentActivity({ appointments, guestLog, walkIns, services, tick }) {
  /* Merge the four collections into a single event stream, tag each
     with a severity, then slice the newest 10. Re-computed every
     `tick` (the parent's 30-second poll) so the feed feels live. */
  const events = useMemo(() => {
    const list = [];
    for (const a of appointments) {
      const when = a?.date && a?.time ? new Date(`${a.date}T${a.time}`).getTime() : null;
      if (!when) continue;
      const status = String(a?.status || '').toLowerCase();
      list.push({
        id: `appt-${a.id}`,
        when,
        type: 'Appointment',
        severity: status === 'cancelled' ? 'high' : status === 'pending' ? 'medium' : 'low',
        description: `${status === 'cancelled' ? 'Cancelled — ' : status === 'pending' ? 'Pending approval — ' : 'Scheduled — '}${a?.visitorName || 'Visitor'}${a?.host ? ` with ${a.host}` : ''}.`,
      });
    }
    for (const g of guestLog) {
      const iso = g?.checkInTime || g?.time || g?.date;
      const when = iso ? new Date(iso).getTime() : null;
      if (!when) continue;
      list.push({
        id: `guest-${g.id}`,
        when,
        type: 'Check-in',
        severity: 'low',
        description: `${g?.guestName || g?.name || 'Visitor'} checked in${g?.host ? ` to see ${g.host}` : ''}.`,
      });
    }
    for (const w of walkIns) {
      const when = w?.checkInTs || (w?.date && w?.time ? new Date(`${w.date}T${w.time}`).getTime() : Date.now());
      list.push({
        id: `walk-${w.id}`,
        when,
        type: 'Walk-in',
        severity: 'low',
        description: `${w?.name || 'Walk-in'} (${w?.company || 'unknown company'}) arrived at reception.`,
      });
    }
    for (const s of services) {
      const iso = s?.date && s?.time ? `${s.date}T${s.time}` : s?.date;
      const when = iso ? new Date(iso).getTime() : null;
      if (!when) continue;
      const status = String(s?.status || '').toLowerCase();
      list.push({
        id: `svc-${s.id}`,
        when,
        type: 'Service',
        severity: status === 'pending' ? 'medium' : 'low',
        description: `${s?.serviceType || 'Service'} — ${status === 'pending' ? 'awaiting action' : status === 'in progress' ? 'in progress' : 'completed'}${s?.assignedStaff ? ` by ${s.assignedStaff}` : ''}.`,
      });
    }
    return list.sort((a, b) => b.when - a.when).slice(0, 10);
  }, [appointments, guestLog, walkIns, services, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const dotCls = {
    low:    'bg-emerald-500',
    medium: 'bg-amber-500',
    high:   'bg-red-500',
  };

  return (
    <section aria-label="Recent Activity" className="rounded-[14px] border border-slate-200 bg-white shadow-sm dark:border-[#142535] dark:bg-[#0A1828]">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#142535]">
        <div>
          <h3 className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#0C2340] dark:text-slate-100">
            Recent Activity
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Latest {events.length} event{events.length === 1 ? '' : 's'} · auto-refresh every 30 seconds.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </header>
      {events.length === 0 ? (
        <div className="flex min-h-[140px] flex-col items-center justify-center px-5 py-8 text-center">
          <Clock3 size={22} aria-hidden="true" className="mb-2 text-slate-400 dark:text-slate-500" />
          <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">No activity yet today.</p>
          <p className="mt-1 text-[11px] text-slate-400">New check-ins, appointments and service updates will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-[#142535]">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-5 py-3">
              <span aria-hidden="true" className={`mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dotCls[e.severity] || dotCls.low}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[12px] font-bold text-[#0C2340] dark:text-slate-100">{e.type}</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-400">
                    {formatAmPm(e.when)}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-300">{e.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *   7. Office Status Table
 * ═══════════════════════════════════════════════════════════════════ */

function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

function OfficeStatusTable({ offices, appointments, walkIns, rooms, onNavigate }) {
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [perPage, setPerPage] = useState(10);
  const today = todayIso();
  const isMobileView = useIsMobile(768);

  const rows = useMemo(() => {
    return (offices || []).map((o, idx) => {
      const officeKey  = o?.id ?? o?.name;
      const officeName = o?.name || '—';
      const visitorsToday =
        appointments.filter((a) =>
          (a?.date || '').slice(0, 10) === today
          && ((a?.officeId && a.officeId === o?.id) || a?.office === officeName),
        ).length
        + walkIns.filter((w) => (w?.officeId && w.officeId === o?.id) || w?.office === officeName).length;

      const officeRooms = (rooms || []).filter(
        (r) => (r?.officeId && r.officeId === o?.id) || r?.office === officeName,
      );

      return {
        id: officeKey,
        srNo: idx + 1,
        name: officeName,
        location: o?.address?.city || o?.location || '',
        visitorsToday,
        roomsCount: officeRooms.length,
        status: o?.status || 'Active',
      };
    });
  }, [offices, appointments, walkIns, rooms, today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.name} ${r.location} ${r.status}`.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage   = Math.min(page, totalPages);
  const slice      = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <section aria-label="Office Status" className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm dark:border-[#142535] dark:bg-[#0A1828]">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-[#142535]">
        <div>
          <h3 className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#0C2340] dark:text-slate-100">
            Office Status
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            Live snapshot of all offices in your organisation.
          </p>
        </div>
        <div className="relative min-w-[200px]">
          <Search size={13} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search offices by name or loc..."
            aria-label="Search offices"
            className="w-full rounded-[10px] border border-slate-200 bg-white py-2 pl-8 pr-8 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setPage(1); }}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#1E1E3F]"
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* ── MOBILE / TAB: Card Grid ── */}
      {isMobileView ? (
        <div className="flex flex-col gap-3 p-3">
          {slice.length === 0 && (
            <p className="py-8 text-center text-[12px] text-slate-400">
              {rows.length === 0 ? 'No offices yet — add your first office.' : 'No offices match the current search.'}
            </p>
          )}
          {slice.map((r) => (
            <div
              key={r.id}
              onClick={() => onNavigate?.('offices')}
              className="cursor-pointer rounded-[12px] border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300 hover:shadow-md dark:border-[#142535] dark:bg-[#071220]"
            >
              {/* Name + Status */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-bold text-[#0C2340] dark:text-slate-100">{r.name}</div>
                  {r.location && (
                    <div className="mt-1 text-[11px] text-slate-400">📍 {r.location}</div>
                  )}
                </div>
                <OfficeStatusPill status={r.status} />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[10px] border border-slate-200 bg-white p-2 text-center dark:border-[#142535] dark:bg-[#0A1828]">
                  <div className="font-[Outfit,sans-serif] text-[20px] font-black text-sky-500">{r.visitorsToday}</div>
                  <div className="mt-1 text-[10px] font-semibold text-slate-400">Visitors Today</div>
                </div>
                <div
                  className="cursor-pointer rounded-[10px] border border-slate-200 bg-white p-2 text-center transition hover:border-sky-300 dark:border-[#142535] dark:bg-[#0A1828]"
                  onClick={(e) => { e.stopPropagation(); onNavigate?.('rooms'); }}
                >
                  <div className="font-[Outfit,sans-serif] text-[20px] font-black text-sky-700 dark:text-sky-300">{r.roomsCount}</div>
                  <div className="mt-1 text-[10px] font-semibold text-slate-400">Rooms →</div>
                </div>
                <div className="rounded-[10px] border border-slate-200 bg-white p-2 text-center dark:border-[#142535] dark:bg-[#0A1828]">
                  <div className="font-[Outfit,sans-serif] text-[20px] font-black text-slate-500 dark:text-slate-300">#{r.srNo}</div>
                  <div className="mt-1 text-[10px] font-semibold text-slate-400">SR. No.</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── DESKTOP: Table ── */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
            <thead className="bg-slate-50 dark:bg-[#071220]">
              <tr>
                {['SR. No.', 'Office Name', 'Visitors Today', 'Rooms', 'Status'].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#142535]">
              {slice.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[12px] text-slate-400">
                    {rows.length === 0
                      ? 'No offices yet — add your first office to start tracking visitors.'
                      : 'No offices match the current search.'}
                  </td>
                </tr>
              )}
              {slice.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-[#1E1E3F]">
                  <td className="px-4 py-3 font-semibold text-slate-400">{r.srNo}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#0C2340] dark:text-slate-100">{r.name}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{r.location || '—'}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">
                    {Number(r.visitorsToday).toLocaleString('en-GB')}
                  </td>
                  <td className="px-4 py-3">
                    {r.roomsCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => onNavigate?.('rooms')}
                        title={`View rooms at ${r.name}.`}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-[8px] border border-sky-200 bg-sky-50 px-2.5 py-1 text-[12px] font-bold text-sky-700 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25"
                      >
                        {Number(r.roomsCount).toLocaleString('en-GB')} room{r.roomsCount === 1 ? '' : 's'}
                        <ArrowRight size={11} aria-hidden="true" />
                      </button>
                    ) : (
                      <span
                        title="No rooms added yet for this office."
                        className="inline-flex items-center rounded-[8px] border border-dashed border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-400 dark:border-[#142535] dark:text-slate-500"
                      >
                        0 rooms
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <OfficeStatusPill status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-2 dark:border-[#142535]">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Showing {slice.length === 0 ? 0 : (safePage - 1) * perPage + 1}
          –{(safePage - 1) * perPage + slice.length} of {total} office{total === 1 ? '' : 's'}.
        </span>
      </div>

      <Pagination
        page={safePage}
        perPage={perPage}
        total={total}
        onPageChange={setPage}
        onPerPageChange={(n) => { setPerPage(n); setPage(1); }}
      />
    </section>
  );
}

function OfficeStatusPill({ status }) {
  const s = String(status || 'Active');
  const cls = {
    Active:    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    Busy:      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    Suspended: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
    Closed:    'border-slate-200 bg-slate-100 text-slate-500 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-400',
  }[s] || 'border-slate-200 bg-slate-100 text-slate-500';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>
      {s}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *   8. Onboarding Checklist (Trial + incomplete only)
 * ═══════════════════════════════════════════════════════════════════ */

function OnboardingChecklist({ isTrial, offices, staff, appointments, walkIns, org, onNavigate }) {
  const seen = (() => {
    try { return JSON.parse(localStorage.getItem('cgms_onboarding_seen_v1') || '{}') || {}; }
    catch { return {}; }
  })();

  const steps = [
    { key: 'office',   label: 'Add your first office.',         done: offices.length > 0,                    target: 'offices',     cta: 'Add Office' },
    { key: 'staff',    label: 'Invite a teammate.',             done: staff.length > 0,                      target: 'staff',       cta: 'Invite Staff' },
    { key: 'appt',     label: 'Create your first appointment.', done: appointments.length > 0,               target: 'appointments',cta: 'Create Appointment' },
    { key: 'walkin',   label: 'Log a walk-in check-in.',        done: walkIns.length > 0,                    target: 'walkin',      cta: 'Open Walk-in' },
    { key: 'report',   label: 'Explore the Reports page.',      done: Boolean(seen.reports),                 target: 'reports',     cta: 'Open Reports' },
  ];

  const complete = steps.filter((s) => s.done).length;
  const total    = steps.length;
  const pct      = Math.round((complete / total) * 100);

  /* Auto-hide: not a trial, or all steps done. */
  if (!isTrial || complete === total) return null;

  return (
    <section
      aria-label="Onboarding Checklist"
      className="rounded-[14px] border border-sky-200 bg-gradient-to-br from-sky-50 to-white px-5 py-5 shadow-sm dark:border-sky-400/30 dark:from-sky-500/10 dark:to-[#0A1828]"
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#0C2340] dark:text-slate-100">
            Finish setting up {org?.name || 'your organisation'}.
          </h3>
          <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
            {complete} of {total} complete · keep going to unlock the full platform.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-bold text-sky-700 dark:border-sky-400/30 dark:bg-[#071220] dark:text-sky-300">
          {pct}% complete
        </span>
      </header>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="mb-4 h-2.5 w-full rounded-full bg-sky-100 dark:bg-sky-500/20"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-800 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((s) => (
          <li
            key={s.key}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-slate-200 bg-white px-4 py-3 dark:border-[#142535] dark:bg-[#071220]"
          >
            <div className="flex min-w-0 items-center gap-3">
              {s.done ? (
                <CheckCircle2 size={18} aria-hidden="true" className="shrink-0 text-emerald-500" />
              ) : (
                <Circle size={18} aria-hidden="true" className="shrink-0 text-slate-300 dark:text-slate-600" />
              )}
              <span className={`text-[13px] ${s.done ? 'text-slate-400 line-through dark:text-slate-500' : 'font-semibold text-[#0C2340] dark:text-slate-100'}`}>
                {s.label}
              </span>
            </div>
            {!s.done && (
              <button
                type="button"
                onClick={() => onNavigate?.(s.target)}
                title={s.cta}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-sky-700 bg-sky-700 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-800"
              >
                {s.cta} <ArrowRight size={11} aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *   Loading skeleton — shown briefly on first render.
 * ═══════════════════════════════════════════════════════════════════ */

function DashboardSkeleton() {
  const block = 'animate-pulse rounded-[14px] bg-slate-200/60 dark:bg-[#142535]';
  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 dark:bg-[#050E1A]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <div className={`${block} h-[72px]`} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0,1,2,3].map((i) => <div key={i} className={`${block} h-[130px]`} />)}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[0,1,2].map((i) => <div key={i} className={`${block} h-[120px]`} />)}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0,1,2,3].map((i) => <div key={i} className={`${block} h-[72px]`} />)}
        </div>
        <div className={`${block} h-[320px]`} />
        <div className={`${block} h-[360px]`} />
      </div>
    </div>
  );
}