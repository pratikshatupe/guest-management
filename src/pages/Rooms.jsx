import React, { useEffect, useMemo, useState } from 'react';
import { useAppointments } from '../context/AppointmentContext';
import {
  useVisibleAppointments,
  useVisibleBookings,
  useVisibleRooms,
} from '../hooks/useVisibleData';
import RoomCard, { RoomStatusPill } from '../components/RoomCard';
import BookingTable from '../components/BookingTable';
import {
  WeekScheduleGrid,
  RoomUtilizationReport,
} from '../components/RoomsAnalytics';
import { computeRoomUtilization } from '../utils/reportAnalytics';

function startOfWeekIso(dateIso) {
  const d = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateIso;
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}

function addDaysIso(dateIso, days) {
  const d = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateIso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const todayStr = () => new Date().toISOString().slice(0, 10);

/* Business hours used by the schedule grid. */
const SCHEDULE_HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); /* 08:00 → 20:00 */

function pad(n) { return String(n).padStart(2, '0'); }

/* ─── Small UI bits ────────────────────────────────────────────── */
function StatCard({ label, value, tone }) {
  const toneCls = {
    violet:  'border-sky-100 bg-sky-50 text-sky-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber:   'border-amber-100 bg-amber-50 text-amber-700',
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

function Modal({ title, onClose, children, size = 'md' }) {
  const widthCls = size === 'lg' ? 'max-w-3xl' : 'max-w-xl';
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`max-h-[92vh] w-full ${widthCls} overflow-y-auto rounded-xl bg-white p-6 shadow-2xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Booking form ────────────────────────────────────────────── */
function BookingForm({
  rooms,
  appointments,
  preselectedRoomId = '',
  onSubmit,
  onCancel,
  submitting = false,
  findConflict,
}) {
  const [form, setForm] = useState({
    roomId:        preselectedRoomId,
    date:          todayStr(),
    startTime:     '10:00',
    endTime:       '11:00',
    bookedBy:      '',
    purpose:       '',
    appointmentId: '',
  });
  const [errors, setErrors] = useState({});

  /* Surface overlaps inline so users see them before hitting submit. */
  const livePreview = useMemo(() => {
    if (!form.roomId || !form.date || !form.startTime || !form.endTime) return null;
    if (form.startTime >= form.endTime) return null;
    return findConflict?.({
      roomId:    form.roomId,
      date:      form.date,
      startTime: form.startTime,
      endTime:   form.endTime,
    }) || null;
  }, [form.roomId, form.date, form.startTime, form.endTime, findConflict]);

  const patch = (p) => {
    setForm((f) => ({ ...f, ...p }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(p).forEach((k) => delete next[k]);
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.roomId)                  errs.roomId    = 'Choose a room.';
    if (!form.date)                    errs.date      = 'Pick a date.';
    if (!form.startTime)               errs.startTime = 'Start time required.';
    if (!form.endTime)                 errs.endTime   = 'End time required.';
    if (form.startTime >= form.endTime) errs.endTime  = 'End time must be after start.';
    if (!form.bookedBy.trim())         errs.bookedBy  = 'Who is this booking for?';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit(form);
  };

  const baseField =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100';
  const fieldCls = (err) =>
    `${baseField} ${err ? 'border-red-400 focus:ring-red-100' : 'border-slate-200'}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Room <span className="text-red-500">*</span>
          </label>
          <select
            value={form.roomId}
            onChange={(e) => patch({ roomId: e.target.value })}
            className={fieldCls(errors.roomId)}
          >
            <option value="">Select a room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id} disabled={r.status === 'Under Maintenance'}>
                {r.name} — Capacity {r.capacity}{r.status === 'Under Maintenance' ? ' (maintenance)' : ''}
              </option>
            ))}
          </select>
          {errors.roomId && <p className="mt-1 text-xs text-red-500">{errors.roomId}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => patch({ date: e.target.value })}
            className={fieldCls(errors.date)}
          />
          {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Start <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => patch({ startTime: e.target.value })}
              className={fieldCls(errors.startTime)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              End <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => patch({ endTime: e.target.value })}
              className={fieldCls(errors.endTime)}
            />
          </div>
          {(errors.startTime || errors.endTime) && (
            <p className="col-span-2 text-xs text-red-500">{errors.endTime || errors.startTime}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Booked By <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.bookedBy}
            onChange={(e) => patch({ bookedBy: e.target.value })}
            placeholder="Guest or host name"
            className={fieldCls(errors.bookedBy)}
          />
          {errors.bookedBy && <p className="mt-1 text-xs text-red-500">{errors.bookedBy}</p>}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Link to Appointment (optional)</label>
          <select
            value={form.appointmentId}
            onChange={(e) => {
              const apt = appointments.find((a) => a.id === e.target.value);
              patch({
                appointmentId: e.target.value,
                /* Auto-fill bookedBy from the chosen appointment if the user left it blank. */
                bookedBy: form.bookedBy.trim() || apt?.guestName || '',
              });
            }}
            className={fieldCls(false)}
          >
            <option value="">— none —</option>
            {appointments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.guestName} · {a.date} {a.time}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Purpose (optional)</label>
          <textarea
            value={form.purpose}
            onChange={(e) => patch({ purpose: e.target.value })}
            rows={2}
            maxLength={200}
            placeholder="e.g. Product demo for KPMG."
            className={`${fieldCls(false)} resize-y`}
          />
        </div>
      </div>

      {livePreview && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          Conflict: {livePreview.roomName} is already booked {livePreview.startTime}–{livePreview.endTime}
          on {livePreview.date} by {livePreview.bookedBy}.
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || Boolean(livePreview)}
          className="rounded-lg border border-sky-700 bg-sky-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:opacity-60"
        >
          {submitting ? 'Booking…' : 'Confirm Booking'}
        </button>
      </div>
    </form>
  );
}

