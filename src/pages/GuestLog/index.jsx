import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { MOCK_VISITORS } from '../../data/mockData';

const TODAY_STR = '2024-03-15';
const WEEK_DATES = ['2024-03-11', '2024-03-12', '2024-03-13', '2024-03-14', '2024-03-15'];
const MONTH_DATES_PREFIX = '2024-03';

/* ── Status config ── */
const STATUS_META = {
  inside: { label: 'Inside', bg: '#ECFDF5', color: '#15803D', border: '#86EFAC' },
  'checked-out': { label: 'Checked Out', bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB' },
  expected: { label: 'Expected', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
  'no-show': { label: 'No Show', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
};

/* ── Badge ── */
function Badge({ status }) {
  const s = STATUS_META[status] || STATUS_META.expected;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {s.label}
    </span>
  );
}

/* ── Avatar ── */
function Avatar({ name, status }) {
  const s = STATUS_META[status] || STATUS_META.expected;
  const initials = (name || '?').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className="flex w-10 h-10 shrink-0 items-center justify-center rounded-[10px] text-[12px] font-bold"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {initials || '?'}
    </div>
  );
}

/* ── Field ── */
function Field({ label, name, value, onChange, type = 'text', placeholder, opts, error }) {
  const base = 'w-full rounded-[10px] border px-3 py-2 text-[13px] outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white text-slate-700 placeholder:text-slate-300';
  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <label htmlFor={name} className="text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
        {label}
      </label>
      {opts ? (
        <select
          id={name} name={name} value={value} onChange={onChange}
          className={`${base} ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
        >
          {opts.map(o => {
            const v = typeof o === 'object' ? o.v : o;
            const l = typeof o === 'object' ? o.l : o;
            return <option key={v || l} value={v}>{l || '—'}</option>;
          })}
        </select>
      ) : (
        <input
          id={name} name={name} type={type} value={value} placeholder={placeholder} onChange={onChange}
          className={`${base} ${error ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
        />
      )}
      {error && <span className="text-[11px] text-red-500">⚠ {error}</span>}
    </div>
  );
}

/* ── Toast ── */
function Toast({ msg, type = 'success', onClose }) {
  const ok = type === 'success';
  return (
    <div
      className="fixed top-5 right-5 z-[10000] rounded-[12px] px-4 py-3 shadow-lg min-w-[240px] flex items-start gap-3"
      style={{
        background: ok ? '#ECFDF5' : '#FEF2F2',
        border: `1px solid ${ok ? '#86EFAC' : '#FCA5A5'}`,
        color: ok ? '#15803D' : '#DC2626',
      }}
    >
      <div className="flex-1 text-[13px] font-semibold">{msg}</div>
      <button onClick={onClose} className="text-[16px] leading-none opacity-60 hover:opacity-100">×</button>
    </div>
  );
}

/* ── ConfirmModal ── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-[16px] p-6 shadow-2xl">
        <h3 className="text-[16px] font-extrabold text-[#1E1B4B] mb-2">Confirm delete</h3>
        <p className="text-[13px] text-slate-500 leading-relaxed">{message}</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-[10px] bg-red-600 text-white text-[13px] font-bold hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ── AddGuestModal ── */
const AddGuestModal = memo(function AddGuestModal({ onClose, onAdd }) {
  const init = { name: '', company: '', phone: '', host: '', purpose: '', idType: 'Emirates ID', office: 'Dubai', type: 'walk-in', status: 'inside', room: '', checkin: '' };
  const [form, setForm] = useState(init);
  const [errs, setErrs] = useState({});

  useEffect(() => {
    setForm(p => ({ ...p, checkin: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    setErrs(p => ({ ...p, [name]: '' }));
  }, []);

  const validate = useCallback(() => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.host.trim()) e.host = 'Required';
    if (!form.purpose.trim()) e.purpose = 'Required';
    return e;
  }, [form]);

  const submit = useCallback(() => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    const newGuest = { ...form, id: Date.now(), date: TODAY_STR, checkout: null };
    onAdd(newGuest);
    try {
      const existing = JSON.parse(localStorage.getItem('cgms_walkins') || '[]');
      localStorage.setItem('cgms_walkins', JSON.stringify([newGuest, ...existing]));
      const notifs = JSON.parse(localStorage.getItem('cgms_live_notifs') || '[]');
      notifs.unshift({ id: Date.now(), type: 'checkin', message: `${form.name} added to Guest Log — ${form.purpose}`, time: 'Just now', read: false });
      localStorage.setItem('cgms_live_notifs', JSON.stringify(notifs.slice(0, 20)));
    } catch {}
    onClose();
  }, [form, onAdd, onClose, validate]);

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-[16px] bg-white px-6 py-7 shadow-2xl sm:px-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-violet-100 flex items-center justify-center text-xl shrink-0">🚶</div>
            <div>
              <h3 className="text-[16px] font-extrabold text-[#1E1B4B]">Add Guest</h3>
              <p className="text-[12px] text-slate-400">Register a new visitor manually</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-slate-200 text-slate-400 hover:bg-slate-50 text-[18px] leading-none">×</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <div className="md:col-span-2">
            <Field label="Full Name *" name="name" value={form.name} onChange={handleChange} placeholder="Visitor name" error={errs.name} />
          </div>
          <Field label="Phone *" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 xxxxx" error={errs.phone} />
          <Field label="Company" name="company" value={form.company} onChange={handleChange} placeholder="Organization" />
          <Field label="Host / Meeting With *" name="host" value={form.host} onChange={handleChange} placeholder="Employee name" error={errs.host} />
          <Field label="Purpose *" name="purpose" value={form.purpose} onChange={handleChange}
            opts={['', 'Business Meeting', 'Interview', 'Delivery', 'Site Visit', 'Consultation', 'Partnership', 'Other']}
            error={errs.purpose}
          />
          <Field label="ID Type" name="idType" value={form.idType} onChange={handleChange} opts={['Emirates ID', 'Passport', 'Driving License', 'Other']} />
          <Field label="Office" name="office" value={form.office} onChange={handleChange} opts={['Dubai', 'Abu Dhabi', 'Sharjah']} />
          <Field label="Room / Location" name="room" value={form.room} onChange={handleChange} placeholder="Room / Cabin" />
          <Field label="Type" name="type" value={form.type} onChange={handleChange} opts={[{ v: 'walk-in', l: 'Walk-in' }, { v: 'pre-appointed', l: 'Pre-Appointed' }]} />
          <Field label="Status" name="status" value={form.status} onChange={handleChange} opts={[{ v: 'inside', l: 'Inside' }, { v: 'expected', l: 'Expected' }]} />
          <Field label="Check-in Time" name="checkin" value={form.checkin} onChange={handleChange} type="time" />
        </div>

        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-[10px] border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition">Cancel</button>
          <button onClick={submit} className="flex-1 py-3 rounded-[10px] bg-violet-700 text-white text-[13px] font-bold hover:bg-violet-800 transition">✅ Add Guest</button>
        </div>
      </div>
    </div>
  );
});

/* ── ViewGuestModal ── */
const ViewGuestModal = memo(function ViewGuestModal({ guest, onClose, onCheckout }) {
  if (!guest) return null;
  const rows = [
    ['Company', guest.company || '—'],
    ['Phone', guest.phone || '—'],
    ['Host', guest.host || '—'],
    ['Purpose', guest.purpose || '—'],
    ['Office', guest.office || '—'],
    ['ID Type', guest.idType || '—'],
    ['Room', guest.room || '—'],
    ['Visit Type', guest.type || '—'],
    ['Check-in', guest.checkin || '—'],
    ['Check-out', guest.checkout || '—'],
    ['Date', guest.date || '—'],
  ];
  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[16px] bg-white px-6 py-7 shadow-2xl sm:px-8">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={guest.name} status={guest.status} />
            <div className="min-w-0">
              <h3 className="text-[18px] font-extrabold text-[#1E1B4B] truncate">{guest.name}</h3>
              <Badge status={guest.status} />
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-slate-200 text-slate-400 hover:bg-slate-50 text-[18px] leading-none shrink-0">×</button>
        </div>

        <div className="overflow-hidden rounded-[12px] border border-slate-200 mb-5">
          {rows.map(([k, v], i) => (
            <div
              key={k}
              className={`grid grid-cols-[130px_1fr] gap-2 px-4 py-3 items-center ${i > 0 ? 'border-t border-slate-100' : ''} ${i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{k}</span>
              <span className="text-[13px] text-slate-600 text-right break-words">{v}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition">Close</button>
          {guest.status === 'inside' && (
            <button
              onClick={() => { onCheckout(guest.id); onClose(); }}
              className="flex-1 py-2.5 rounded-[10px] bg-red-600 text-white text-[13px] font-bold hover:bg-red-700 transition"
            >
              🚪 Check-out Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

/* ── GuestCard (mobile) ── */
function GuestCard({ guest, onView, onCheckout }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[14px] p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <Avatar name={guest.name} status={guest.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-[#1E1B4B] truncate">{guest.name}</div>
              <div className="text-[11px] text-slate-400">{guest.company || '—'}</div>
            </div>
            <Badge status={guest.status} />
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-[12px] text-slate-500 mb-3">
            {[['Host', guest.host], ['Purpose', guest.purpose], ['Office', guest.office], ['Check-in', guest.checkin]].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="w-14 shrink-0 text-slate-400">{k}</span>
                <span className="truncate font-medium">{v || '—'}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onView(guest)}
              className="flex-1 py-2 rounded-[8px] border border-slate-200 bg-white text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition"
            >
              View Details
            </button>
            {guest.status === 'inside' && (
              <button
                onClick={() => onCheckout(guest.id)}
                className="flex-1 py-2 rounded-[8px] bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition"
              >
                Check-out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function GuestLog() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewGuest, setViewGuest] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [guests, setGuests] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('cgms_walkins') || '[]') : [];
      return [...stored, ...MOCK_VISITORS];
    } catch {
      return MOCK_VISITORS;
    }
  });

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const handleAdd = useCallback((guest) => setGuests(p => [guest, ...p]), []);
  const handleCheckout = useCallback((id) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setGuests(p => p.map(g => g.id === id ? { ...g, status: 'checked-out', checkout: time } : g));
    setToast({ msg: 'Guest checked out successfully.', type: 'success' });
  }, []);

  const filtered = useMemo(() => guests.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !search || v.name?.toLowerCase().includes(q) || v.company?.toLowerCase().includes(q) || v.phone?.includes(q) || v.host?.toLowerCase().includes(q) || v.purpose?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    let matchDate = true;
    if (dateFilter === 'today') matchDate = v.date === TODAY_STR;
    else if (dateFilter === 'week') matchDate = WEEK_DATES.includes(v.date);
    else if (dateFilter === 'month') matchDate = v.date?.startsWith(MONTH_DATES_PREFIX);
    return matchSearch && matchStatus && matchDate;
  }), [guests, search, statusFilter, dateFilter]);

  const counts = {
    all: guests.length,
    inside: guests.filter(v => v.status === 'inside').length,
    expected: guests.filter(v => v.status === 'expected').length,
    'checked-out': guests.filter(v => v.status === 'checked-out').length,
    'no-show': guests.filter(v => v.status === 'no-show').length,
  };

  const statCards = [
    { label: 'Total', key: 'all', color: '#6D28D9' },
    { label: 'Inside Now', key: 'inside', color: '#15803D' },
    { label: 'Expected', key: 'expected', color: '#B45309' },
    { label: 'Checked Out', key: 'checked-out', color: '#6B7280' },
    { label: 'No Show', key: 'no-show', color: '#DC2626' },
  ];

  return (
    <div className="w-full min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 bg-slate-50 min-h-full">

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {deleteTarget && (
        <ConfirmModal
          message={`Are you sure you want to delete the record for ${deleteTarget.name}?`}
          onConfirm={() => { setGuests(p => p.filter(g => g.id !== deleteTarget.id)); setDeleteTarget(null); setToast({ msg: 'Record deleted.', type: 'success' }); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {showAddModal && <AddGuestModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
      {viewGuest && <ViewGuestModal guest={viewGuest} onClose={() => setViewGuest(null)} onCheckout={handleCheckout} />}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
        <div>
          <h2 className="font-[Outfit,sans-serif] text-[20px] font-extrabold text-[#1E1B4B] mb-1">Guest Log</h2>
          <p className="text-[13px] text-slate-400">{filtered.length} of {guests.length} visitors shown</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition">📥 Export CSV</button>
          <button className="px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-600 text-[12px] font-semibold hover:bg-slate-50 transition">📄 Export PDF</button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-[10px] bg-violet-700 text-white text-[12px] font-bold hover:bg-violet-800 transition"
          >
            + Add Guest
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
        {statCards.map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key === statusFilter ? 'all' : s.key)}
            className="bg-white border rounded-[12px] p-4 text-left transition hover:shadow-md"
            style={{
              borderColor: statusFilter === s.key ? s.color : '#E2E8F0',
              boxShadow: statusFilter === s.key ? `0 0 0 2px ${s.color}30` : undefined,
            }}
          >
            <div
              className="font-[Outfit,sans-serif] text-[24px] font-extrabold leading-none mb-1"
              style={{ color: statusFilter === s.key ? s.color : '#1E1B4B' }}
            >
              {counts[s.key]}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{s.label}</div>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-[12px] p-3 sm:p-4 mb-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-slate-200 px-3 py-2.5 bg-slate-50">
            <span className="text-slate-400">🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, company, phone, host..."
              className="w-full bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-300"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 text-[18px] leading-none">×</button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-10 rounded-[10px] border border-slate-200 px-3 text-[13px] text-slate-600 outline-none bg-white hover:border-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition"
            >
              <option value="all">All Status</option>
              <option value="inside">Inside</option>
              <option value="expected">Expected</option>
              <option value="checked-out">Checked Out</option>
              <option value="no-show">No Show</option>
            </select>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="h-10 rounded-[10px] border border-slate-200 px-3 text-[13px] text-slate-600 outline-none bg-white hover:border-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            {(search || statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setDateFilter('all'); }}
                className="h-10 px-3 rounded-[10px] border border-red-200 bg-red-50 text-red-600 text-[12px] font-semibold hover:bg-red-100 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-[14px] bg-white">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-slate-400 text-[14px]">No visitors match your filters.</p>
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setDateFilter('all'); }}
            className="mt-4 px-5 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold hover:bg-slate-50 transition"
          >
            Clear Filters
          </button>
        </div>
      ) : isMobile ? (
        <div className="grid gap-3">
          {filtered.map(guest => (
            <GuestCard key={guest.id} guest={guest} onView={setViewGuest} onCheckout={handleCheckout} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50">
                <tr>
                  {['Visitor', 'Company', 'Host', 'Purpose', 'Office', 'Type', 'Check-in', 'Check-out', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(guest => {
                  const sm = STATUS_META[guest.status] || STATUS_META.expected;
                  return (
                    <tr key={guest.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={guest.name} status={guest.status} />
                          <div>
                            <div className="text-[13px] font-semibold text-[#1E1B4B]">{guest.name}</div>
                            <div className="text-[11px] text-slate-400">{guest.idType || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-500 max-w-[140px] truncate">{guest.company || '—'}</td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-500 max-w-[120px] truncate">{guest.host || '—'}</td>
                      <td className="px-4 py-3.5 text-[13px] text-slate-500 max-w-[140px] truncate">{guest.purpose || '—'}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">{guest.office || '—'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${guest.type === 'walk-in' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                          {guest.type || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-emerald-600">{guest.checkin || '—'}</td>
                      <td className="px-4 py-3.5 font-mono text-[12px] text-slate-400">{guest.checkout || '—'}</td>
                      <td className="px-4 py-3.5"><Badge status={guest.status} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewGuest(guest)}
                            className="px-3 py-1.5 rounded-[8px] border border-slate-200 bg-white text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition"
                          >
                            View
                          </button>
                          {guest.status === 'inside' && (
                            <button
                              onClick={() => handleCheckout(guest.id)}
                              className="px-3 py-1.5 rounded-[8px] border border-red-200 bg-red-50 text-red-600 text-[11px] font-semibold hover:bg-red-100 transition"
                            >
                              Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}