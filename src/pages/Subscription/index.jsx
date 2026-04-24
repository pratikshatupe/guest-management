import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Building2, CreditCard, TrendingUp, Sparkles, Plus, AlertTriangle, Clock, CalendarClock, RefreshCw, Eye, Pencil, XCircle } from 'lucide-react';
import { AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import {
  MOCK_ORGANIZATIONS,
  SUBSCRIPTION_PLANS,
  PLATFORM_METRICS,
  MRR_HISTORY,
  CRITICAL_ALERTS,
} from '../../data/mockData';
import { useCollection, STORAGE_KEYS } from '../../store';
import { useNotifications } from '../../context/NotificationContext';
import { useRole } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';
import { addAuditLog } from '../../utils/auditLogger';
import NoAccess from '../../components/NoAccess';
import PlanEditorModal from '../../components/PlanEditorModal';
import OrgDetailDrawer from './OrgDetailDrawer';
import TenantSubscription from './TenantSubscription';
import { normalisePlan } from '../../utils/subscriptionPlans';
import {
  Toast,
  ConfirmModal,
  Field,
  SearchableSelect,
  DataTable,
  Pagination,
  EmptyState,
} from '../../components/ui';

/* ─── Config ────────────────────────────────────────────────────────────── */
const STATUS_VALUES = ['Active', 'Trial', 'Expired', 'Cancelled'];
const BILLING_CYCLES = ['monthly', 'yearly'];
const DAY_MS = 24 * 60 * 60 * 1000;

/* Shared feature catalogue used by PlanEditorModal's Features section.
 * Mirrors the list in Settings → Feature Flags so both editors agree. */
const FEATURE_CATALOGUE = [
  'Walk-in Check-in',
  'Appointments Scheduling',
  'Multi-Office Support',
  'Custom Branding',
  'Advanced Reports',
  'Excel Exports',
  'PDF Exports',
  'Email Notifications',
  'SMS Notifications',
  'WhatsApp Notifications',
  'API Access',
  'Webhooks',
  'Single Sign-On (SSO)',
  'White-label',
  'Priority Support',
  'Dedicated Account Manager',
  'AI Features (beta)',
];

const PLAN_BADGE = {
  Starter:      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  Professional: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-300',
  Enterprise:   'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
};
const CUSTOM_PLAN_BADGE =
  'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300';

const STATUS_BADGE = {
  Active:    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  Trial:     'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300',
  Expired:   'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  Cancelled: 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400',
};

/* ─── Pure helpers ──────────────────────────────────────────────────────── */
const safeStr = (v) => (v == null ? '' : String(v).trim());
const lower   = (v) => safeStr(v).toLowerCase();
const safeText = (v, fallback = '—') => {
  if (v == null) return fallback;
  const s = typeof v === 'string' ? v : String(v);
  return s.trim() === '' ? fallback : s;
};

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Parse a date value (ISO string, number, Date) to epoch-ms, or null. */
function parseDateMs(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) {
    const t = v.getTime();
    return Number.isNaN(t) ? null : t;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
}

function formatDate(ts) {
  const ms = parseDateMs(ts);
  if (ms == null) return '—';
  return new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '₹0';
  return `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** Build a plan lookup by name from the given list (defaults + custom plans). */
function buildPlanIndex(plans) {
  const map = new Map();
  for (const p of plans || []) {
    if (p && p.name) map.set(p.name, p);
  }
  return map;
}

/** Default price for a plan+cycle, derived from the merged plan list. */
function defaultPriceFor(planName, cycle, planIndex) {
  const p = planIndex.get(planName);
  if (!p) return 0;
  const monthly = Number(p.price) || 0;
  const yearlyMonthly = Number(p.yearlyPrice) || 0;
  return cycle === 'yearly' ? Math.round(yearlyMonthly * 12) : monthly;
}

/** Normalise an organisation row to include full subscription state. Accepts
 *  the legacy MOCK_ORGANIZATIONS shape and writes missing fields with sane
 *  seeded defaults (plan=Professional, monthly, autoRenew=true). */
function migrateOrganization(o, planIndex, nowMs) {
  if (!o || typeof o !== 'object') return null;
  const id = o.id ?? makeId();
  const name = safeStr(o.name);

  /* Accept any plan that exists in the current (merged) plan index —
   * new Super-Admin-created plans included. Fallback = Professional. */
  const planName = planIndex.has(o.plan) ? o.plan : 'Professional';
  const cycle = o.billingCycle === 'yearly' ? 'yearly' : 'monthly';
  const defaultPrice = defaultPriceFor(planName, cycle, planIndex);
  /* Prefer the org's own `mrr` when the seed supplies one (the Super Admin
   * dashboard and Reports rely on this field). Fall back to `price`, then
   * to the plan-indexed default. Either source is accepted as long as it's
   * a finite non-negative number. */
  const explicitPrice = Number(o.price);
  const explicitMrr   = Number(o.mrr);
  const price = Number.isFinite(explicitPrice) && explicitPrice >= 0
    ? explicitPrice
    : Number.isFinite(explicitMrr) && explicitMrr > 0
    ? explicitMrr
    : defaultPrice;

  const autoRenew = typeof o.autoRenew === 'boolean' ? o.autoRenew : true;

  const startMs = parseDateMs(o.startDate) ?? (nowMs - 30 * DAY_MS);
  /* endDate defaults 30 days from start so "Next Renewal" renders meaningfully. */
  const endMs = parseDateMs(o.endDate) ?? (startMs + 30 * DAY_MS);
  /* Trial expiry — honour explicit trialEndsAt, else derive from trialDaysLeft
   * when the seed carries status='Trial' so resolveStatus keeps the row in
   * the Trial bucket instead of silently promoting it to Active. */
  const trialMs = parseDateMs(o.trialEndsAt) ??
    (o.status === 'Trial' && Number(o.trialDaysLeft) > 0
      ? nowMs + Number(o.trialDaysLeft) * DAY_MS
      : null);

  /* Seed status: if caller supplied a valid subscription status use it; otherwise
     map legacy MOCK_ORGANIZATIONS { Active | Inactive } → { Active | Cancelled }. */
  let status;
  if (STATUS_VALUES.includes(o.status)) {
    status = o.status;
  } else if (lower(o.status) === 'inactive') {
    status = 'Cancelled';
  } else {
    status = 'Active';
  }

  return {
    id,
    name,
    industry:    safeStr(o.industry),
    location:    safeStr(o.location),
    country:     safeStr(o.country),
    users:       Number.isFinite(Number(o.users)) ? Number(o.users) : 0,
    plan:        planName,
    billingCycle: cycle,
    price,
    status,
    startDate:   new Date(startMs).toISOString(),
    endDate:     new Date(endMs).toISOString(),
    autoRenew,
    trialEndsAt: trialMs != null ? new Date(trialMs).toISOString() : null,
  };
}

/** Derive the effective, display-time status from dates + stored status.
 *  Pure — never mutates state. */
function resolveStatus(o, nowMs) {
  if (!o) return 'Cancelled';
  if (o.status === 'Cancelled') return 'Cancelled';
  const trialMs = parseDateMs(o.trialEndsAt);
  if (trialMs != null && trialMs > nowMs) return 'Trial';
  const endMs = parseDateMs(o.endDate);
  if (endMs != null && endMs < nowMs && !o.autoRenew) return 'Expired';
  if (o.status === 'Expired') return 'Expired';
  return 'Active';
}

function matchesSearch(o, q) {
  if (!q) return true;
  const n = lower(q);
  return (
    lower(o.name).includes(n) ||
    lower(o.industry).includes(n) ||
    lower(o.location).includes(n) ||
    lower(o.country).includes(n)
  );
}

/* Country-code / flag lookup — covers every country the seed ships with. */
const COUNTRY_FLAGS = {
  'United Arab Emirates': { code: 'AE', flag: '🇦🇪' },
  'India':                { code: 'IN', flag: '🇮🇳' },
  'Saudi Arabia':         { code: 'SA', flag: '🇸🇦' },
  'United Kingdom':       { code: 'GB', flag: '🇬🇧' },
  'Qatar':                { code: 'QA', flag: '🇶🇦' },
  'Oman':                 { code: 'OM', flag: '🇴🇲' },
  'Kuwait':               { code: 'KW', flag: '🇰🇼' },
  'Bahrain':              { code: 'BH', flag: '🇧🇭' },
};

/* ─── UI atoms ──────────────────────────────────────────────────────────── */
function PlanPill({ plan }) {
  /* Custom (Super-Admin-created) plan names get the sky pill; defaults keep
   * their canonical colour. */
  const cls = PLAN_BADGE[plan] || CUSTOM_PLAN_BADGE;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>
      {safeText(plan)}
    </span>
  );
}

function StatusPill({ status }) {
  const key = STATUS_VALUES.includes(status) ? status : 'Cancelled';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_BADGE[key]}`}>
      {key}
    </span>
  );
}

