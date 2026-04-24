import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ServiceForm from '../components/ServiceForm';
import ServiceTable from '../components/ServiceTable';
import Pagination from '../components/ui/Pagination';
import { useAppointments } from '../context/AppointmentContext';
import { useRole } from '../context/RoleContext';
import { useVisibleServices } from '../hooks/useVisibleData';
import {
  canCreateService,
  canEditService,
  canDeleteService,
  canStartService,
  canCompleteService,
  isServiceStaff,
} from '../utils/servicePermissions';

function StatCard({ label, value, tone }) {
  const toneCls = {
    violet:  'border-sky-100 bg-sky-50 text-sky-700',
    amber:   'border-amber-100 bg-amber-50 text-amber-700',
    blue:    'border-blue-100 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
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

/* Permission logic lives in src/utils/servicePermissions.js. */

export default function Services({ user }) {
  const {
    guestLog,
    staff,
    serviceTypes,
    loading,
    createService,
    updateService,
    startService,
    completeService,
    deleteService,
  } = useAppointments();

  /* Role-scoped dataset — Super Admin/Director: all, Manager/Reception: their
     office, Service Staff: only rows assigned to them. */
  const services = useVisibleServices();

  /* Resolve the logged-in user to a staff record so we can gate per-row
     actions. MOCK_USERS and STAFF_LIST share display names, so we map by name.
     If your real backend provides `user.staffId`, prefer that. */
  const currentStaffId = useMemo(() => {
    if (!user) return null;
    if (user.staffId) return user.staffId;
    const match = staff.find(
      (s) => s.name?.toLowerCase() === (user.name || '').toLowerCase(),
    );
    return match ? match.id : null;
  }, [user, staff]);

  /* Only Service Staff are eligible for new service assignments. */
  const serviceStaff = useMemo(
    () => staff.filter((s) => (s.role || '').toLowerCase() === 'service staff'),
    [staff],
  );

  /* Stats must reflect the viewer's scope, not the platform total. Using
     `metrics.services.*` from context would leak cross-tenant counts to a
     Service Staff user. Compute locally from the already-scoped dataset. */
  const scopedStats = useMemo(() => ({
    total:       services.length,
    pending:     services.filter((s) => s.status === 'Pending').length,
    inProgress:  services.filter((s) => s.status === 'In Progress').length,
    completed:   services.filter((s) => s.status === 'Completed').length,
  }), [services]);

  /* RBAC matrix layered on top of the existing role-aware predicates.
     A user gets to perform an action only when BOTH gates allow it — the
     legacy per-row logic is preserved while Super Admin can still revoke
     a permission globally from the Roles & Permissions matrix. */
  const { hasPermission } = useRole();
  const permissions = useMemo(() => ({
    canCreate: canCreateService(user) && hasPermission('services', 'create'),
    canEdit:   canEditService(user)   && hasPermission('services', 'edit'),
    canDelete: canDeleteService(user) && hasPermission('services', 'delete'),
  }), [user, hasPermission]);

  const canStartRow    = useCallback((svc) => canStartService(user, svc, currentStaffId),    [user, currentStaffId]);
  const canCompleteRow = useCallback((svc) => canCompleteService(user, svc, currentStaffId), [user, currentStaffId]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* Visitors who are currently on-site — feeds the form's visitor dropdown. */
  const insideVisitors = useMemo(
    () => guestLog.filter((g) => g.status === 'Inside'),
    [guestLog],
  );

  /* `services` is already role-scoped via useVisibleServices(). Keeping this
     alias so downstream filter stages (search/status) stay unchanged. */
  const roleFilteredServices = services;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = roleFilteredServices.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.visitorName?.toLowerCase().includes(q) ||
        s.serviceType?.toLowerCase().includes(q) ||
        s.assignedStaff?.toLowerCase().includes(q) ||
        s.notes?.toLowerCase().includes(q)
      );
    });
    /* Sort: latest completed first; otherwise by createdAt descending. */
    return matches.slice().sort((a, b) => {
      const aKey = a.completedAt || a.createdAt || '';
      const bKey = b.completedAt || b.createdAt || '';
      return bKey.localeCompare(aKey);
    });
  }, [roleFilteredServices, search, statusFilter]);

  /* Reset to page 1 when the filtered set changes (search / status / user). */
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  /* Clamp the page if the total shrinks below the current page. */
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    return filtered.slice(startIndex, startIndex + perPage);
  }, [filtered, page, perPage]);

  const handleCreate = useCallback((form) => {
    if (!hasPermission('services', 'create')) return;
    setSubmitting(true);
    setTimeout(() => {
      const created = createService(form);
      setSubmitting(false);
      if (created) setShowForm(false);
    }, 200);
  }, [createService, hasPermission]);

  const handleEditSubmit = useCallback((form) => {
    if (!editItem) return;
    if (!hasPermission('services', 'edit')) return;
    setSubmitting(true);
    setTimeout(() => {
      updateService(editItem.id, {
        serviceType:     form.serviceType,
        assignedStaffId: form.assignedStaffId,
        notes:           form.notes,
      });
      setSubmitting(false);
      setEditItem(null);
    }, 200);
  }, [editItem, updateService, hasPermission]);

  const handleDelete = useCallback((s) => {
    if (!hasPermission('services', 'delete')) return;
    deleteService(s.id);
  }, [deleteService, hasPermission]);

  return (
    <div className="w-full min-w-0 min-h-screen overflow-x-hidden bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="w-full space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">
              {isServiceStaff(user) ? 'My Tasks' : 'Services & Facilities'}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {isServiceStaff(user)
                ? 'Service requests assigned to you. Update status as you work through them.'
                : 'Hospitality, logistics, and facility requests for visitors on-site.'}
            </p>
          </div>
          {permissions.canCreate && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              + New Service Request
            </button>
          )}
        </div>

        {/* Stats — scoped to what this user can see. For Service Staff,
            `Total` is their assigned count, not the platform total. */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label={isServiceStaff(user) ? 'My Tasks' : 'Total'}
            value={scopedStats.total}
            tone="violet"
          />
          <StatCard label="Pending"     value={scopedStats.pending}    tone="amber" />
          <StatCard label="In Progress" value={scopedStats.inProgress} tone="blue" />
          <StatCard label="Completed"   value={scopedStats.completed}  tone="emerald" />
        </div>

        <ServiceTable
          rows={paginated}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          canStartRow={canStartRow}
          canCompleteRow={canCompleteRow}
          canEdit={permissions.canEdit}
          canDelete={permissions.canDelete}
          largeActions={isServiceStaff(user)}
          onStart={(s) => startService(s.id, { actorStaffId: currentStaffId, actorRole: user?.role })}
          onComplete={(s) => completeService(s.id, { actorStaffId: currentStaffId, actorRole: user?.role })}
          onEdit={(s) => permissions.canEdit && setEditItem(s)}
          onDelete={handleDelete}
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
        <Modal title="New Service Request" onClose={() => setShowForm(false)} size="lg">
          <ServiceForm
            insideVisitors={insideVisitors}
            serviceTypes={serviceTypes}
            staff={serviceStaff}
            submitting={submitting}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {editItem && (
        <Modal title="Edit Service Request" onClose={() => setEditItem(null)} size="lg">
          <ServiceForm
            initialValue={editItem}
            insideVisitors={insideVisitors}
            serviceTypes={serviceTypes}
            staff={serviceStaff}
            submitting={submitting}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditItem(null)}
          />
        </Modal>
      )}
    </div>
  );
}
