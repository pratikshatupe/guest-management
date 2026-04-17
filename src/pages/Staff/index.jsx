import React, { useState } from 'react';
import { MOCK_STAFF } from '../../data/mockData';

// ─── Utils ────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'cgms_staff';
const safeArray  = v => (Array.isArray(v) ? v : []);
const safeText   = (v, fb = '') => v ?? fb;
const safeLower  = v => safeText(v).toString().toLowerCase();
const safeAvatar = name => {
  return (safeText(name).trim() || '').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'NA';
};
const safeRead = (key, fb) => {
  try { const r = window.localStorage.getItem(key); return r ? JSON.parse(r) ?? fb : fb; } catch { return fb; }
};
const safeWrite = (key, val) => { try { window.localStorage.setItem(key, JSON.stringify(val)); } catch {} };

// ─── Role colours ─────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  Director:      { ring: '#6D28D9', light: '#EDE9FE', text: '#5B21B6' },
  Manager:       { ring: '#0891B2', light: '#ECFEFF', text: '#0E7490' },
  Reception:     { ring: '#0284C7', light: '#E0F2FE', text: '#0369A1' },
  'Service Staff': { ring: '#D97706', light: '#FEF3C7', text: '#B45309' },
  Security:      { ring: '#7C3AED', light: '#EDE9FE', text: '#6D28D9' },
};

const ROLES = ['Director', 'Manager', 'Reception', 'Service Staff', 'Security'];

// ─── Initial data ─────────────────────────────────────────────────────────────
const initialStaff = safeArray(safeRead(STORAGE_KEY, MOCK_STAFF)).map(s => ({
  ...s,
  name:   safeText(s?.name),
  role:   safeText(s?.role, 'Reception'),
  email:  safeText(s?.email),
  phone:  safeText(s?.phone),
  office: safeText(s?.office, 'HQ'),
  dept:   safeText(s?.dept),
  status: safeText(s?.status, 'active'),
  avatar: safeText(s?.avatar, safeAvatar(s?.name)),
}));