/* ─── Schedule view ───────────────────────────────────────────── */
function ScheduleView({ rooms, bookings, date, onDateChange }) {
  const bookingsForDay = useMemo(
    () => bookings.filter((b) => b.date === date && b.status !== 'Cancelled'),
    [bookings, date],
  );

  /* Quickly look up the booking occupying (room, hour). */
  const cellAt = (roomId, hour) => {
    const hh = `${pad(hour)}:00`;
    const nextHh = `${pad(hour + 1)}:00`;
    return bookingsForDay.find(
      (b) => b.roomId === roomId && b.startTime < nextHh && b.endTime > hh,
    ) || null;
  };

  /* Per-room column min-width keeps the table wide enough to avoid squishing
     and triggers horizontal scroll on small screens automatically. */
  const TIME_COL_W   = 72;   // px — sticky first column
  const ROOM_COL_MIN = 140;  // px per room column
  const tableMinW    = TIME_COL_W + rooms.length * ROOM_COL_MIN;

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800">Schedule</h3>
          {/* Mobile-only scroll hint */}
          <span className="text-[10px] font-medium text-slate-400 md:hidden">
            ← swipe →
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none focus:border-sky-400"
          />
        </div>
      </header>

      {/* Scrollable region — `overscroll-x-contain` stops scroll-chaining to the page;
          `[-webkit-overflow-scrolling:touch]` enables smooth iOS momentum scroll. */}
      <div className="w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <table
          className="w-full border-collapse text-xs"
          style={{ minWidth: tableMinW }}
        >
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 bg-slate-50 px-3 py-3 text-left shadow-[2px_0_4px_-2px_rgba(15,23,42,0.08)]"
                style={{ width: TIME_COL_W, minWidth: TIME_COL_W }}
              >
                Time
              </th>
              {rooms.map((r) => (
                <th
                  key={r.id}
                  scope="col"
                  className="px-2 py-3 text-left align-top"
                  style={{ minWidth: ROOM_COL_MIN }}
                >
                  <div className="truncate font-bold text-slate-600">{r.name}</div>
                  <div className="text-[10px] font-normal text-slate-400">Cap {r.capacity}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SCHEDULE_HOURS.map((h) => (
              <tr key={h}>
                <td
                  className="sticky left-0 z-10 bg-white px-3 py-2 font-semibold text-slate-600 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.08)] whitespace-nowrap"
                  style={{ width: TIME_COL_W, minWidth: TIME_COL_W }}
                >
                  {pad(h)}:00
                </td>
                {rooms.map((r) => {
                  const bk = cellAt(r.id, h);
                  if (!bk) {
                    return (
                      <td
                        key={r.id}
                        className="h-12 border-l border-slate-100 px-2 py-1 align-top"
                        style={{ minWidth: ROOM_COL_MIN }}
                      >
                        <span className="text-[10px] text-slate-300">Free</span>
                      </td>
                    );
                  }
                  /* Only render the booking label in its starting hour so
                     subsequent hours visually "merge" with a lighter band. */
                  const isStart = bk.startTime.startsWith(pad(h));
                  return (
                    <td
                      key={r.id}
                      className="h-12 border-l border-slate-100 px-2 py-1 align-top"
                      style={{ minWidth: ROOM_COL_MIN, background: 'rgba(14,165,233,0.08)' }}
                    >
                      {isStart && (
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-sky-800">{bk.bookedBy}</div>
                          <div className="text-[10px] text-sky-500 whitespace-nowrap">
                            {bk.startTime}–{bk.endTime}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
const ADMIN_ROLES = ['superadmin', 'director', 'manager', 'reception'];

export default function Rooms({ user }) {
  const {
    createBooking,
    cancelBooking,
    deleteBooking,
    updateRoomStatus,
    findConflict,
  } = useAppointments();
  const rooms        = useVisibleRooms();
  const bookings     = useVisibleBookings();
  const appointments = useVisibleAppointments();

  const role = (user?.role || '').toLowerCase();
  const canManage = ADMIN_ROLES.includes(role);
  const canAdmin  = role === 'superadmin' || role === 'director';

  const [view, setView] = useState('rooms'); /* 'rooms' | 'bookings' | 'schedule' | 'week' | 'utilization' */
  const [scheduleDate, setScheduleDate] = useState(todayStr());
  const [weekStart, setWeekStart]       = useState(() => startOfWeekIso(todayStr()));
  const [utilRange, setUtilRange]       = useState('week'); /* 'today' | 'week' | 'month' */
  const [showForm, setShowForm] = useState(false);
  const [prefillRoomId, setPrefillRoomId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [bookingFilter, setBookingFilter] = useState('all');
  const [search, setSearch] = useState('');

  /* Room + booking metrics are org-scoped here (instead of reading
     `metrics.rooms/bookings` from the shared context, which counts every
     tenant). Keeps Super Admin short-circuit implicit via the visible hooks. */
  const scopedMetrics = useMemo(() => {
    const today = todayStr();
    return {
      rooms: {
        total:       rooms.length,
        available:   rooms.filter((r) => r.status === 'Available').length,
        maintenance: rooms.filter((r) => r.status === 'Under Maintenance').length,
      },
      bookings: {
        total:     bookings.length,
        today:     bookings.filter((b) => b.date === today && b.status !== 'Cancelled').length,
        upcoming:  bookings.filter((b) => b.date > today && b.status !== 'Cancelled').length,
        cancelled: bookings.filter((b) => b.status === 'Cancelled').length,
      },
    };
  }, [rooms, bookings]);

  const utilResolved = useMemo(() => {
    const today = todayStr();
    if (utilRange === 'today') return { from: today, to: today };
    if (utilRange === 'week')  return { from: startOfWeekIso(today), to: today };
    return { from: addDaysIso(today, -29), to: today };
  }, [utilRange]);

  const utilStats = useMemo(
    () => computeRoomUtilization(rooms, bookings, utilResolved),
    [rooms, bookings, utilResolved],
  );

  const todaysByRoom = useMemo(() => {
    const today = todayStr();
    const buckets = new Map();
    bookings.forEach((b) => {
      if (b.date !== today || b.status === 'Cancelled') return;
      buckets.set(b.roomId, (buckets.get(b.roomId) || 0) + 1);
    });
    return buckets;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = todayStr();
    return bookings
      .slice()
      .sort((a, b) =>
        `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`),
      )
      .filter((b) => {
        if (bookingFilter === 'upcoming' && b.date < today) return false;
        if (bookingFilter === 'today'    && b.date !== today) return false;
        if (bookingFilter === 'past'     && b.date >= today) return false;
        if (bookingFilter === 'cancelled' && b.status !== 'Cancelled') return false;
        if (bookingFilter === 'confirmed' && b.status !== 'Confirmed') return false;
        if (!q) return true;
        return (
          b.roomName.toLowerCase().includes(q) ||
          b.bookedBy.toLowerCase().includes(q) ||
          (b.purpose || '').toLowerCase().includes(q)
        );
      });
  }, [bookings, bookingFilter, search]);

  const handleBookingSubmit = (form) => {
    setSubmitting(true);
    setTimeout(() => {
      const created = createBooking(form);
      setSubmitting(false);
      if (created) {
        setShowForm(false);
        setPrefillRoomId('');
      }
    }, 150);
  };

  const handleToggleMaintenance = (room) => {
    const next = room.status === 'Under Maintenance' ? 'Available' : 'Under Maintenance';
    updateRoomStatus(room.id, next);
  };

  /* Clear prefill when closing the modal. */
  useEffect(() => {
    if (!showForm) setPrefillRoomId('');
  }, [showForm]);

  return (
    <div className="w-full min-w-0 min-h-screen overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full min-w-0 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Rooms &amp; Bookings</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Book meeting rooms and conference venues. Double-booking is prevented.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
              {[
                { id: 'rooms',       label: 'Rooms' },
                { id: 'bookings',    label: 'Bookings' },
                { id: 'schedule',    label: 'Day' },
                { id: 'week',        label: 'Week' },
                { id: 'utilization', label: 'Utilization' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setView(tab.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                    view === tab.id ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => { setPrefillRoomId(''); setShowForm(true); }}
                className="rounded-lg border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                + New Booking
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Rooms"      value={scopedMetrics.rooms.total}       tone="violet" />
          <StatCard label="Available"        value={scopedMetrics.rooms.available}   tone="emerald" />
          <StatCard label="Maintenance"      value={scopedMetrics.rooms.maintenance} tone="amber" />
          <StatCard label="Today's Bookings" value={scopedMetrics.bookings.today}    tone="blue" />
        </div>

        {view === 'rooms' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => (
              <RoomCard
                key={r.id}
                room={r}
                todaysBookings={todaysByRoom.get(r.id) || 0}
                onBook={canManage ? (room) => { setPrefillRoomId(room.id); setShowForm(true); } : undefined}
                onToggleMaintenance={canAdmin ? handleToggleMaintenance : undefined}
              />
            ))}
          </div>
        )}

        {view === 'bookings' && (
          <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <header className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by room, guest, purpose…"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 md:max-w-sm"
              />
              <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5">
                {[
                  { id: 'all',       label: 'All'       },
                  { id: 'today',     label: 'Today'     },
                  { id: 'upcoming',  label: 'Upcoming'  },
                  { id: 'past',      label: 'Past'      },
                  { id: 'confirmed', label: 'Confirmed' },
                  { id: 'cancelled', label: 'Cancelled' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBookingFilter(f.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      bookingFilter === f.id ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </header>
            <BookingTable
              rows={filteredBookings}
              canManage={canManage}
              onCancel={(b) => cancelBooking(b.id)}
              onDelete={canAdmin ? (b) => deleteBooking(b.id) : undefined}
            />
          </section>
        )}

        {view === 'schedule' && (
          <ScheduleView
            rooms={rooms}
            bookings={bookings}
            date={scheduleDate}
            onDateChange={setScheduleDate}
          />
        )}

        {view === 'week' && (
          <WeekScheduleGrid
            rooms={rooms}
            bookings={bookings}
            weekStartDate={weekStart}
            onWeekChange={(iso) => setWeekStart(startOfWeekIso(iso))}
          />
        )}

        {view === 'utilization' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Range:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'week',  label: 'This Week' },
                  { id: 'month', label: 'Last 30 Days' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setUtilRange(opt.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                      utilRange === opt.id ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-400">
                {utilResolved.from} → {utilResolved.to}
              </span>
            </div>
            <RoomUtilizationReport util={utilStats} />
          </div>
        )}
      </div>

      {showForm && (
        <Modal title="New Room Booking" onClose={() => setShowForm(false)} size="lg">
          <BookingForm
            rooms={rooms}
            appointments={appointments}
            preselectedRoomId={prefillRoomId}
            submitting={submitting}
            findConflict={findConflict}
            onSubmit={handleBookingSubmit}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}

export { RoomStatusPill };