function StatCard({ label, value, tone, Icon, hint, onClick, title, active = false }) {
  const toneCls = {
    violet:  'border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-300',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber:   'border-amber-100 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    sky:     'border-sky-100 bg-sky-50 text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
    blue:    'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
    red:     'border-red-100 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300',
  }[tone];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={title}
      className={`w-full rounded-[14px] border ${toneCls} p-4 shadow-sm text-left transition ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} ${active ? 'ring-2 ring-offset-1 ring-current' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[26px] font-black leading-none font-['Outfit',sans-serif]">{value}</p>
          <p className="mt-1.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
          {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
        </div>
        {Icon && <Icon size={18} aria-hidden="true" className="opacity-70 shrink-0" />}
      </div>
    </Tag>
  );
}

/* Alert card — shown in the row beneath the stat cards. Disabled style
 * when the count is zero so the row still renders but fades out. */
function AlertCard({ label, count, sub, tone, Icon, cta, onClick, title }) {
  const active = Number(count) > 0;
  const toneCls = {
    red:   active
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
      : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-500',
    amber: active
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
      : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-500',
    blue:  active
      ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300'
      : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-500',
  }[tone];
  return (
    <div className={`rounded-[14px] border ${toneCls} p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        {Icon && <Icon size={18} aria-hidden="true" className={active ? '' : 'opacity-40'} />}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold">{count} {label}</div>
          {sub && <div className="mt-0.5 text-[12px] text-slate-600 dark:text-slate-300">{sub}</div>}
          <button
            type="button"
            onClick={onClick}
            title={title}
            disabled={!active}
            className={`mt-2 cursor-pointer rounded-[8px] border px-3 py-1.5 text-[11px] font-bold transition ${active
              ? 'border-current bg-white text-current hover:bg-white/80 dark:bg-transparent'
              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          >
            {cta}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */
export default function SubscriptionPage({ setActivePage }) {
  /* Module 9 — role-gate. Director / Manager get the tenant view.
     SuperAdmin keeps the existing 1,377-line platform console below. */
  const auth = useAuth();
  const role = (auth?.user?.role || '').toLowerCase();
  if (role && role !== 'superadmin') {
    return <TenantSubscription setActivePage={setActivePage} />;
  }
  return <PlatformSubscriptionConsole setActivePage={setActivePage} />;
}

function PlatformSubscriptionConsole({ setActivePage }) {
  const [rawOrgs, , , , replaceOrgs] = useCollection(STORAGE_KEYS.ORGANIZATIONS, MOCK_ORGANIZATIONS);
  const [customPlans, addCustomPlan] = useCollection(STORAGE_KEYS.SUBSCRIPTION_PLANS, []);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  /* RBAC gates for the Subscription module. */
  const { hasPermission } = useRole();
  const canView   = hasPermission('subscription', 'view');
  const canEdit   = hasPermission('subscription', 'edit');
  const canDelete = hasPermission('subscription', 'delete');

  /* Only a Super Admin can create / edit / delete plans. Other roles can still
   * view the plan list and assign plans (via Change Plan). */
  const isSuperAdmin = (user?.role || '').toLowerCase() === 'superadmin';

  /* Stable "now" per render pass so filters and derived status agree. */
  const nowMs = useMemo(() => Date.now(), [rawOrgs]);

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter]     = useState('all');
  const [page, setPage]                 = useState(1);
  const [perPage, setPerPage]           = useState(10);

  const [planModal, setPlanModal]       = useState(null); // { org, plan, billingCycle }
  const [cancelTarget, setCancelTarget] = useState(null);
  const [drawerOrg, setDrawerOrg]       = useState(null); // org row currently open in the detail drawer
  const [countryFilter, setCountryFilter]     = useState('all');
  const [billingFilter, setBillingFilter]     = useState('all');
  const [selectedIds, setSelectedIds]         = useState(() => new Set());
  const [toast, setToast]               = useState(null);
  const [isSaving, setIsSaving]         = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const savingRef = useRef(false);

  /* ─── Derived data (useMemo) ─────────────────────────────────────── */
  /* Merge baked-in defaults with Super-Admin-created plans. Custom plans
   * win on name collision so a Super Admin can override Starter pricing. */
  const mergedPlans = useMemo(() => {
    const customList = Array.isArray(customPlans)
      ? customPlans.map(normalisePlan).filter(Boolean)
      : [];
    const customByName = new Map(customList.map((p) => [p.name, p]));
    const base = (SUBSCRIPTION_PLANS || [])
      .map((p) => normalisePlan({ ...p, custom: false }))
      .filter(Boolean);
    const out = base.map((p) => customByName.get(p.name) || p);
    for (const c of customList) {
      if (!base.some((b) => b.name === c.name)) out.push(c);
    }
    return out;
  }, [customPlans]);

  const activePlans = useMemo(
    () => mergedPlans.filter((p) => p.status === 'Active'),
    [mergedPlans],
  );

  const planNames = useMemo(() => activePlans.map((p) => p.name), [activePlans]);

  const planIndex = useMemo(() => buildPlanIndex(mergedPlans), [mergedPlans]);

  const organizations = useMemo(() => {
    if (!Array.isArray(rawOrgs)) return [];
    return rawOrgs
      .map((o) => migrateOrganization(o, planIndex, nowMs))
      .filter(Boolean)
      .map((o) => ({ ...o, effectiveStatus: resolveStatus(o, nowMs) }));
  }, [rawOrgs, planIndex, nowMs]);

  const stats = useMemo(() => {
    const total = organizations.length;
    const active = organizations.filter((o) => o.effectiveStatus === 'Active').length;
    const trial  = organizations.filter((o) => o.effectiveStatus === 'Trial').length;
    /* MRR is the platform-wide authoritative figure from PLATFORM_METRICS —
     * the Super Admin Dashboard reads the same source so the two surfaces
     * can never drift. ARR = MRR × 12. */
    const mrr    = Number(PLATFORM_METRICS.mrr) || 0;
    const arr    = mrr * 12;
    const churn  = Number(PLATFORM_METRICS.churnRate) || 0;
    return { total, active, trial, mrr, arr, churn };
  }, [organizations]);

  /* Derive the "renewing in ≤7d" and "trial ending in ≤7d" buckets used
   * by the alert cards and the Upcoming-Renewals / Trials-Ending filters. */
  const SEVEN_DAYS_MS = 7 * DAY_MS;
  const upcomingRenewals = useMemo(() => organizations.filter((o) => {
    if (o.effectiveStatus !== 'Active') return false;
    const end = parseDateMs(o.endDate);
    if (end == null) return false;
    return end - nowMs > 0 && end - nowMs <= SEVEN_DAYS_MS;
  }), [organizations, nowMs]);
  const trialsEndingSoon = useMemo(() => organizations.filter((o) => {
    if (o.effectiveStatus !== 'Trial') return false;
    const end = parseDateMs(o.trialEndsAt);
    if (end == null) return false;
    return end - nowMs > 0 && end - nowMs <= SEVEN_DAYS_MS;
  }), [organizations, nowMs]);

  const filtered = useMemo(() => {
    return organizations.filter((o) => {
      if (statusFilter !== 'all' && o.effectiveStatus !== statusFilter) return false;
      if (planFilter !== 'all' && o.plan !== planFilter) return false;
      if (countryFilter !== 'all' && o.country !== countryFilter) return false;
      if (billingFilter !== 'all' && o.billingCycle !== billingFilter) return false;
      if (!matchesSearch(o, search)) return false;
      return true;
    });
  }, [organizations, statusFilter, planFilter, countryFilter, billingFilter, search]);

  /* Distinct country list, sorted, used for the Country filter dropdown. */
  const countryOptions = useMemo(() => {
    const set = new Set();
    for (const o of organizations) { if (o.country) set.add(o.country); }
    return [...set].sort();
  }, [organizations]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage],
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  /* ─── Handlers ───────────────────────────────────────────────────── */
  const showToast = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  /** Persist one org patch via replaceOrgs so `useCollection` fans out the
   *  change cross-tab. Operates on the raw (un-enriched) list. */
  const patchOrg = useCallback((id, patch) => {
    const next = (Array.isArray(rawOrgs) ? rawOrgs : []).map((o) => {
      if (!o || o.id !== id) return o;
      const migrated = migrateOrganization(o, planIndex, nowMs);
      return { ...migrated, ...patch };
    });
    replaceOrgs(next);
  }, [rawOrgs, replaceOrgs, planIndex, nowMs]);

  const openChangePlan = useCallback((org) => {
    if (!hasPermission('subscription', 'edit')) return;
    setPlanModal({ org, plan: org.plan, billingCycle: org.billingCycle });
  }, [hasPermission]);

  const closePlanModal = useCallback(() => setPlanModal(null), []);

  const saveChangePlan = useCallback(() => {
    if (savingRef.current || !planModal) return;
    if (!hasPermission('subscription', 'edit')) return;
    const { org, plan, billingCycle } = planModal;
    if (!planNames.includes(plan) || !BILLING_CYCLES.includes(billingCycle)) {
      showToast('Select a valid plan and billing cycle.', 'error');
      return;
    }
    savingRef.current = true;
    setIsSaving(true);

    const price = defaultPriceFor(plan, billingCycle, planIndex);
    /* Starting a fresh billing cycle on plan change. */
    const start = Date.now();
    const cycleDays = billingCycle === 'yearly' ? 365 : 30;
    const end = start + cycleDays * DAY_MS;
    patchOrg(org.id, {
      plan,
      billingCycle,
      price,
      status: 'Active',
      startDate: new Date(start).toISOString(),
      endDate: new Date(end).toISOString(),
      trialEndsAt: null,
    });
    addNotification({
      title:   'Subscription Updated',
      message: `${safeText(org.name, 'Organisation')} plan changed to ${plan}.`,
      type:    'success',
    });
    addAuditLog({
      userName:    user?.name || 'System',
      role:        user?.role || '',
      action:      'UPDATE',
      module:      'Subscription',
      description: `Changed plan for ${safeText(org.name, 'Organisation')} to ${plan} (${billingCycle})`,
    });
    showToast('Plan updated successfully.');
    setPlanModal(null);
    queueMicrotask(() => {
      savingRef.current = false;
      setIsSaving(false);
    });
  }, [planModal, planNames, planIndex, patchOrg, addNotification, showToast, hasPermission, user]);

  const requestCancel = useCallback((org) => {
    if (!hasPermission('subscription', 'delete')) return;
    if (org.effectiveStatus === 'Cancelled') {
      showToast('Subscription is already cancelled.', 'info');
      return;
    }
    setCancelTarget(org);
  }, [hasPermission, showToast]);

  const confirmCancel = useCallback(() => {
    if (!cancelTarget || isCancelling) return;
    if (!hasPermission('subscription', 'delete')) {
      setCancelTarget(null);
      return;
    }
    setIsCancelling(true);
    const target = cancelTarget;
    patchOrg(target.id, { status: 'Cancelled', autoRenew: false });
    addNotification({
      title:   'Subscription Cancelled',
      message: `${safeText(target.name, 'Organisation')} subscription has been cancelled.`,
      type:    'success',
    });
    addAuditLog({
      userName:    user?.name || 'System',
      role:        user?.role || '',
      action:      'DELETE',
      module:      'Subscription',
      description: `Cancelled subscription for ${safeText(target.name, 'Organisation')}`,
    });
    setCancelTarget(null);
    showToast('Subscription cancelled.');
    queueMicrotask(() => setIsCancelling(false));
  }, [cancelTarget, isCancelling, patchOrg, addNotification, showToast, hasPermission, user]);

  const handlePauseSubscription = useCallback((org) => {
    if (!hasPermission('subscription', 'edit')) return;
    patchOrg(org.id, { status: 'Expired', autoRenew: false });
    addAuditLog({
      userName:    user?.name || 'System',
      role:        user?.role || '',
      action:      'PAUSE',
      module:      'Subscription',
      description: `Paused subscription for ${safeText(org.name, 'Organisation')}`,
    });
    showToast(`${safeText(org.name, 'Subscription')} paused successfully.`);
  }, [hasPermission, patchOrg, showToast, user]);

  const handleCancelFromDrawer = useCallback((org) => {
    if (!hasPermission('subscription', 'delete')) return;
    patchOrg(org.id, { status: 'Cancelled', autoRenew: false });
    addNotification({
      title:   'Subscription Cancelled',
      message: `${safeText(org.name, 'Organisation')} subscription has been cancelled.`,
      type:    'success',
    });
    addAuditLog({
      userName:    user?.name || 'System',
      role:        user?.role || '',
      action:      'DELETE',
      module:      'Subscription',
      description: `Cancelled subscription for ${safeText(org.name, 'Organisation')}`,
    });
    showToast('Subscription cancelled successfully.');
    setDrawerOrg(null);
  }, [hasPermission, patchOrg, addNotification, showToast, user]);

  const handleSendAnnouncementFromDrawer = useCallback((org) => {
    addAuditLog({
      userName:    user?.name || 'System',
      role:        user?.role || '',
      action:      'ANNOUNCEMENT',
      module:      'Subscription',
      description: `Queued announcement for ${safeText(org.name, 'Organisation')}`,
    });
    showToast(`Announcement queued for ${safeText(org.name, 'this organisation')} successfully.`);
  }, [showToast, user]);

  const toggleAutoRenew = useCallback((org) => {
    if (!hasPermission('subscription', 'edit')) return;
    const nextValue = !org.autoRenew;
    patchOrg(org.id, { autoRenew: nextValue });
    addNotification({
      title:   'Subscription Updated',
      message: `${safeText(org.name, 'Organisation')} auto-renew ${nextValue ? 'enabled' : 'disabled'}.`,
      type:    'success',
    });
    showToast(`Auto-renew ${nextValue ? 'enabled' : 'disabled'}.`);
  }, [patchOrg, addNotification, showToast, hasPermission]);

  const handleSearch = useCallback((next) => {
    setSearch(next);
    setPage(1);
  }, []);

  /* Selection helpers — selectedIds holds org.id values. */
  const toggleRowSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const toggleAllOnPage = useCallback((paginatedRows) => {
    setSelectedIds((prev) => {
      const allSelected = paginatedRows.every((r) => prev.has(r.id));
      const next = new Set(prev);
      for (const r of paginatedRows) {
        if (allSelected) next.delete(r.id); else next.add(r.id);
      }
      return next;
    });
  }, []);

  const bulkRows = useMemo(
    () => organizations.filter((o) => selectedIds.has(o.id)),
    [organizations, selectedIds],
  );

  const handleBulkExport = useCallback((kind) => {
    /* Stubbed export — a downloader hook lives in utils/exporters.js
     * for Guest Log. A production wiring would reuse it here. */
    showToast(`${bulkRows.length} organisation${bulkRows.length === 1 ? '' : 's'} exported to ${kind.toUpperCase()} successfully.`, 'success');
    addAuditLog({
      userName:    user?.name || 'System',
      role:        user?.role || '',
      action:      `BULK_EXPORT_${kind.toUpperCase()}`,
      module:      'Subscription',
      description: `Exported ${bulkRows.length} organisation(s) as ${kind.toUpperCase()}.`,
    });
  }, [bulkRows, showToast, user]);

  const handleBulkAnnounce = useCallback(() => {
    showToast(`Announcement queued for ${bulkRows.length} organisation${bulkRows.length === 1 ? '' : 's'} successfully.`, 'success');
    addAuditLog({
      userName:    user?.name || 'System',
      role:        user?.role || '',
      action:      'BULK_ANNOUNCEMENT',
      module:      'Subscription',
      description: `Queued announcement to ${bulkRows.length} organisation(s): ${bulkRows.map((o) => o.name).join(', ')}.`,
    });
  }, [bulkRows, showToast, user]);

  const handleBulkDiscount = useCallback(() => {
    showToast(`Discount workflow opened for ${bulkRows.length} organisation${bulkRows.length === 1 ? '' : 's'}.`, 'info');
    addAuditLog({
      userName:    user?.name || 'System',
      role:        user?.role || '',
      action:      'BULK_DISCOUNT',
      module:      'Subscription',
      description: `Started bulk-discount flow for ${bulkRows.length} organisation(s).`,
    });
  }, [bulkRows, showToast, user]);

  /** Super-Admin-only: persist a plan, emit audit + notification, toast.
   *  Accepts the richer shape PlanEditorModal emits (monthly/yearly/limits/
   *  features/visibility/…) and maps the fields the legacy persistence
   *  layer expects (name, price, yearlyPrice, users, status, features). */
  const handleCreatePlan = useCallback((incoming) => {
    if (!isSuperAdmin) {
      showToast('Only a Super Admin can create plans.', 'error');
      return;
    }
    setIsCreatingPlan(true);
    /* PlanEditorModal yields null for Unlimited limits — store 0 so the
     * normaliser treats them as unbounded (its validator accepts >= 0). */
    const usersCap = incoming.maxUsers == null ? 0 : Number(incoming.maxUsers) || 0;
    const record = normalisePlan({
      /* Legacy-shape fields — required by existing consumers. */
      name:        incoming.name,
      price:       Number(incoming.monthly) || 0,
      yearlyPrice: Number(incoming.yearly)  || 0,
      users:       usersCap,
      status:      incoming.status || 'Active',
      features:    Array.isArray(incoming.features) ? incoming.features : [],
      /* New-shape fields preserved alongside so richer surfaces can read them. */
      code:           incoming.code || '',
      description:    incoming.description || '',
      cycles:         incoming.cycles || ['Monthly', 'Yearly'],
      setupFee:       incoming.setupFee || 0,
      taxIncluded:    Boolean(incoming.taxIncluded),
      maxOffices:     incoming.maxOffices,
      maxVisitors:    incoming.maxVisitors,
      maxStorageGb:   incoming.maxStorageGb,
      maxApiCallsDay: incoming.maxApiCallsDay,
      trialDays:      incoming.trialDays ?? 14,
      requiresCard:   Boolean(incoming.requiresCard),
      visibility:     incoming.visibility || 'Public',
      mostPopular:    Boolean(incoming.mostPopular),
      badgeColour:    incoming.badgeColour || '#0284C7',
      /* Audit metadata. */
      createdAt:      new Date().toISOString(),
      createdBy:      user?.name || user?.email || 'SuperAdmin',
    });
    addCustomPlan(record);
    addNotification({
      title:   'New Subscription Plan',
      message: `${record.name} (${record.status}) added — ${formatMoney(record.price)} per Month.`,
      type:    'success',
    });
    addAuditLog({
      userName:    user?.name || 'System',
      role:        user?.role || '',
      action:      'CREATE',
      module:      'Subscription',
      description: `Created plan "${record.name}" (${record.status}, ₹ ${Number(record.price).toLocaleString('en-IN')} per Month, ${record.users} users)`,
    });
    showToast(`Plan "${record.name}" created successfully.`);
    setShowCreatePlan(false);
    queueMicrotask(() => setIsCreatingPlan(false));
  }, [isSuperAdmin, addCustomPlan, addNotification, showToast, user]);

  /* ─── Table columns ──────────────────────────────────────────────── */
  const columns = useMemo(() => [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          aria-label="Select all rows on this page"
          title="Select every row on this page"
          checked={paginated.length > 0 && paginated.every((r) => selectedIds.has(r.id))}
          onChange={() => toggleAllOnPage(paginated)}
        />
      ),
      width: '32px',
      nowrap: true,
      render: (row) => (
        <input
          type="checkbox"
          aria-label={`Select ${row.name}`}
          checked={selectedIds.has(row.id)}
          onChange={() => toggleRowSelection(row.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'sr',
      header: '#',
      width: '36px',
      nowrap: true,
      render: (_row, idx) => (
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
          {(page - 1) * perPage + idx + 1}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Organisation',
      width: '180px',
      cellClassName: 'py-2',
      render: (row) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[8px] border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-300">
            <Building2 size={12} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOrg(row)}
              className="block max-w-[130px] truncate text-left text-[12px] font-bold text-[#0C2340] hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300"
              title={`Open details for ${row.name}`}
            >
              {safeText(row.name)}
            </button>
            <div className="max-w-[130px] truncate text-[10px] text-slate-400 dark:text-slate-500">
              {safeText(row.location)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'industry',
      header: 'Industry',
      width: '90px',
      nowrap: true,
      cellClassName: 'py-2 text-slate-700 dark:text-slate-200 text-[11px]',
      render: (row) => safeText(row.industry),
    },
    {
      key: 'country',
      header: 'Ctry',
      width: '52px',
      nowrap: true,
      cellClassName: 'py-2 text-slate-700 dark:text-slate-200 text-[11px]',
      render: (row) => {
        const c = COUNTRY_FLAGS[row.country];
        return (
          <span className="inline-flex items-center gap-1">
            <span aria-hidden="true">{c?.flag || '🌍'}</span>
            <span className="font-semibold">{c?.code || '—'}</span>
          </span>
        );
      },
    },
    {
      key: 'plan',
      header: 'Plan',
      width: '100px',
      nowrap: true,
      cellClassName: 'py-2',
      render: (row) => <PlanPill plan={row.plan} />,
    },
    {
      key: 'billingCycle',
      header: 'Billing',
      width: '62px',
      nowrap: true,
      cellClassName: 'py-2 text-slate-700 capitalize dark:text-slate-200 text-[11px]',
      render: (row) => safeText(row.billingCycle),
    },
    {
      key: 'price',
      header: 'Price',
      width: '90px',
      nowrap: true,
      cellClassName: 'py-2 text-slate-700 dark:text-slate-200',
      render: (row) => (
        <span className="text-[11px] font-semibold">
          {formatMoney(row.price)}
          <span className="ml-0.5 text-[10px] font-normal text-slate-400">
            /{row.billingCycle === 'yearly' ? 'yr' : 'mo'}
          </span>
        </span>
      ),
    },
    {
      key: 'mrrContribution',
      header: 'MRR',
      width: '80px',
      nowrap: true,
      cellClassName: 'py-2 text-slate-700 dark:text-slate-200 text-[11px]',
      render: (row) => {
        const monthly = row.billingCycle === 'yearly'
          ? Math.round((Number(row.price) || 0) / 12)
          : Number(row.price) || 0;
        return row.effectiveStatus === 'Active' ? formatMoney(monthly) : <span className="text-slate-400">—</span>;
      },
    },
    {
      key: 'signupDate',
      header: 'Signup',
      width: '82px',
      nowrap: true,
      cellClassName: 'py-2 text-slate-500 dark:text-slate-400 text-[11px]',
      render: (row) => {
        const d = row.startDate ? new Date(row.startDate) : null;
        return d && !Number.isNaN(d.getTime())
          ? d.toLocaleDateString('en-IN')
          : '—';
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '80px',
      nowrap: true,
      cellClassName: 'py-2',
      render: (row) => <StatusPill status={row.effectiveStatus} />,
    },
    {
      key: 'nextRenewal',
      header: 'Next Renewal',
      width: '90px',
      nowrap: true,
      cellClassName: 'py-2 text-slate-500 dark:text-slate-400 text-[11px]',
      render: (row) => {
        if (row.effectiveStatus === 'Cancelled') return <span className="text-slate-400">Cancelled</span>;
        if (!row.autoRenew && row.effectiveStatus === 'Expired') return <span className="text-slate-400">Expired</span>;
        return <span>{formatDate(row.endDate)}</span>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '104px',
      nowrap: true,
      cellClassName: 'py-2',
      render: (row) => {
        if (!canEdit && !canDelete) {
          return <span className="text-[11px] text-slate-400">—</span>;
        }
        const isCancelled = row.effectiveStatus === 'Cancelled';
        return (
          <div className="inline-flex items-center gap-0.5 rounded-[8px] border border-slate-200 bg-slate-50 p-0.5 dark:border-[#142535] dark:bg-[#071220]">
            <button
              type="button"
              onClick={() => setDrawerOrg(row)}
              title={`View details for ${safeText(row.name, 'organisation')}`}
              aria-label={`View details for ${safeText(row.name, 'organisation')}`}
              className="cursor-pointer rounded-[6px] p-1.5 text-slate-500 transition hover:bg-white hover:text-sky-600 hover:shadow-sm dark:text-slate-400 dark:hover:bg-[#1E1E3F] dark:hover:text-sky-300"
            >
              <Eye size={13} aria-hidden="true" />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => toggleAutoRenew(row)}
                disabled={isCancelled}
                title={row.autoRenew ? 'Disable auto-renew' : 'Enable auto-renew'}
                aria-label={`${row.autoRenew ? 'Disable' : 'Enable'} auto-renew for ${safeText(row.name, 'organisation')}`}
                className={`cursor-pointer rounded-[6px] p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  row.autoRenew
                    ? 'text-emerald-600 hover:bg-white hover:shadow-sm dark:text-emerald-400'
                    : 'text-slate-400 hover:bg-white hover:shadow-sm dark:text-slate-500'
                }`}
              >
                <RefreshCw size={13} aria-hidden="true" />
              </button>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => openChangePlan(row)}
                disabled={isCancelled}
                title={`Change plan for ${safeText(row.name, 'organisation')}`}
                aria-label={`Change plan for ${safeText(row.name, 'organisation')}`}
                className="cursor-pointer rounded-[6px] p-1.5 text-slate-500 transition hover:bg-white hover:text-amber-600 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-[#1E1E3F] dark:hover:text-amber-300"
              >
                <Pencil size={13} aria-hidden="true" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => requestCancel(row)}
                disabled={isCancelled}
                title={`Cancel subscription for ${safeText(row.name, 'organisation')}`}
                aria-label={`Cancel subscription for ${safeText(row.name, 'organisation')}`}
                className="cursor-pointer rounded-[6px] p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <XCircle size={13} aria-hidden="true" />
              </button>
            )}
          </div>
        );
      },
    },
  ], [page, perPage, canEdit, canDelete, openChangePlan, requestCancel, toggleAutoRenew, setDrawerOrg, selectedIds, paginated, toggleRowSelection, toggleAllOnPage]);

  /* ─── Role gate ───────────────────────────────────────────────────
   *  Subscription is the SaaS owner's customer-management surface —
   *  Super Admin only. Director/Manager/Reception/Service are denied
   *  by the RBAC matrix (view=false), but we also hard-check role
   *  here as defense-in-depth so an accidentally-granted bit can't
   *  expose the page. The Sidebar already hides the link via
   *  hasPermission(n.path, 'view').
   */
  if (!isSuperAdmin || !canView) {
    return <NoAccess module="Subscription" onGoBack={setActivePage ? () => setActivePage('dashboard') : undefined} />;
  }

  const hasFilters = Boolean(search) || statusFilter !== 'all' || planFilter !== 'all'
    || countryFilter !== 'all' || billingFilter !== 'all';

  /* ─── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#050E1A]">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {cancelTarget && (
        <ConfirmModal
          title="Cancel Subscription"
          message={`Are you sure you want to cancel the subscription for ${safeText(cancelTarget.name, 'this organisation')}? Auto-renew will be disabled.`}
          confirmLabel="Cancel Subscription"
          cancelLabel="Keep"
          onConfirm={confirmCancel}
          onCancel={() => setCancelTarget(null)}
          loading={isCancelling}
        />
      )}

<div className="w-full min-w-0 space-y-4">        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="break-words text-[20px] font-extrabold text-[#0C2340] font-['Outfit',sans-serif] dark:text-slate-100">
              Subscription Management
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-400 dark:text-slate-500">
              {stats.active} active · {stats.trial} trial · {stats.total} total · {mergedPlans.length} plans
            </p>
          </div>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setShowCreatePlan(true)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] border border-sky-700 bg-sky-700 px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:border-sky-800 hover:bg-sky-800"
              aria-label="Create a new subscription plan"
            >
              <Plus size={14} aria-hidden="true" /> Create Plan
            </button>
          )}
        </div>

        {/* Stats — two rows of three. Each card filters the table below. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Organisations" value={stats.total} tone="violet" Icon={Building2}
            active={statusFilter === 'all'}
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            title="Show every organisation"
          />
          <StatCard
            label="Active Subscriptions" value={stats.active} tone="emerald" Icon={CreditCard}
            active={statusFilter === 'Active'}
            onClick={() => { setStatusFilter('Active'); setPage(1); }}
            title="Filter table to active subscriptions"
          />
          <StatCard
            label="Trial Organisations" value={stats.trial} tone="sky" Icon={Sparkles}
            active={statusFilter === 'Trial'}
            onClick={() => { setStatusFilter('Trial'); setPage(1); }}
            title="Filter table to trial organisations"
          />
          <StatCard
            label="MRR" value={formatMoney(stats.mrr)} tone="amber" Icon={TrendingUp}
            hint="Monthly Recurring Revenue"
            title="Platform-wide monthly recurring revenue"
          />
          <StatCard
            label="ARR" value={formatMoney(stats.arr)} tone="blue" Icon={TrendingUp}
            hint="Annual Recurring Revenue (MRR × 12)"
            title="Platform-wide annual recurring revenue"
          />
          <StatCard
            label="Churn Rate" value={`${stats.churn.toFixed(1)}%`} tone="red" Icon={AlertTriangle}
            hint="Last 30 days"
            title="Percentage of active subscriptions cancelled in the last 30 days"
          />
        </div>

        {/* Alerts row — failed payments / upcoming renewals / trials ending */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AlertCard
            tone="red" Icon={AlertTriangle}
            label={`failed payment${CRITICAL_ALERTS.failedPayments.count === 1 ? '' : 's'}`}
            count={CRITICAL_ALERTS.failedPayments.count}
            sub={CRITICAL_ALERTS.failedPayments.count > 0
              ? `${formatMoney(CRITICAL_ALERTS.failedPayments.amountAed)} at risk`
              : 'No failed payments right now.'}
            cta="Retry All"
            title="Retry every failed payment in one batch"
            onClick={() => {
              showToast('Retry queued for all failed payments.', 'success');
              addAuditLog({
                userName:    user?.name || 'System',
                role:        user?.role || '',
                action:      'BILLING_RETRY_ALL',
                module:      'Subscription',
                description: `Queued retry for ${CRITICAL_ALERTS.failedPayments.count} failed payment(s).`,
              });
            }}
          />
          <AlertCard
            tone="blue" Icon={CalendarClock}
            label={`upcoming renewal${upcomingRenewals.length === 1 ? '' : 's'}`}
            count={upcomingRenewals.length}
            sub={upcomingRenewals.length > 0 ? 'Within the next 7 days.' : 'No renewals in the next 7 days.'}
            cta="View Upcoming"
            title="Filter to subscriptions renewing in the next 7 days"
            onClick={() => {
              setStatusFilter('Active');
              setPage(1);
              showToast(`${upcomingRenewals.length} organisation${upcomingRenewals.length === 1 ? '' : 's'} renew in the next 7 days.`, 'info');
            }}
          />
          <AlertCard
            tone="amber" Icon={Clock}
            label={`trial${trialsEndingSoon.length === 1 ? '' : 's'} ending`}
            count={trialsEndingSoon.length}
            sub={trialsEndingSoon.length > 0 ? 'Within the next 7 days.' : 'No trials ending soon.'}
            cta="View Trials"
            title="Filter to trials ending in the next 7 days"
            onClick={() => {
              setStatusFilter('Trial');
              setPage(1);
            }}
          />
        </div>

        {/* MRR trend chart — platform-wide, last 6 months */}
        <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm dark:border-[#142535] dark:bg-[#0A1828]">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="m-0 text-[14px] font-extrabold text-[#0C2340] dark:text-slate-100 font-['Outfit',sans-serif]">
                <RefreshCw size={14} aria-hidden="true" className="mr-1.5 -mt-0.5 inline-block text-sky-500" />
                MRR Trend — last 6 months
              </h3>
              <p className="m-0 mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                Active orgs: {Number(PLATFORM_METRICS.activeOrgs || 0).toLocaleString('en-IN')} (+{PLATFORM_METRICS.newThisMonth || 0} new this month)
              </p>
            </div>
          </div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={MRR_HISTORY}>
                <defs>
                  <linearGradient id="subMrrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#0EA5E9" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.12} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: 'currentColor' }} axisLine={false} tickLine={false} width={54} />
                <RTooltip formatter={(v) => formatMoney(v)} labelFormatter={(l) => `${l} 2026`} />
                <Area type="monotone" dataKey="mrr" stroke="#0EA5E9" strokeWidth={2.5} fill="url(#subMrrFill)" name="MRR" dot={{ r: 3, fill: '#0EA5E9' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm dark:border-[#142535] dark:bg-[#0A1828]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by organisation, industry, location or country…"
                aria-label="Search subscriptions"
                className="w-full rounded-[10px] border border-slate-200 bg-white py-2 pl-9 pr-9 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-200 dark:focus:ring-sky-500/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#1E1E3F] dark:hover:text-slate-200"
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>

            <SearchableSelect
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[
                { value: 'all',       label: 'All Statuses' },
                { value: 'Active',    label: 'Active' },
                { value: 'Trial',     label: 'Trial' },
                { value: 'Expired',   label: 'Expired' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
              placeholder="Filter by status"
            />

            <SearchableSelect
              value={planFilter}
              onChange={(v) => { setPlanFilter(v); setPage(1); }}
              options={[{ value: 'all', label: 'All Plans' }, ...planNames.map((p) => ({ value: p, label: p }))]}
              placeholder="Filter by plan"
            />

            <SearchableSelect
              value={countryFilter}
              onChange={(v) => { setCountryFilter(v); setPage(1); }}
              options={[{ value: 'all', label: 'All Countries' }, ...countryOptions.map((c) => ({ value: c, label: `${(COUNTRY_FLAGS[c]?.flag || '🌍')} ${c}` }))]}
              placeholder="Filter by country"
              searchPlaceholder="Search country…"
            />

            <SearchableSelect
              value={billingFilter}
              onChange={(v) => { setBillingFilter(v); setPage(1); }}
              options={[
                { value: 'all',     label: 'All Billing Cycles' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly',  label: 'Yearly' },
              ]}
              placeholder="Filter by billing cycle"
            />
          </div>
        </div>

        {/* Bulk-action bar — only renders when one or more rows are selected. */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-sky-200 bg-sky-50 px-4 py-3 shadow-sm dark:border-sky-400/30 dark:bg-sky-500/10">
            <div className="text-[13px] font-bold text-sky-800 dark:text-sky-200">
              {selectedIds.size} organisation{selectedIds.size === 1 ? '' : 's'} selected
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" title="Clear selection"
                      onClick={() => setSelectedIds(new Set())}
                      className="cursor-pointer rounded-[8px] border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                Clear
              </button>
              <button type="button" title="Export selected rows as CSV"
                      onClick={() => handleBulkExport('csv')}
                      className="cursor-pointer rounded-[8px] border border-sky-200 bg-white px-3 py-1.5 text-[11px] font-bold text-sky-700 hover:bg-sky-50">
                Export CSV
              </button>
              <button type="button" title="Export selected rows as Excel"
                      onClick={() => handleBulkExport('excel')}
                      className="cursor-pointer rounded-[8px] border border-sky-200 bg-white px-3 py-1.5 text-[11px] font-bold text-sky-700 hover:bg-sky-50">
                Export Excel
              </button>
              <button type="button" title="Export selected rows as PDF"
                      onClick={() => handleBulkExport('pdf')}
                      className="cursor-pointer rounded-[8px] border border-sky-200 bg-white px-3 py-1.5 text-[11px] font-bold text-sky-700 hover:bg-sky-50">
                Export PDF
              </button>
              <button type="button" title="Send an announcement to every selected organisation"
                      onClick={handleBulkAnnounce}
                      className="cursor-pointer rounded-[8px] border border-sky-700 bg-sky-700 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-sky-800">
                Send Announcement
              </button>
              <button type="button" title="Apply a discount to every selected organisation"
                      onClick={handleBulkDiscount}
                      className="cursor-pointer rounded-[8px] border border-blue-300 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-100">
                Apply Discount
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="mt-4 w-full min-w-0 max-w-full overflow-x-auto">
          <DataTable
            className="w-full min-w-0 max-w-full shadow-md"
            columns={columns}
            rows={paginated}
            getRowKey={(row) => row.id}
            page={page}
            perPage={perPage}
            total={filtered.length}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            forceTable
            mobileCard={(row, rowIndex) => {
              const isCancelled = row.effectiveStatus === 'Cancelled';
              const c = COUNTRY_FLAGS[row.country];
              return (
                <div className="px-4 py-3 border-b border-slate-100 dark:border-[#142535] hover:bg-slate-50 dark:hover:bg-[#1E1E3F]/40 transition">
                  {/* Row top: org name + status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-300">
                        <Building2 size={13} />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => setDrawerOrg(row)}
                          className="block truncate text-left text-[13px] font-bold text-[#0C2340] hover:text-sky-700 dark:text-slate-100 dark:hover:text-sky-300 max-w-[180px]"
                        >
                          {safeText(row.name)}
                        </button>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[180px]">
                          {safeText(row.location)}
                        </div>
                      </div>
                    </div>
                    <StatusPill status={row.effectiveStatus} />
                  </div>

                  {/* Row middle: 3-col grid of key info */}
                  <div className="grid grid-cols-3 gap-x-3 gap-y-2 mb-2.5">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Plan</div>
                      <PlanPill plan={row.plan} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Price</div>
                      <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
                        {formatMoney(row.price)}
                        <span className="text-[10px] font-normal text-slate-400 ml-0.5">/{row.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">MRR</div>
                      <div className="text-[12px] text-slate-700 dark:text-slate-200">
                        {row.effectiveStatus === 'Active'
                          ? formatMoney(row.billingCycle === 'yearly' ? Math.round((Number(row.price) || 0) / 12) : Number(row.price) || 0)
                          : <span className="text-slate-400">—</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Industry</div>
                      <div className="text-[12px] text-slate-600 dark:text-slate-300">{safeText(row.industry)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Country</div>
                      <div className="text-[12px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <span>{c?.flag || '🌍'}</span>
                        <span className="font-semibold">{c?.code || '—'}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Billing</div>
                      <div className="text-[12px] text-slate-600 dark:text-slate-300 capitalize">{safeText(row.billingCycle)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Signup</div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400">
                        {row.startDate ? new Date(row.startDate).toLocaleDateString('en-IN') : '—'}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">Next Renewal</div>
                      <div className="text-[12px] text-slate-500 dark:text-slate-400">
                        {isCancelled ? 'Cancelled' : (!row.autoRenew && row.effectiveStatus === 'Expired') ? 'Expired' : formatDate(row.endDate)}
                      </div>
                    </div>
                  </div>

                  {/* Row bottom: action buttons */}
                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setDrawerOrg(row)}
                        className="flex items-center gap-1 rounded-[7px] border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-300"
                      >
                        <Eye size={12} /> View
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openChangePlan(row)}
                          disabled={isCancelled}
                          className="flex items-center gap-1 rounded-[7px] border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-amber-600 shadow-sm hover:bg-amber-50 disabled:opacity-40 dark:border-[#142535] dark:bg-[#071220]"
                        >
                          <Pencil size={12} /> Plan
                        </button>
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => toggleAutoRenew(row)}
                          disabled={isCancelled}
                          className={`flex items-center gap-1 rounded-[7px] border px-2.5 py-1.5 text-[11px] font-semibold shadow-sm disabled:opacity-40 ${
                            row.autoRenew
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-[#142535] dark:bg-[#071220]'
                          }`}
                        >
                          <RefreshCw size={12} /> {row.autoRenew ? 'Auto' : 'Manual'}
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => requestCancel(row)}
                          disabled={isCancelled}
                          className="flex items-center gap-1 rounded-[7px] border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-40 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        >
                          <XCircle size={12} /> Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            }}
            emptyState={
              <EmptyState
                icon={CreditCard}
                message={hasFilters ? 'No matching subscriptions' : 'No Data'}
                description={
                  hasFilters
                    ? 'Try adjusting filters or search.'
                    : 'No subscriptions have been configured yet.'
                }
              />
            }
          />
        </div>
      </div>

      {/* Create-Plan modal (Super Admin only) — uses the shared editor.  */}
      <PlanEditorModal
        open={showCreatePlan && isSuperAdmin}
        plan={null}
        existingPlans={mergedPlans}
        featureCatalogue={FEATURE_CATALOGUE}
        onClose={() => setShowCreatePlan(false)}
        onSave={handleCreatePlan}
      />

      {/* Org detail drawer — slides from the right with four tabs. */}
      <OrgDetailDrawer
        open={Boolean(drawerOrg)}
        org={drawerOrg}
        plan={drawerOrg ? planIndex.get(drawerOrg.plan) : null}
        onClose={() => setDrawerOrg(null)}
        onChangePlan={(o) => { setDrawerOrg(null); openChangePlan(o); }}
        onPauseSubscription={handlePauseSubscription}
        onCancelSubscription={handleCancelFromDrawer}
        onSendAnnouncement={handleSendAnnouncementFromDrawer}
      />

      {/* Change-Plan modal */}
      {planModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-modal-title"
          className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closePlanModal(); }}
        >
          <div className="max-h-[92vh] w-full max-w-[480px] overflow-y-auto rounded-[14px] border border-slate-200 bg-white p-5 shadow-2xl sm:p-7 dark:border-[#142535] dark:bg-[#0A1828]">
            <h3
              id="plan-modal-title"
              className="mb-1 text-[16px] font-extrabold text-[#0C2340] font-['Outfit',sans-serif] dark:text-slate-100"
            >
              Change Plan
            </h3>
            <p className="mb-5 text-[12px] text-slate-500 dark:text-slate-400">
              {safeText(planModal.org.name, 'Organisation')}
            </p>

            <Field label="Plan" required>
              {(ctrl) => (
                <SearchableSelect
                  {...ctrl}
                  value={planModal.plan}
                  onChange={(v) => setPlanModal((s) => ({ ...s, plan: v }))}
                  options={planNames.map((p) => ({ value: p, label: p }))}
                />
              )}
            </Field>

            <Field label="Billing Cycle" required>
              {(ctrl) => (
                <SearchableSelect
                  {...ctrl}
                  value={planModal.billingCycle}
                  onChange={(v) => setPlanModal((s) => ({ ...s, billingCycle: v }))}
                  options={BILLING_CYCLES.map((c) => ({
                    value: c,
                    label: c.charAt(0).toUpperCase() + c.slice(1),
                  }))}
                />
              )}
            </Field>

            <div className="mb-4 rounded-[10px] border border-slate-200 bg-slate-50 p-3 text-[12px] text-slate-600 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-300">
              New price:{' '}
              <span className="font-bold text-[#0C2340] dark:text-slate-100">
                {formatMoney(defaultPriceFor(planModal.plan, planModal.billingCycle, planIndex))}
              </span>
              <span className="ml-1 text-slate-400">
                /{planModal.billingCycle === 'yearly' ? 'yr' : 'mo'}
              </span>
            </div>

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={closePlanModal}
                disabled={isSaving}
                className="flex-1 cursor-pointer rounded-[10px] border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#142535] dark:bg-[#071220] dark:text-slate-200 dark:hover:bg-[#1E1E3F]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveChangePlan}
                disabled={isSaving}
                className="flex-1 cursor-pointer rounded-[10px] border border-sky-700 bg-sky-700 py-2.5 text-[13px] font-bold text-white transition hover:border-sky-800 hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Update Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}