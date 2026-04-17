import React, { useState, useEffect } from 'react';
import { MOCK_ORGANIZATIONS, SUBSCRIPTION_PLANS } from '../../data/mockData';

const safeLower = (value) => (value ?? '').toString().toLowerCase();
const safeText = (value, fallback = '—') => (value ?? fallback);
const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeStatus = (value, fallback = 'New') => (value ?? fallback);

/* ── Badge ── */
function Badge({ label, variant = 'default' }) {
  const styles = {
    enterprise: { bg: '#EDE9FE', color: '#5B21B6', border: '#C4B5FD' },
    professional: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    starter: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
    trial: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    active: { bg: '#ECFDF5', color: '#15803D', border: '#86EFAC' },
    suspended: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
    new: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    confirmed: { bg: '#ECFDF5', color: '#15803D', border: '#86EFAC' },
    declined: { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
    default: { bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  };
  const s = styles[safeLower(label)] || styles[variant] || styles.default;
  return (
    <span
      className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  );
}

/* ── Toggle ── */
function Toggle({ checked, onChange, color = '#6D28D9' }) {
  return (
    <button
      onClick={onChange}
      className="relative shrink-0 rounded-full border-none cursor-pointer transition-all duration-200"
      style={{ width: 40, height: 22, background: checked ? color : '#E2E8F0' }}
    >
      <div
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
        style={{ left: checked ? 20 : 3 }}
      />
    </button>
  );
}

/* ── NotifToggleRow ── */
function NotifToggleRow({ k, label, sub, notifSettings, onToggle, color = '#6D28D9' }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
      <div>
        <div className="text-[13px] font-semibold text-[#1E1B4B] mb-0.5">{label}</div>
        {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
      </div>
      <Toggle checked={notifSettings[k]} onChange={() => onToggle(k)} color={color} />
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'booking-requests', label: 'Booking Requests', icon: '📅' },
  { id: 'organizations', label: 'Organizations', icon: '🏢' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '💳' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookingRequests, setBookingRequests] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('All');

  useEffect(() => {
    const load = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('cgms_bookings') || '[]');
        setBookingRequests(Array.isArray(stored) ? stored : []);
      } catch {
        setBookingRequests([]);
      }
    };
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateBookingStatus = (id, status) => {
    const updated = safeArray(bookingRequests).map(b => (b?.id === id ? { ...b, status } : b));
    setBookingRequests(updated);
    try { localStorage.setItem('cgms_bookings', JSON.stringify(updated)); } catch {}
  };

  const deleteBooking = (id) => {
    const updated = safeArray(bookingRequests).filter(b => b?.id !== id);
    setBookingRequests(updated);
    try { localStorage.setItem('cgms_bookings', JSON.stringify(updated)); } catch {}
  };

  const filteredBookings = safeArray(bookingRequests).filter(b =>
    bookingFilter === 'All' ? true : safeStatus(b?.status) === bookingFilter
  );

  const notifInit = {
    emailOnCheckin: true, emailOnCheckout: false,
    whatsappOnCheckin: true, whatsappOnAppointment: true,
    inAppAll: true, smsUrgent: false,
    dailyDigest: true, weeklyReport: true,
  };
  const [notifSettings, setNotifSettings] = useState(notifInit);
  const toggleNotif = (k) => setNotifSettings(p => ({ ...p, [k]: !p[k] }));

  const newCount = safeArray(bookingRequests).filter(b => safeStatus(b?.status) === 'New').length;

  return (
    <div className="w-full min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 bg-slate-50 min-h-full">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-[11px] font-bold tracking-[0.08em] text-violet-600 bg-violet-50 border border-violet-200 px-3 py-1 rounded-[6px]">
            SUPER ADMIN
          </span>
          <h2 className="font-[Outfit,sans-serif] text-[20px] font-extrabold text-[#1E1B4B]">
            Admin Panel
          </h2>
        </div>
        <p className="text-[13px] text-slate-400">Global platform control and management</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white border border-slate-200 rounded-[12px] p-1 w-fit shadow-sm">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[12px] font-semibold transition relative"
            style={{
              background: activeTab === t.id ? '#6D28D9' : 'transparent',
              color: activeTab === t.id ? 'white' : '#64748B',
            }}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.id === 'booking-requests' && newCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                {newCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Active Organizations', val: 12, icon: '🏢', sub: '+2 this month', color: '#6D28D9' },
              { label: 'Total Users', val: 284, icon: '👥', sub: '+18 this month', color: '#15803D' },
              { label: 'Monthly Revenue', val: '$4.2K', icon: '💰', sub: '+14% growth', color: '#B45309' },
              { label: 'System Uptime', val: '99.9%', icon: '⚡', sub: 'Last 30 days', color: '#0369A1' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-[14px] shadow-sm hover:shadow-md transition p-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${s.color}, transparent 60%)` }} />
                <div className="flex justify-between items-start mb-3">
                  <div className="text-2xl">{s.icon}</div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">↑</span>
                </div>
                <div className="font-[Outfit,sans-serif] text-[30px] font-extrabold leading-none mb-1" style={{ color: s.color }}>{s.val}</div>
                <div className="text-[12px] font-semibold text-slate-600 mb-0.5">{s.label}</div>
                <div className="text-[11px] text-slate-400">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Recent Orgs Table */}
          <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#1E1B4B]">Recent Organizations</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['Organization', 'Plan', 'Users', 'Offices', 'Revenue', 'Status', 'Action'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {safeArray(MOCK_ORGANIZATIONS).slice(0, 5).map((o, idx) => (
                    <tr key={o?.id ?? idx} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-5 py-3.5 text-[13px] font-semibold text-[#1E1B4B]">{safeText(o?.name)}</td>
                      <td className="px-4 py-3.5"><Badge label={safeText(o?.plan)} /></td>
                      <td className="px-4 py-3.5 font-mono text-[12px] text-slate-600">{safeText(o?.users, 0)}</td>
                      <td className="px-4 py-3.5 font-mono text-[12px] text-slate-600">{safeText(o?.offices, 0)}</td>
                      <td className="px-4 py-3.5 text-[12px] font-semibold text-emerald-600">{safeText(o?.revenue)}</td>
                      <td className="px-4 py-3.5"><Badge label={safeStatus(o?.status, 'Trial')} /></td>
                      <td className="px-4 py-3.5">
                        <button className="px-3 py-1.5 rounded-[8px] border border-slate-200 bg-white text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition">Manage</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── BOOKING REQUESTS ── */}
      {activeTab === 'booking-requests' && (
        <div>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div>
              <h3 className="font-[Outfit,sans-serif] text-[16px] font-extrabold text-[#1E1B4B] mb-1 flex items-center gap-2">
                Appointment Booking Requests
                {newCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">{newCount} New</span>
                )}
              </h3>
              <p className="text-[12px] text-slate-400">Submissions from the landing page "Book Appointment" form</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['All', 'New', 'Confirmed', 'Declined'].map(f => (
                <button
                  key={f}
                  onClick={() => setBookingFilter(f)}
                  className="px-4 py-2 rounded-full text-[12px] font-semibold border transition"
                  style={{
                    background: bookingFilter === f ? '#6D28D9' : 'white',
                    color: bookingFilter === f ? 'white' : '#64748B',
                    borderColor: bookingFilter === f ? '#6D28D9' : '#E2E8F0',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-200 rounded-[14px] bg-white">
              <div className="text-5xl mb-4">📅</div>
              <p className="text-slate-400 text-[14px]">
                {bookingFilter === 'All'
                  ? "No booking requests yet. They'll appear here when visitors submit the form."
                  : `No ${safeLower(bookingFilter)} requests.`}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredBookings.map((b, idx) => {
                const status = safeStatus(b?.status);
                const statusColors = { New: '#C2410C', Confirmed: '#15803D', Declined: '#DC2626' };
                const statusBgs = { New: '#FFF7ED', Confirmed: '#ECFDF5', Declined: '#FEF2F2' };
                const statusBorders = { New: '#FED7AA', Confirmed: '#86EFAC', Declined: '#FCA5A5' };
                const sc = statusColors[status] || '#6D28D9';
                const sb = statusBgs[status] || '#F5F3FF';
                const sbr = statusBorders[status] || '#DDD6FE';
                const initials = safeText(b?.name, '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                return (
                  <div key={b?.id ?? idx} className="bg-white border border-slate-200 rounded-[14px] shadow-sm hover:shadow-md transition px-5 py-4 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[14px]" style={{ background: sc }} />
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex flex-wrap items-center gap-2.5 mb-3">
                          <div
                            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[12px] font-extrabold shrink-0"
                            style={{ background: sb, color: sc, border: `1px solid ${sbr}` }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-[#1E1B4B]">{safeText(b?.name)}</div>
                            <div className="text-[11px] text-slate-400">{safeText(b?.company, 'No company')} · {safeText(b?.email)}</div>
                          </div>
                          <span
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: sb, color: sc, border: `1px solid ${sbr}` }}
                          >
                            {status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4">
                          {[
                            { icon: '📞', val: safeText(b?.phone) },
                            { icon: '📅', val: b?.date ? `${safeText(b?.date)} at ${safeText(b?.time)}` : 'Date TBD' },
                            { icon: '🎯', val: safeText(b?.purpose, 'Not specified') },
                          ].map(({ icon, val }) => (
                            <div key={icon} className="flex items-center gap-1.5 text-[12px] text-slate-500">
                              <span>{icon}</span><span>{val}</span>
                            </div>
                          ))}
                        </div>
                        {b?.message && (
                          <div className="mt-2.5 px-3 py-2 bg-slate-50 border border-slate-100 rounded-[8px] text-[12px] text-slate-500 italic">
                            &quot;{b.message}&quot;
                          </div>
                        )}
                        <div className="mt-1.5 text-[11px] text-slate-400">Submitted: {safeText(b?.submittedAt)}</div>
                      </div>
                      <div className="flex gap-2 shrink-0 flex-wrap">
                        {status !== 'Confirmed' && (
                          <button
                            onClick={() => updateBookingStatus(b?.id, 'Confirmed')}
                            className="px-3.5 py-2 rounded-[8px] border border-emerald-200 bg-emerald-50 text-emerald-700 text-[12px] font-semibold hover:bg-emerald-100 transition"
                          >
                            ✓ Confirm
                          </button>
                        )}
                        {status !== 'Declined' && (
                          <button
                            onClick={() => updateBookingStatus(b?.id, 'Declined')}
                            className="px-3.5 py-2 rounded-[8px] border border-red-200 bg-red-50 text-red-600 text-[12px] font-semibold hover:bg-red-100 transition"
                          >
                            ✗ Decline
                          </button>
                        )}
                        <button
                          onClick={() => deleteBooking(b?.id)}
                          className="px-2.5 py-2 rounded-[8px] border border-slate-200 bg-white text-slate-400 text-[12px] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ORGANIZATIONS ── */}
      {activeTab === 'organizations' && (
        <div>
          <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
            <div className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#1E1B4B]">
              All Organizations ({safeArray(MOCK_ORGANIZATIONS).length})
            </div>
            <button className="px-4 py-2.5 rounded-[10px] bg-violet-700 text-white text-[13px] font-bold hover:bg-violet-800 transition">
              + Add Organization
            </button>
          </div>
          <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['Organization', 'Contact', 'Plan', 'Users', 'Offices', 'Revenue', 'Joined', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {safeArray(MOCK_ORGANIZATIONS).map((o, idx) => (
                    <tr key={o?.id ?? idx} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-[#1E1B4B]">{safeText(o?.name)}</td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-400">{safeText(o?.contact)}</td>
                      <td className="px-4 py-3.5"><Badge label={safeText(o?.plan)} /></td>
                      <td className="px-4 py-3.5 font-mono text-[12px] text-slate-600">{safeText(o?.users, 0)}</td>
                      <td className="px-4 py-3.5 font-mono text-[12px] text-slate-600">{safeText(o?.offices, 0)}</td>
                      <td className="px-4 py-3.5 text-[12px] font-semibold text-emerald-600">{safeText(o?.revenue)}</td>
                      <td className="px-4 py-3.5 text-[11px] text-slate-400">{safeText(o?.joined)}</td>
                      <td className="px-4 py-3.5"><Badge label={safeText(o?.status)} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 rounded-[8px] border border-slate-200 bg-white text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition">Edit</button>
                          <button className="px-3 py-1.5 rounded-[8px] border border-red-200 bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100 transition">Suspend</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTIONS ── */}
      {activeTab === 'subscriptions' && (
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {safeArray(SUBSCRIPTION_PLANS).map(p => {
              const count = safeArray(MOCK_ORGANIZATIONS).filter(o => safeText(o?.plan) === safeText(p?.name)).length;
              return (
                <div key={p?.id ?? p?.name} className="bg-white border border-slate-200 rounded-[14px] shadow-sm hover:shadow-md transition p-5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-2" style={{ color: p?.color || '#6D28D9' }}>{safeText(p?.name)}</div>
                  <div className="font-[Outfit,sans-serif] text-[32px] font-extrabold text-[#1E1B4B] leading-none mb-1">{count}</div>
                  <div className="text-[12px] text-slate-400 mb-2">organizations</div>
                  <div className="text-[13px] font-semibold text-emerald-600">${(Number(p?.price || 0) * count).toLocaleString()}/mo MRR</div>
                </div>
              );
            })}
          </div>
          <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#1E1B4B]">Subscription Activity</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['Organization', 'Plan', 'Billing', 'MRR', 'Next Renewal', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {safeArray(MOCK_ORGANIZATIONS).map((o, idx) => (
                    <tr key={o?.id ?? idx} className="border-t border-slate-100 hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5 text-[13px] font-semibold text-[#1E1B4B]">{safeText(o?.name)}</td>
                      <td className="px-4 py-3.5"><Badge label={safeText(o?.plan)} /></td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-600">Monthly</td>
                      <td className="px-4 py-3.5 text-[12px] font-semibold text-emerald-600">{safeText(o?.revenue)}</td>
                      <td className="px-4 py-3.5 text-[12px] text-slate-400">Apr 15, 2024</td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 rounded-[8px] border border-slate-200 bg-white text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition">Change Plan</button>
                          <button className="px-3 py-1.5 rounded-[8px] border border-red-200 bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100 transition">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab === 'notifications' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            {/* Email */}
            <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-[10px] bg-violet-50 border border-violet-100 flex items-center justify-center text-[17px]">📧</div>
                <div>
                  <div className="text-[13px] font-bold text-[#1E1B4B]">Email Notifications</div>
                  <div className="text-[11px] text-slate-400">Sent to admin@bizzfly.com</div>
                </div>
              </div>
              {[
                { k: 'emailOnCheckin', label: 'Visitor Check-in', sub: 'Email when visitor checks in' },
                { k: 'emailOnCheckout', label: 'Visitor Check-out', sub: 'Email when visitor leaves' },
                { k: 'dailyDigest', label: 'Daily Digest', sub: 'Summary email every morning at 8 AM' },
                { k: 'weeklyReport', label: 'Weekly Report', sub: 'Visitor analytics every Monday' },
              ].map(item => (
                <NotifToggleRow key={item.k} {...item} notifSettings={notifSettings} onToggle={toggleNotif} color="#6D28D9" />
              ))}
            </div>

            {/* WhatsApp */}
            <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[17px]">💬</div>
                <div>
                  <div className="text-[13px] font-bold text-[#1E1B4B]">WhatsApp Alerts</div>
                  <div className="text-[11px] text-slate-400">Sends via WhatsApp Business API</div>
                </div>
              </div>
              {[
                { k: 'whatsappOnCheckin', label: 'Visitor Arrival Alert', sub: 'WhatsApp when guest arrives' },
                { k: 'whatsappOnAppointment', label: 'Appointment Reminder', sub: '1 hour before scheduled visit' },
                { k: 'smsUrgent', label: 'SMS Fallback', sub: 'SMS if WhatsApp delivery fails' },
              ].map(item => (
                <NotifToggleRow key={item.k} {...item} notifSettings={notifSettings} onToggle={toggleNotif} color="#15803D" />
              ))}
            </div>

            {/* In-App */}
            <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-[10px] bg-violet-50 border border-violet-100 flex items-center justify-center text-[17px]">🔔</div>
                <div>
                  <div className="text-[13px] font-bold text-[#1E1B4B]">In-App Notifications</div>
                  <div className="text-[11px] text-slate-400">Real-time dashboard alerts</div>
                </div>
              </div>
              <NotifToggleRow k="inAppAll" label="All In-App Alerts" sub="Show notifications in dashboard" notifSettings={notifSettings} onToggle={toggleNotif} color="#6D28D9" />
              <div className="mt-3 p-3 bg-violet-50 border border-violet-100 rounded-[10px]">
                <div className="text-[11px] text-slate-500 mb-2">Current Status</div>
                <div className="flex gap-4">
                  {[{ v: '7', l: 'Total', c: '#6D28D9' }, { v: '3', l: 'Unread', c: '#DC2626' }, { v: '4', l: 'Read', c: '#15803D' }].map(s => (
                    <div key={s.l} className="text-center">
                      <div className="font-[Outfit,sans-serif] text-[20px] font-extrabold" style={{ color: s.c }}>{s.v}</div>
                      <div className="text-[10px] text-slate-400">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Delivery Log */}
            <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm p-5">
              <div className="text-[13px] font-bold text-[#1E1B4B] mb-4">Recent Delivery Log</div>
              <div className="flex flex-col gap-0">
                {[
                  { msg: 'Mohammed Al Rashid checked in', channel: '📧 Email', ok: true, time: '2 min ago' },
                  { msg: 'Pantry request from Board Room A', channel: '💬 WhatsApp', ok: true, time: '5 min ago' },
                  { msg: 'Appointment: Fatima Al Zaabi', channel: '🔔 In-App', ok: true, time: '15 min ago' },
                  { msg: 'Sarah Johnson checked out', channel: '📧 Email', ok: false, time: '2 hr ago' },
                ].map((l, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-600 truncate mb-0.5">{l.msg}</div>
                      <div className="text-[10px] text-slate-400">{l.channel} · {l.time}</div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: l.ok ? '#ECFDF5' : '#FEF2F2',
                        color: l.ok ? '#15803D' : '#DC2626',
                        border: `1px solid ${l.ok ? '#86EFAC' : '#FCA5A5'}`,
                      }}
                    >
                      {l.ok ? 'Delivered' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button className="px-5 py-2.5 rounded-[10px] bg-violet-700 text-white text-[13px] font-bold hover:bg-violet-800 transition">
            Save Notification Settings
          </button>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Platform Settings */}
          <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm p-5">
            <div className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#1E1B4B] mb-4">Platform Settings</div>
            <PlatformToggles />
          </div>

          {/* System Health */}
          <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm p-5">
            <div className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#1E1B4B] mb-4">System Health</div>
            {[
              { label: 'API Server', status: 'Operational', ok: true },
              { label: 'Database', status: 'Operational', ok: true },
              { label: 'Notification Service', status: 'Operational', ok: true },
              { label: 'WhatsApp Integration', status: 'Degraded', ok: false, warning: true },
              { label: 'File Storage', status: 'Operational', ok: true },
            ].map((s, i, arr) => {
              const color = s.warning ? '#B45309' : s.ok ? '#15803D' : '#DC2626';
              const bg = s.warning ? '#FFF7ED' : s.ok ? '#ECFDF5' : '#FEF2F2';
              return (
                <div key={s.label} className={`flex justify-between items-center py-3 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <span className="text-[13px] text-slate-600">{s.label}</span>
                  <span
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: bg, color }}
                  >
                    {s.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformToggles() {
  const items = [
    { label: 'Maintenance Mode', sub: 'Disable access for all users temporarily', def: false },
    { label: 'Allow New Registrations', sub: 'Let new organizations sign up', def: true },
    { label: 'Force 2FA for Admins', sub: 'Require two-factor auth for admin logins', def: false },
    { label: 'Audit Logging', sub: 'Log all admin actions to audit trail', def: true },
  ];
  const [vals, setVals] = useState(items.map(i => i.def));

  return (
    <>
      {items.map((s, idx) => (
        <div key={s.label} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
          <div>
            <div className="text-[13px] font-semibold text-[#1E1B4B] mb-0.5">{s.label}</div>
            <div className="text-[11px] text-slate-400">{s.sub}</div>
          </div>
          <button
            onClick={() => setVals(v => v.map((x, i) => i === idx ? !x : x))}
            className="relative shrink-0 rounded-full border-none cursor-pointer transition-all duration-200"
            style={{ width: 40, height: 22, background: vals[idx] ? '#6D28D9' : '#E2E8F0' }}
          >
            <div
              className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: vals[idx] ? 20 : 3 }}
            />
          </button>
        </div>
      ))}
    </>
  );
}