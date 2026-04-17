import React, { useMemo, useState } from 'react';
import { MOCK_APPOINTMENTS, MOCK_STAFF } from '../../data/mockData';

const STORAGE_KEY = 'cgms_appointments';
const STAFF_KEY = 'cgms_staff';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'declined'];
const APPT_STATUSES = ['pending', 'confirmed', 'declined'];

const emptyForm = {
  visitorName: '',
  company: '',
  email: '',
  phone: '',
  host: '',
  date: '',
  time: '',
  duration: '1 Hour',
  room: '',
  purpose: '',
  status: 'pending',
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function Badge({ status }) {
  const map = {
    pending: { bg: '#FFF7ED', color: '#C2410C' },
    confirmed: { bg: '#ECFDF5', color: '#15803D' },
    declined: { bg: '#FEF2F2', color: '#DC2626' },
  };

  const s = map[status] || map.pending;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.color}20`,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

function Toast({ msg, type = 'success', onClose }) {
  const colors =
    type === 'success'
      ? { bg: '#ECFDF5', color: '#15803D', border: '#86EFAC' }
      : { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' };

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        minWidth: 240,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{msg}</div>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            color: colors.color,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
          Confirm delete
        </h3>
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              background: '#fff',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: 'none',
              background: '#DC2626',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState(() =>
    safeRead(STORAGE_KEY, MOCK_APPOINTMENTS || [])
  );
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(emptyForm);

  const staff = useMemo(() => {
    const stored = safeRead(STAFF_KEY, MOCK_STAFF || []);
    return stored.filter((s) => (s.status || '').toLowerCase() === 'active');
  }, []);

  const filteredAppointments =
    filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const save = (next) => {
    setAppointments(next);
    safeWrite(STORAGE_KEY, next);
  };

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const openAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (a) => {
    setForm({
      visitorName: a.visitorName || '',
      company: a.company || '',
      email: a.email || '',
      phone: a.phone || '',
      host: a.host || '',
      date: a.date || '',
      time: a.time || '',
      duration: a.duration || '1 Hour',
      room: a.room || '',
      purpose: a.purpose || '',
      status: a.status || 'pending',
    });
    setErrors({});
    setEditItem(a);
    setShowForm(true);
  };

  const validate = () => {
    const e = {};
    if (!form.visitorName.trim()) e.visitorName = 'Visitor Name is required.';
    if (!form.email.trim()) e.email = 'Email ID is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid Email ID.';
    if (!form.phone.trim()) e.phone = 'Contact Number is required.';
    if (!form.host) e.host = 'Host is required.';
    if (!form.date) e.date = 'Date is required.';
    if (!form.time) e.time = 'Time is required.';
    if (!form.purpose) e.purpose = 'Purpose is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    let updated;
    if (editItem) {
      updated = appointments.map((a) =>
        a.id === editItem.id ? { ...a, ...form, id: a.id } : a
      );
      showToast('Appointment updated successfully.');
    } else {
      updated = [...appointments, { ...form, id: Date.now() }];
      showToast('Appointment added successfully.');
    }

    save(updated);
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const updated = appointments.filter((a) => a.id !== deleteTarget.id);
    save(updated);
    setDeleteTarget(null);
    showToast('Appointment deleted successfully.');
  };

  const inputBase =
    'w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] outline-none transition focus:border-violet-500';

  const Field = ({ label, req, err, children }) => (
    <div className="mb-3">
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
        {label}
        {req && <span className="text-red-600">*</span>}
      </label>
      {children}
      {err && <div className="mt-1 text-[11px] text-red-600">⚠ {err}</div>}
    </div>
  );

  return (
    <div className="w-full min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Are you sure you want to delete appointment for ${deleteTarget.visitorName}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[Outfit,sans-serif] text-[20px] font-extrabold text-[#1E1B4B]">
            Appointments
          </h2>
          <p className="text-[13px] text-slate-400">
            {appointments.length} scheduled visits
          </p>
        </div>

        <button
          onClick={openAdd}
          className="rounded-[10px] bg-violet-700 px-[18px] py-[9px] text-[13px] font-bold text-white transition hover:bg-violet-800"
        >
          + New Appointment
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'rounded-full border px-4 py-[7px] text-[12px] font-semibold transition',
              filter === f
                ? 'border-transparent bg-violet-700 text-white'
                : 'border-slate-200 bg-white text-slate-600',
            ].join(' ')}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filteredAppointments.map((a) => (
          <div
            key={a.id}
            className="rounded-[14px] border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-4">
                <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[10px] bg-violet-100 text-[11px] font-extrabold text-violet-700">
                  {(a.visitorName || '?')
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>
                  <div className="mb-0.5 text-[14px] font-bold text-[#1E1B4B]">
                    {a.visitorName}
                  </div>
                  <div className="mb-2 text-[12px] text-slate-400">
                    {a.company || 'No company'} · Host: {a.host}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {[
                      a.date ? ['📅', a.date] : null,
                      a.time ? ['⏰', a.time] : null,
                      a.duration ? ['⏱', a.duration] : null,
                      a.room ? ['🏢', a.room] : null,
                    ]
                      .filter(Boolean)
                      .map(([icon, val]) => (
                        <span
                          key={String(val)}
                          className="flex items-center gap-1 text-[11px] text-slate-600"
                        >
                          {icon} {val}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge status={a.status} />
                <button
                  onClick={() => openEdit(a)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteTarget(a)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 transition hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredAppointments.length === 0 && (
          <div className="rounded-[14px] border border-slate-200 bg-white p-10 text-center text-[14px] text-slate-400">
            No records found.
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-[16px] bg-white px-6 py-7 shadow-[0_8px_40px_rgba(0,0,0,0.18)] sm:px-8">
            <h3 className="mb-5 text-[16px] font-extrabold text-[#1E1B4B]">
              {editItem ? 'Edit Appointment' : 'New Appointment'}
            </h3>

            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field label="Visitor Name" req err={errors.visitorName}>
                  <input
                    value={form.visitorName}
                    onChange={(e) => setForm((p) => ({ ...p, visitorName: e.target.value }))}
                    placeholder="Enter Visitor Name"
                    className={inputBase}
                  />
                </Field>
              </div>

              <Field label="Company">
                <input
                  value={form.company}
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  placeholder="Enter Company Name"
                  className={inputBase}
                />
              </Field>

              <Field label="Email ID" req err={errors.email}>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="Enter Email ID"
                  className={inputBase}
                />
              </Field>

              <Field label="Contact Number" req err={errors.phone}>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Enter Contact Number"
                  className={inputBase}
                />
              </Field>

              <Field label="Host" req err={errors.host}>
                <select
                  value={form.host}
                  onChange={(e) => setForm((p) => ({ ...p, host: e.target.value }))}
                  className={inputBase}
                >
                  <option value="">Select Host</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date" req err={errors.date}>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className={inputBase}
                />
              </Field>

              <Field label="Time" req err={errors.time}>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
                  className={inputBase}
                />
              </Field>

              <Field label="Duration">
                <select
                  value={form.duration}
                  onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                  className={inputBase}
                >
                  {['15 Minutes', '30 Minutes', '45 Minutes', '1 Hour', '2 Hours'].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Purpose" req err={errors.purpose}>
                <select
                  value={form.purpose}
                  onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value }))}
                  className={inputBase}
                >
                  <option value="">Select Purpose</option>
                  {['Business Meeting', 'Interview', 'Consultation', 'Delivery', 'Contract Signing', 'Other'].map(
                    (p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Room / Venue">
                <input
                  value={form.room}
                  onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))}
                  placeholder="Enter Room or Venue"
                  className={inputBase}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className={inputBase}
                  >
                    {APPT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <div className="mt-2 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-[10px] border border-slate-200 bg-white py-[11px] text-[13px] font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-[10px] bg-violet-700 py-[11px] text-[13px] font-bold text-white"
              >
                {editItem ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}