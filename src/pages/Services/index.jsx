import React, { useMemo, useState, useEffect } from 'react';
import { MOCK_SERVICES, MOCK_STAFF, MOCK_WALKINS, MOCK_APPOINTMENTS } from '../../data/mockData';

// ─── localStorage util ────────────────────────────────────────────────────────
const STORAGE_KEY = 'cgms_services';
const ls = {
  get(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
};

// ─── Config ───────────────────────────────────────────────────────────────────
const SERVICE_TYPES      = ['Tea', 'Coffee', 'Water', 'Snacks', 'Other'];
const SERVICE_CATEGORIES = ['Pantry', 'Parking', 'AV Setup', 'Logistics'];
const STATUS_OPTIONS     = ['Pending', 'In Progress', 'Completed'];

const STATUS_STYLE = {
  Pending:      'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress':'bg-blue-50 text-blue-600 border-blue-200',
  Completed:    'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const CATEGORY_ICON = { Pantry: '☕', Parking: '🅿️', 'AV Setup': '📽️', Logistics: '📦' };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = err =>
  `w-full rounded-[10px] border ${err ? 'border-red-400' : 'border-slate-200'} bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400`;
const selectCls = err => `${inputCls(err)} cursor-pointer`;

// ─── Sub-components ───────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  return (
    <div className={`fixed top-4 right-4 z-[10000] flex items-center gap-3 rounded-[10px] border px-4 py-3 text-[13px] font-semibold shadow-lg ${type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="cursor-pointer text-lg leading-none opacity-60 hover:opacity-100 transition">×</button>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[14px] border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 className="mb-2 text-[16px] font-extrabold text-[#1E1B4B] font-['Outfit',sans-serif]">Confirm Delete</h3>
        <p className="mb-5 text-[13px] text-slate-500 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}  className="flex-1 cursor-pointer rounded-[10px] border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 cursor-pointer rounded-[10px] border border-red-500 bg-red-500 py-2.5 text-[13px] font-bold text-white transition hover:bg-red-600">Delete</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, req, err, children }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
        {label}{req && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {err && <p className="mt-1 text-[11px] text-red-500">⚠ {err}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Services() {
  const [services, setServices]       = useState(() => ls.get(STORAGE_KEY, MOCK_SERVICES || []));
  const [search, setSearch]           = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]             = useState(null);
  const [errors, setErrors]           = useState({});
  const [page, setPage]               = useState(1);
  const [perPage, setPerPage]         = useState(10);

  const staff       = useMemo(() => ls.get('cgms_staff', MOCK_STAFF || []).filter(s => s.status === 'active'), []);
  const walkins     = useMemo(() => ls.get('cgms_walkins', MOCK_WALKINS || []), []);
  const appointments= useMemo(() => ls.get('cgms_appointments', MOCK_APPOINTMENTS || []), []);

  const allVisitors = [
    ...walkins.map(w => ({ name: w.name, type: 'Walk-in' })),
    ...appointments.map(a => ({ name: a.visitorName, type: 'Appointment' })),
  ];

  const emptyForm = { visitorName: '', visitType: 'Walk-in', serviceType: 'Tea', category: 'Pantry', assignedStaff: '', status: 'Pending', date: '', time: '', description: '' };
  const [form, setForm] = useState(emptyForm);

  const save = d => { ls.set(STORAGE_KEY, d); setServices(d); };
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const openAdd  = () => { setForm(emptyForm); setErrors({}); setEditItem(null); setShowForm(true); };
  const openEdit = s => { setForm({ visitorName: s.visitorName || '', visitType: s.visitType || 'Walk-in', serviceType: s.serviceType || 'Tea', category: s.category || 'Pantry', assignedStaff: s.assignedStaff || '', status: s.status || 'Pending', date: s.date || '', time: s.time || '', description: s.description || '' }); setErrors({}); setEditItem(s); setShowForm(true); };

  const validate = () => {
    const e = {};
    if (!form.visitorName)    e.visitorName    = 'Visitor Name is required.';
    if (!form.assignedStaff)  e.assignedStaff  = 'Assigned Staff is required.';
    if (!form.date)           e.date           = 'Request Date is required.';
    if (!form.time)           e.time           = 'Request Time is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const updated = editItem
      ? services.map(s => s.id === editItem.id ? { ...form, id: s.id } : s)
      : [...services, { ...form, id: Date.now() }];
    save(updated);
    setShowForm(false);
    showToast(editItem ? 'Service request updated successfully.' : 'Service request added successfully.');
  };

  const filtered = services.filter(s => {
    const q = search.toLowerCase();
    return !q || (s.visitorName || '').toLowerCase().includes(q) || (s.serviceType || '').toLowerCase().includes(q) || (s.assignedStaff || '').toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const stats = [
    { label: 'Total',       val: services.length,                                    color: 'text-violet-700', bg: 'border-violet-100 bg-violet-50' },
    { label: 'Pending',     val: services.filter(s => s.status === 'Pending').length,      color: 'text-amber-600',  bg: 'border-amber-100 bg-amber-50' },
    { label: 'In Progress', val: services.filter(s => s.status === 'In Progress').length,  color: 'text-blue-600',   bg: 'border-blue-100 bg-blue-50' },
    { label: 'Completed',   val: services.filter(s => s.status === 'Completed').length,    color: 'text-emerald-600', bg: 'border-emerald-100 bg-emerald-50' },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {deleteTarget && (
        <ConfirmModal
          message={`Are you sure you want to delete service request for ${deleteTarget.visitorName}?`}
          onConfirm={() => { save(services.filter(s => s.id !== deleteTarget.id)); setDeleteTarget(null); showToast('Service request deleted successfully.'); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-extrabold text-[#1E1B4B] font-['Outfit',sans-serif]">Services &amp; Facilities</h2>
            <p className="text-[13px] text-slate-400 mt-0.5">{services.filter(s => s.status === 'Pending').length} pending request{services.filter(s => s.status === 'Pending').length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openAdd} className="cursor-pointer rounded-[10px] border border-violet-700 bg-violet-700 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-violet-800">
            + New Request
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className={`rounded-[14px] border ${s.bg} p-4 shadow-sm`}>
              <p className={`text-[28px] font-black ${s.color} font-['Outfit',sans-serif]`}>{s.val}</p>
              <p className="text-[12px] font-semibold text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">🔍</span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by visitor, service type or staff…"
            className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-[13px] text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 transition text-[15px]" title="Clear search">✕</button>
          )}
        </div>

        {/* Table card */}
        <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['SR. No.', 'Visitor Name', 'Visit Type', 'Service Type', 'Category', 'Assigned Staff', 'Status', 'Date', 'Time', 'Actions'].map(h => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((s, i) => (
                  <tr key={s.id} className="border-b border-slate-50 transition hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-400">{(page - 1) * perPage + i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-[#1E1B4B] whitespace-nowrap">{s.visitorName}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${s.visitType === 'Walk-in' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>
                        {s.visitType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{CATEGORY_ICON[s.category] || ''} {s.serviceType}</td>
                    <td className="px-4 py-3 text-slate-600">{s.category}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{s.assignedStaff}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[s.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.date}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.time}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)}   className="cursor-pointer rounded-[7px] border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50" title="Edit request">Edit</button>
                        <button onClick={() => setDeleteTarget(s)} className="cursor-pointer rounded-[7px] border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-100" title="Delete request">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={10} className="py-16 text-center text-[14px] text-slate-400">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <span>Show:</span>
              {[10, 20, 50, 100].map(n => (
                <button key={n} onClick={() => { setPerPage(n); setPage(1); }}
                  className={`cursor-pointer rounded-[7px] border px-2.5 py-1 text-[12px] font-semibold transition ${perPage === n ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[12px] text-slate-500">
              <span>Page {page} of {totalPages} · {filtered.length} records</span>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="cursor-pointer rounded-[7px] border border-slate-200 bg-white px-2.5 py-1 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">←</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="cursor-pointer rounded-[7px] border border-slate-200 bg-white px-2.5 py-1 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">→</button>
            </div>
          </div>
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[540px] max-h-[92vh] overflow-y-auto rounded-[14px] border border-slate-200 bg-white p-7 shadow-2xl">
            <h3 className="mb-5 text-[16px] font-extrabold text-[#1E1B4B] font-['Outfit',sans-serif]">
              {editItem ? 'Edit Service Request' : 'New Service Request'}
            </h3>

            <Field label="Visitor Name" req err={errors.visitorName}>
              <select
                value={form.visitorName}
                onChange={e => { const v = allVisitors.find(x => x.name === e.target.value); setForm(p => ({ ...p, visitorName: e.target.value, visitType: v?.type || 'Walk-in' })); if (errors.visitorName) setErrors(p => ({ ...p, visitorName: '' })); }}
                className={selectCls(errors.visitorName)}
              >
                <option value="">Select Visitor</option>
                {allVisitors.map((v, i) => <option key={i} value={v.name}>{v.name} ({v.type})</option>)}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-x-4">
              <Field label="Service Type" req>
                <select value={form.serviceType} onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))} className={selectCls(false)}>
                  {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Service Category" req>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={selectCls(false)}>
                  {SERVICE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Assigned Staff" req err={errors.assignedStaff}>
                <select value={form.assignedStaff} onChange={e => { setForm(p => ({ ...p, assignedStaff: e.target.value })); if (errors.assignedStaff) setErrors(p => ({ ...p, assignedStaff: '' })); }} className={selectCls(errors.assignedStaff)}>
                  <option value="">Select Staff</option>
                  {staff.map(s => <option key={s.id} value={s.name}>{s.name} — {s.role}</option>)}
                </select>
              </Field>
              <Field label="Status" req>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={selectCls(false)}>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Request Date" req err={errors.date}>
                <input type="date" value={form.date} onChange={e => { setForm(p => ({ ...p, date: e.target.value })); if (errors.date) setErrors(p => ({ ...p, date: '' })); }} className={inputCls(errors.date)} />
              </Field>
              <Field label="Request Time" req err={errors.time}>
                <input type="time" value={form.time} onChange={e => { setForm(p => ({ ...p, time: e.target.value })); if (errors.time) setErrors(p => ({ ...p, time: '' })); }} className={inputCls(errors.time)} />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value.slice(0, 200) }))}
                placeholder="Enter description (max 200 characters)"
                rows={3}
                className={`${inputCls(false)} resize-y`}
                style={{ maxHeight: 120 }}
              />
              <p className="mt-1 text-right text-[10px] text-slate-400">{(form.description || '').length}/200</p>
            </Field>

            <div className="flex gap-3 mt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 cursor-pointer rounded-[10px] border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave}               className="flex-1 cursor-pointer rounded-[10px] border border-violet-700 bg-violet-700 py-2.5 text-[13px] font-bold text-white transition hover:bg-violet-800">{editItem ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}