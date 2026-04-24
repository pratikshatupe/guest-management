import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AppointmentForm from '../components/AppointmentForm';
import AppointmentTable from '../components/AppointmentTable';
import Pagination from '../components/ui/Pagination';
import { useAppointments } from '../context/AppointmentContext';
import { useRole } from '../context/RoleContext';
import { useVisibleAppointments, useVisibleStaff } from '../hooks/useVisibleData';
import { APPOINTMENT_STATUSES } from '../data/mockAppointments';

const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * UX narrowing layered on top of the role-scoped dataset:
 *   reception → today only (for check-in)
 *   service   → only appointments with a service targeted at them
 * The base dataset is already role-scoped by useVisibleAppointments.
 */
function narrowForUX(role, appointments) {
  const r = (role || '').toLowerCase();
  if (r === 'reception') return appointments.filter((a) => a.date === todayStr());
  if (r === 'service')   return appointments.filter((a) => Boolean(a.assignedService));
  return appointments;
}

function StatCard({ label, value, tone }) {
  const toneCls = {
    violet:  'border-sky-100 bg-sky-50 text-sky-700',
    amber:   'border-amber-100 bg-amber-50 text-amber-700',
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

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Delete Appointment" onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

function AppointmentDetails({ a }) {
  if (!a) return null;
  const rows = [
    ['Guest Name',     a.guestName],
    ['Contact',        a.contactNumber],
    ['Company',        a.companyName],
    ['Purpose',        a.purpose],
    ['Host',           a.host],
    ['Date',           a.date],
    ['Time',           a.time],
    ['Duration',       a.duration],
    ['Status',         a.status],
    ['Service',        a.assignedService || '—'],
    ['Notes',          a.notes || '—'],
  ];
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
          <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
          <dd className="mt-1 text-sm text-slate-700">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Appointments({ user }) {
  const {
    loading,
    metrics,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    approveAppointment,
    rejectAppointment,
    checkInAppointment,
    checkOutAppointment,
    markNoShow,
    recordGuestResponse,
  } = useAppointments();

  /* Role-scoped base dataset — Super Admin/Director see everything, Manager
     sees their office, Reception sees office + own-hosted rows, Service sees
     rows assigned to them. */
  const appointments = useVisibleAppointments();
  const staff = useVisibleStaff();

  const role = (user?.role || '').toLowerCase();

  /* RBAC matrix layered on top of the existing role-based gates. The legacy
     role rules still narrow scope (e.g. service staff can't mutate), and
     Super Admin can revoke a permission globally from the matrix. */
  const { hasPermission } = useRole();
  const canCreate = role !== 'service' && hasPermission('appointments', 'create');
  const canEdit   = role !== 'service' && hasPermission('appointments', 'edit');
  const canDelete = role !== 'service' && hasPermission('appointments', 'delete');
  /* Mutate row-level controls (check-in / check-out / no-show) follow `edit`
     since they update existing records. */
  const canMutate = role !== 'service' && (canEdit || canDelete || canCreate);
  /* Only Manager / Director / Super Admin can approve or reject — and only
     when their RBAC `edit` permission on appointments is intact. */
  const canApprove = ['manager', 'director', 'superadmin'].includes(role) && canEdit;

  const [search, setSearch]             = useState('');
  const [dateFilter, setDateFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hostFilter, setHostFilter]     = useState('all');
  const [page, setPage]                 = useState(1);
  const [perPage, setPerPage]           = useState(10);
  const [showForm, setShowForm]         = useState(false);
  const [editItem, setEditItem]         = useState(null);
  const [viewItem, setViewItem]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  const rolePruned = useMemo(
    () => narrowForUX(role, appointments),
    [role, appointments],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rolePruned.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (hostFilter !== 'all'   && a.host !== hostFilter)     return false;
      if (dateFilter && a.date !== dateFilter)                  return false;
      if (!q) return true;
      return (
        a.guestName?.toLowerCase().includes(q) ||
        a.companyName?.toLowerCase().includes(q) ||
        a.host?.toLowerCase().includes(q) ||
        a.contactNumber?.toLowerCase().includes(q) ||
        a.purpose?.toLowerCase().includes(q)
      );
    });
  }, [rolePruned, search, dateFilter, statusFilter, hostFilter]);

  /* Reset to page 1 whenever any filter narrows the result set. */
  useEffect(() => { setPage(1); }, [search, dateFilter, statusFilter, hostFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    return filtered.slice(startIndex, startIndex + perPage);
  }, [filtered, page, perPage]);

  const handleSubmit = useCallback((form) => {
    /* Re-check at the boundary so console-driven calls can't bypass the UI. */
    const isEdit = Boolean(editItem);
    if (isEdit && !hasPermission('appointments', 'edit')) return;
    if (!isEdit && !hasPermission('appointments', 'create')) return;

    setSubmitting(true);
    /* Tiny delay so the saving state is visible. */
    setTimeout(() => {
      if (editItem) {
        updateAppointment(editItem.id, form);
      } else {
        createAppointment(form);
      }
      setSubmitting(false);
      setShowForm(false);
      setEditItem(null);
    }, 200);
  }, [editItem, createAppointment, updateAppointment, hasPermission]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    if (!hasPermission('appointments', 'delete')) {
      setDeleteTarget(null);
      return;
    }
    deleteAppointment(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteAppointment, hasPermission]);

  return (
    <div className="w-full min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Appointments</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {role === 'reception'
                ? "Today's scheduled visits."
                : role === 'service'
                ? 'Appointments with services assigned to your team.'
                : 'Schedule and track visitor appointments.'}
              {metrics.upcomingSoon > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                  🔔 {metrics.upcomingSoon} upcoming in the next hour
                </span>
              )}
            </p>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => { setEditItem(null); setShowForm(true); }}
              className="rounded-lg border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              + New Appointment
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total"     value={metrics.total}     tone="violet" />
          <StatCard label="Pending"   value={metrics.pending}   tone="amber" />
          <StatCard label="Approved"  value={metrics.approved}  tone="emerald" />
          <StatCard label="Rejected"  value={metrics.rejected}  tone="red" />
          <StatCard label="Inside"    value={metrics.inside}    tone="emerald" />
          <StatCard label="Completed" value={metrics.completed} tone="slate" />
        </div>

        <AppointmentTable
          rows={paginated}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          hostFilter={hostFilter}
          onHostFilterChange={setHostFilter}
          staff={staff}
          canMutate={canMutate}
          canEdit={canEdit}
          canDelete={canDelete}
          canApprove={canApprove}
          onView={(a) => setViewItem(a)}
          onEdit={(a) => { if (!canEdit) return; setEditItem(a); setShowForm(true); }}
          onDelete={(a) => { if (!canDelete) return; setDeleteTarget(a); }}
          onCheckIn={(a) => checkInAppointment(a.id)}
          onCheckOut={(a) => checkOutAppointment(a.id)}
          onMarkNoShow={(a) => markNoShow(a.id)}
          onApprove={(a) => approveAppointment(a.id)}
          onReject={(a) => rejectAppointment(a.id)}
          onGuestResponse={(a, response) => recordGuestResponse(a.id, response)}
        />

        {filtered.length > 0 && (
          <Pagination
            page={page}
            perPage={perPage}
            total={filtered.length}
            onPageChange={setPage}
            onPerPageChange={(next) => { setPerPage(next); setPage(1); }}
            pageSizes={[5, 10, 20, 50]}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
          />
        )}
      </div>

      {showForm && (
        <Modal
          title={editItem ? 'Edit Appointment' : 'New Appointment'}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          size="lg"
        >
          <AppointmentForm
            initialValue={editItem}
            staff={staff}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        </Modal>
      )}

      {viewItem && (
        <Modal title="Appointment Details" onClose={() => setViewItem(null)} size="lg">
          <AppointmentDetails a={viewItem} />
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setViewItem(null)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmModal
          message={`Delete the appointment for ${deleteTarget.guestName}?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export { APPOINTMENT_STATUSES };
