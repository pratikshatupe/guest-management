import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../context/AppointmentContext';
import { useNotifications } from '../context/NotificationContext';
import { useVisibleNotifications } from '../hooks/useVisibleData';
import NotificationList from '../components/NotificationList';
import SentMessagesPanel from '../components/SentMessagesPanel';

function StatCard({ label, value, tone }) {
  const toneCls = {
    violet:  'border-sky-100 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    slate:   'border-slate-100 bg-slate-50 text-slate-700',
    red:     'border-red-100 bg-red-50 text-red-700',
  }[tone];
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${toneCls}`}>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      <p className="mt-1.5 text-[12px] font-semibold opacity-80">{label}</p>
    </div>
  );
}

const TYPE_OPTIONS = [
  { id: 'all',         label: 'All' },
  { id: 'appointment', label: 'Appointments' },
  { id: 'service',     label: 'Services' },
  { id: 'check-in',    label: 'Check-ins' },
];

export default function Notifications() {
  const { user } = useAuth();
  const { staff } = useAppointments();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  const [typeFilter, setTypeFilter]       = useState('all');
  const [unreadOnly, setUnreadOnly]       = useState(false);

  /* Opening the page counts as reading the queue — clears unread everywhere. */
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const currentStaffId = useMemo(() => {
    if (!user) return null;
    if (user.staffId) return user.staffId;
    const match = staff.find(
      (s) => s.name?.toLowerCase() === (user.name || '').toLowerCase(),
    );
    return match ? match.id : null;
  }, [user, staff]);

  /* Role-scoped via the shared hook — Super Admin sees everything,
     Service Staff sees only notifications targeted at them, everyone else
     sees notifications where their role is whitelisted. */
  const visible = useVisibleNotifications();

  const filtered = useMemo(() => visible.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (unreadOnly && n.isRead) return false;
    return true;
  }), [visible, typeFilter, unreadOnly]);

  const stats = useMemo(() => ({
    total:  visible.length,
    unread: visible.filter((n) => !n.isRead).length,
    today:  visible.filter((n) => {
      const today = new Date().toISOString().slice(0, 10);
      return (n.timestamp || '').slice(0, 10) === today;
    }).length,
  }), [visible]);

  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Notifications</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Real-time updates across your modules.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stats.unread > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="rounded-lg border border-sky-700 bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-800"
              >
                Mark all as read
              </button>
            )}
            {visible.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Total"      value={stats.total}  tone="violet" />
          <StatCard label="Unread"     value={stats.unread} tone="red" />
          <StatCard label="Today"      value={stats.today}  tone="emerald" />
        </div>

        <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTypeFilter(opt.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    typeFilter === opt.id ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
              />
              Unread only
            </label>
          </header>

          <NotificationList
            notifications={filtered}
            onItemClick={(n) => {
              markAsRead(n.id);
              /* Dismiss on ctrl-click as a handy gesture. */
              if (window.event?.ctrlKey) removeNotification(n.id);
            }}
            emptyLabel={
              visible.length === 0
                ? "You're all caught up."
                : 'No notifications match these filters.'
            }
          />
        </section>

        <SentMessagesPanel />
      </div>
    </div>
  );
}