// ─── Sub-components ───────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  return (
    <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 rounded-[10px] border px-4 py-3 text-[13px] font-semibold shadow-lg ${type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="cursor-pointer text-lg leading-none opacity-60 hover:opacity-100 transition">✕</button>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
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

const inputCls  = (err) => `w-full rounded-[10px] border ${err ? 'border-red-400' : 'border-slate-200'} bg-white px-3 py-2 text-[13px] text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400`;
const selectCls = (err) => `${inputCls(err)} cursor-pointer`;

function StaffCard({ s, onEdit, onDelete }) {
  const role  = ROLE_COLORS[s.role] || ROLE_COLORS.Reception;
  const active = safeLower(s?.status) === 'active';
  return (
    <div className="flex flex-col rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] text-[12px] font-extrabold font-['Outfit',sans-serif]"
          style={{ background: role.light, color: role.text, border: `1px solid ${role.ring}30` }}
        >
          {safeText(s?.avatar, safeAvatar(s?.name))}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[14px] font-bold text-[#1E1B4B]">{safeText(s?.name, '—')}</p>
          <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold mt-0.5" style={{ background: role.light, color: role.text }}>
            {safeText(s?.role, 'Reception')}
          </span>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="mb-3 flex flex-col gap-1.5 text-[12px] text-slate-500">
        <div className="flex gap-2 items-center"><span>📧</span><span className="break-all">{safeText(s?.email, '—')}</span></div>
        <div className="flex gap-2 items-center"><span>📞</span><span>{safeText(s?.phone, '—')}</span></div>
        <div className="flex gap-2 items-center"><span>🏢</span><span>{safeText(s?.office, 'HQ')} · {safeText(s?.dept, '—')}</span></div>
      </div>

      <div className="mt-auto flex gap-2 border-t border-slate-100 pt-3">
        <button onClick={() => onEdit(s)}   className="flex-1 cursor-pointer rounded-[8px] border border-slate-200 bg-white py-1.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50" title="Edit staff member">Edit</button>
        <button onClick={() => onDelete(s)} className="flex-1 cursor-pointer rounded-[8px] border border-red-200 bg-red-50 py-1.5 text-[12px] font-semibold text-red-600 transition hover:bg-red-100" title="Delete staff member">Delete</button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Staff() {
  const [staff, setStaff]             = useState(initialStaff);
  const [search, setSearch]           = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast]             = useState(null);
  const [errors, setErrors]           = useState({});
  const [form, setForm]               = useState({ name: '', role: 'Reception', email: '', phone: '', office: 'HQ', dept: '', status: 'active' });

  const filtered = safeArray(staff).filter(s => {
    const q = safeLower(search);
    return !q || safeLower(s?.name).includes(q) || safeLower(s?.role).includes(q);
  });

  const save = d => { setStaff(safeArray(d)); safeWrite(STORAGE_KEY, safeArray(d)); };
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const openAdd  = () => { setForm({ name: '', role: 'Reception', email: '', phone: '', office: 'HQ', dept: '', status: 'active' }); setErrors({}); setEditItem(null); setShowForm(true); };
  const openEdit = s  => { setForm({ name: safeText(s?.name), role: safeText(s?.role, 'Reception'), email: safeText(s?.email), phone: safeText(s?.phone), office: safeText(s?.office, 'HQ'), dept: safeText(s?.dept), status: safeText(s?.status, 'active') }); setErrors({}); setEditItem(s); setShowForm(true); };

  const validate = () => {
    const e = {};
    if (!safeText(form.name).trim())  e.name  = 'Full Name is required.';
    if (!safeText(form.email).trim()) e.email = 'Email ID is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid Email ID.';
    if (!safeText(form.phone).trim()) e.phone = 'Contact Number is required.';
    if (!safeText(form.dept).trim())  e.dept  = 'Department is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const avatar = safeAvatar(form.name);
    const updated = editItem
      ? safeArray(staff).map(s => s?.id === editItem?.id ? { ...s, ...form, id: s.id, avatar } : s)
      : [...safeArray(staff), { ...form, id: Date.now(), avatar }];
    save(updated);
    setShowForm(false);
    showToast(editItem ? 'Staff member updated successfully.' : 'Staff member added successfully.');
  };

  const handleDelete = () => {
    save(safeArray(staff).filter(s => s?.id !== deleteTarget?.id));
    setDeleteTarget(null);
    showToast('Staff member deleted successfully.');
  };

  const activeCount = safeArray(staff).filter(s => safeLower(s?.status) === 'active').length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {deleteTarget && (
        <ConfirmModal
          message={`Are you sure you want to delete staff member ${safeText(deleteTarget?.name)}?`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-extrabold text-[#1E1B4B] font-['Outfit',sans-serif]">Team &amp; Staff</h2>
            <p className="text-[13px] text-slate-400 mt-0.5">{activeCount} active member{activeCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openAdd} className="cursor-pointer rounded-[10px] border border-violet-700 bg-violet-700 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-violet-800">
            + Add Staff
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[13px]">🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or role…"
            className="w-full rounded-[10px] border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-[13px] text-slate-700 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600 transition text-[15px]" title="Clear search">✕</button>
          )}
        </div>

        {/* Cards grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((s, i) => <StaffCard key={s?.id ?? i} s={s} onEdit={openEdit} onDelete={setDeleteTarget} />)}
          </div>
        ) : (
          <div className="rounded-[14px] border border-slate-200 bg-white py-16 text-center text-[14px] text-slate-400 shadow-sm">
            No records found.
          </div>
        )}
      </div>

      {/* Slide-in form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-[14px] border border-slate-200 bg-white p-7 shadow-2xl">
            <h3 className="mb-5 text-[16px] font-extrabold text-[#1E1B4B] font-['Outfit',sans-serif]">
              {editItem ? 'Edit Staff Member' : 'Add Staff Member'}
            </h3>

            {[
              { label: 'Full Name',       key: 'name',   ph: 'Enter Full Name',       req: true },
              { label: 'Email ID',        key: 'email',  ph: 'Enter Email ID',         req: true },
              { label: 'Contact Number',  key: 'phone',  ph: 'Enter Contact Number',   req: true },
              { label: 'Department',      key: 'dept',   ph: 'Enter Department',       req: true },
              { label: 'Office',          key: 'office', ph: 'Enter Office',           req: false },
            ].map(f => (
              <div key={f.key} className="mb-4">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">
                  {f.label}{f.req && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <input
                  value={safeText(form[f.key])}
                  onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); if (errors[f.key]) setErrors(p => ({ ...p, [f.key]: '' })); }}
                  placeholder={f.ph}
                  className={inputCls(errors[f.key])}
                />
                {errors[f.key] && <p className="mt-1 text-[11px] text-red-500">⚠ {errors[f.key]}</p>}
              </div>
            ))}

            <div className="mb-4">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">Role<span className="text-red-500 ml-0.5">*</span></label>
              <select value={safeText(form.role, 'Reception')} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={selectCls(false)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div className="mb-6">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-slate-500">Status<span className="text-red-500 ml-0.5">*</span></label>
              <select value={safeText(form.status, 'active')} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={selectCls(false)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 cursor-pointer rounded-[10px] border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave}              className="flex-1 cursor-pointer rounded-[10px] border border-violet-700 bg-violet-700 py-2.5 text-[13px] font-bold text-white transition hover:bg-violet-800">{editItem ? 'Update' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}