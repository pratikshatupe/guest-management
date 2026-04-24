import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MOCK_APPOINTMENTS, STAFF_LIST } from '../data/mockAppointments';
import { MOCK_SERVICES, SERVICE_TYPES } from '../data/mockServices';
import { MOCK_ROOMS, MOCK_BOOKINGS } from '../data/mockRooms';
import { authorizeTransition } from '../utils/servicePermissions';
import { notifyVia, sendEmail } from '../utils/messaging';
import { getUserOrgId } from '../utils/visibilityFilters';
import { hasPermission, PermissionError } from '../utils/defaultPermissions';
import { useNotifications } from './NotificationContext';
import { useLog } from './LogContext';
import { useAuth } from './AuthContext';

/* ─── Contact resolution (stub) ─────────────────────────────────────
   STAFF_LIST only carries name/role; real contact details will come
   from the backend. For now we synthesize plausible placeholders so
   the messaging stub's console/log output is readable. */
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

const hostEmailFor  = (name) => (name ? `${slugify(name)}@company.example` : '');
const guestEmailFor = (name, company) =>
  name
    ? `${slugify(name)}@${slugify(company) || 'guest'}.example`
    : '';

/* ─── Automatic reminders ─────────────────────────────────────────── */
const REMINDER_WINDOWS = [
  { id: '24h', minutes: 24 * 60, label: '24 hours' },
  { id: '1h',  minutes: 60,      label: '1 hour' },
];
const REMINDER_SENT_KEY = 'cgms.appointmentReminders.sent.v1';

function loadSentReminders() {
  try {
    const raw = localStorage.getItem(REMINDER_SENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveSentReminders(set) {
  try {
    localStorage.setItem(REMINDER_SENT_KEY, JSON.stringify([...set]));
  } catch {
    /* non-fatal */
  }
}

/**
 * Single source of truth for the Appointments / Guest Log / Dashboard cluster.
 * Any page inside <AppointmentProvider> stays in sync automatically.
 */

const AppointmentContext = createContext(null);

function makeId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const nowIso = () => new Date().toISOString();

export function AppointmentProvider({ children, initial = MOCK_APPOINTMENTS }) {
  const [appointments, setAppointments] = useState(initial);
  /* Seed the guest log from any appointment that starts as `Inside`, so the
     "currently inside" count is accurate on first load. */
  const [guestLog, setGuestLog] = useState(() =>
    (initial || [])
      .filter((a) => a.status === 'Inside')
      .map((a) => ({
        id: makeId('gl'),
        appointmentId: a.id,
        guestName: a.guestName,
        company: a.companyName,
        contactNumber: a.contactNumber,
        host: a.host,
        purpose: a.purpose,
        type: 'Appointment',
        checkInTime: nowIso(),
        checkOutTime: null,
        status: 'Inside',
      })),
  );
  const [services, setServices] = useState(MOCK_SERVICES);
  const [rooms, setRooms] = useState(MOCK_ROOMS);
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Persistent notification log (separate from transient toasts). */
  const { addNotification } = useNotifications();
  /* Audit trail — every state-changing action is recorded. */
  const { addLog } = useLog();
  /* Used to stamp orgId onto every new record so multi-tenant isolation
     is enforced at write-time as well as read-time. Tracked via a ref so
     mutation callbacks don't re-create each time the user changes. Falls
     back to 'org-1' for legacy/anonymous callers (e.g. before login). */
  const { user } = useAuth();
  const orgIdRef = useRef(getUserOrgId(user) || 'org-1');
  useEffect(() => {
    orgIdRef.current = getUserOrgId(user) || 'org-1';
  }, [user]);
  const resolveOrgId = useCallback(() => orgIdRef.current, []);

  /* Seed a short "loading" so the UI can show the spinner at least once. */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  /* ─── Reminder loop ────────────────────────────────────────────────
     Every 60s, walk Pending + Approved appointments and fire reminders
     for windows we have not yet sent. Dedupe via localStorage so the
     same appointment/window pair is never notified twice in this tab. */
  useEffect(() => {
    const runCheck = () => {
      const now = Date.now();
      const sent = loadSentReminders();
      let changed = false;
      appointments.forEach((apt) => {
        if (!['Pending', 'Approved'].includes(apt.status)) return;
        if (!apt.date || !apt.time) return;
        const whenTs = new Date(`${apt.date}T${apt.time}`).getTime();
        if (!Number.isFinite(whenTs) || whenTs <= now) return;
        const minutesUntil = (whenTs - now) / 60_000;
        REMINDER_WINDOWS.forEach((w) => {
          if (minutesUntil > w.minutes) return;
          const key = `${apt.id}:${w.id}`;
          if (sent.has(key)) return;
          sent.add(key);
          changed = true;
          const when = `${apt.date} at ${apt.time}`;
          /* Guest: email + WhatsApp (when a phone number is available). */
          notifyVia(['email', 'whatsapp'], {
            to:      apt.contactNumber || guestEmailFor(apt.guestName, apt.companyName),
            subject: `Reminder: your appointment in ${w.label}`,
            message: `Hi ${apt.guestName}, this is a reminder about your appointment with ${apt.host} on ${when}. Please bring a valid ID${apt.documentRequirements?.length ? ` and: ${apt.documentRequirements.join(', ')}` : ''}.`,
            meta:    { appointmentId: apt.id, kind: 'reminder', window: w.id },
          });
          /* Host: email only. */
          sendEmail({
            to:      hostEmailFor(apt.host),
            subject: `Reminder: ${apt.guestName} visiting in ${w.label}`,
            message: `${apt.guestName} (${apt.companyName || 'N/A'}) is scheduled to visit you on ${when}. Purpose: ${apt.purpose || '—'}.`,
            meta:    { appointmentId: apt.id, kind: 'reminder', window: w.id },
          });
          addLog({
            action:   'Reminder Sent',
            module:   'Appointments',
            metadata: { guestName: apt.guestName, window: w.label },
          });
        });
      });
      if (changed) saveSentReminders(sent);
    };
    runCheck();
    const id = setInterval(runCheck, 60_000);
    return () => clearInterval(id);
  }, [appointments, addLog]);

  /* ─── Notifications ───────────────────────────────────────────── */
  const notify = useCallback((message, type = 'success') => {
    const id = makeId('toast');
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ─── RBAC guard ──────────────────────────────────────────────────
     Final line of defence: even if the UI button was not hidden and even
     if localStorage was tampered with, every write action below is gated
     here. Fails loudly (toast + PermissionError) so the caller never gets
     a silent partial mutation. */
  const guard = useCallback((moduleKey, action) => {
    const role = (user?.role || '').toString();
    const orgId = user?.organisationId || user?.orgId || null;
    if (hasPermission(role, moduleKey, action, { orgId })) return true;
    notify(`Permission denied: your role cannot ${action} on ${moduleKey}.`, 'error');
    throw new PermissionError(moduleKey, action, role || 'anonymous');
  }, [user, notify]);

  /* ─── CRUD ────────────────────────────────────────────────────── */
  const createAppointment = useCallback((form) => {
    guard('appointments', 'create');
    /* New appointments wait for Manager/Director approval before check-in. */
    const next = {
      id: makeId('apt'),
      status: 'Pending',
      ...form,
      orgId: form.orgId || resolveOrgId(),
    };
    setAppointments((prev) => [...prev, next]);
    notify('Appointment created — waiting for approval.', 'success');
    addNotification({
      message: `New appointment for ${next.guestName} — awaiting approval.`,
      type: 'appointment',
    });
    addLog({
      action:   'Appointment Created',
      module:   'Appointments',
      metadata: { guestName: next.guestName, date: next.date, time: next.time, orgId: next.orgId },
    });
    /* Stub: confirmation to guest (email + WhatsApp) and host (email). */
    const when = `${next.date} ${next.time}`;
    notifyVia(['email', 'whatsapp'], {
      to:      next.contactNumber || guestEmailFor(next.guestName, next.companyName),
      subject: 'Appointment request received',
      message: `Hi ${next.guestName}, we've received your appointment request with ${next.host} on ${when}. You'll hear back once it's approved.`,
      meta:    { appointmentId: next.id, kind: 'appointment-created' },
    });
    sendEmail({
      to:      hostEmailFor(next.host),
      subject: `New appointment request: ${next.guestName}`,
      message: `${next.guestName} (${next.companyName || 'N/A'}) requested an appointment on ${when}. Purpose: ${next.purpose || '—'}.`,
      meta:    { appointmentId: next.id, kind: 'appointment-created' },
    });
    return next;
  }, [guard, notify, addNotification, addLog]);

  /* ─── Approval workflow ──────────────────────────────────────── */
  const approveAppointment = useCallback((id) => {
    guard('appointments', 'edit');
    setAppointments((prev) => {
      const apt = prev.find((a) => a.id === id);
      if (!apt || apt.status !== 'Pending') return prev;
      addNotification({
        message: `Appointment approved: ${apt.guestName}.`,
        type: 'appointment',
      });
      addLog({
        action:   'Appointment Approved',
        module:   'Appointments',
        metadata: { guestName: apt.guestName },
      });
      /* Stub: confirmation to guest. */
      const when = `${apt.date} ${apt.time}`;
      notifyVia(['email', 'whatsapp'], {
        to:      apt.contactNumber || guestEmailFor(apt.guestName, apt.companyName),
        subject: 'Your appointment is confirmed',
        message: `Hi ${apt.guestName}, your appointment with ${apt.host} on ${when} has been confirmed. Please bring a valid ID.`,
        meta:    { appointmentId: apt.id, kind: 'appointment-approved' },
      });
      return prev.map((a) => (a.id === id ? { ...a, status: 'Approved' } : a));
    });
    notify('Appointment approved successfully', 'success');
  }, [guard, notify, addNotification, addLog]);

  const rejectAppointment = useCallback((id) => {
    guard('appointments', 'edit');
    setAppointments((prev) => {
      const apt = prev.find((a) => a.id === id);
      if (!apt || apt.status !== 'Pending') return prev;
      addNotification({
        message: `Appointment rejected: ${apt.guestName}.`,
        type: 'appointment',
      });
      addLog({
        action:   'Appointment Rejected',
        module:   'Appointments',
        metadata: { guestName: apt.guestName },
      });
      return prev.map((a) => (a.id === id ? { ...a, status: 'Rejected' } : a));
    });
    notify('Appointment rejected', 'warn');
  }, [guard, notify, addNotification, addLog]);

  const updateAppointment = useCallback((id, patch) => {
    guard('appointments', 'edit');
    setAppointments((prev) => {
      const apt = prev.find((a) => a.id === id);
      if (apt) {
        addLog({
          action:   'Appointment Updated',
          module:   'Appointments',
          metadata: { guestName: apt.guestName },
        });
      }
      return prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
    });
    notify('Appointment updated successfully.', 'success');
  }, [guard, notify, addLog]);

  const deleteAppointment = useCallback((id) => {
    guard('appointments', 'delete');
    setAppointments((prev) => {
      const apt = prev.find((a) => a.id === id);
      if (apt) {
        addLog({
          action:   'Appointment Deleted',
          module:   'Appointments',
          metadata: { guestName: apt.guestName },
        });
      }
      return prev.filter((a) => a.id !== id);
    });
    setGuestLog((prev) => prev.filter((g) => g.appointmentId !== id));
    notify('Appointment deleted.', 'success');
  }, [guard, notify, addLog]);

  /* ─── Status transitions ─────────────────────────────────────── */
  const checkInAppointment = useCallback((id) => {
    guard('appointments', 'edit');
    setAppointments((prev) => {
      const apt = prev.find((a) => a.id === id);
      if (!apt) return prev;
      /* Guard: only Approved appointments may check in. */
      if (apt.status !== 'Approved') {
        if (apt.status === 'Pending') {
          notify('Cannot check in: appointment is still pending approval.', 'error');
        } else if (apt.status === 'Rejected') {
          notify('Cannot check in: appointment was rejected.', 'error');
        } else if (apt.status === 'Inside') {
          /* Already inside — no-op, no toast. */
        } else {
          notify(`Cannot check in: appointment is ${apt.status}.`, 'error');
        }
        return prev;
      }
      /* Add a matching Guest Log entry in the same tick. */
      const logEntry = {
        id: makeId('gl'),
        appointmentId: apt.id,
        guestName: apt.guestName,
        company: apt.companyName,
        contactNumber: apt.contactNumber,
        host: apt.host,
        purpose: apt.purpose,
        type: 'Appointment',
        checkInTime: nowIso(),
        checkOutTime: null,
        status: 'Inside',
        orgId: apt.orgId || resolveOrgId(),
      };
      setGuestLog((log) => {
        /* Guard against duplicate check-ins for the same appointment. */
        const hasOpen = log.some((g) => g.appointmentId === id && !g.checkOutTime);
        return hasOpen ? log : [...log, logEntry];
      });
      notify(`${apt.guestName} checked in.`, 'info');
      addNotification({
        message: `Visitor checked in: ${apt.guestName}.`,
        type: 'check-in',
      });
      addLog({
        action:   'Visitor Check-in',
        module:   'Guest Log',
        metadata: { guestName: apt.guestName, type: 'Appointment' },
      });
      sendEmail({
        to:      hostEmailFor(apt.host),
        subject: `Your visitor has arrived: ${apt.guestName}`,
        message: `${apt.guestName} (${apt.companyName || 'N/A'}) just checked in at reception.`,
        meta:    { appointmentId: apt.id, kind: 'visitor-checked-in' },
      });
      return prev.map((a) => (a.id === id ? { ...a, status: 'Inside' } : a));
    });
  }, [guard, notify, addNotification, addLog]);

  const checkOutAppointment = useCallback((id) => {
    guard('guest-log', 'edit');
    setAppointments((prev) => {
      const apt = prev.find((a) => a.id === id);
      if (!apt || apt.status === 'Completed') return prev;
      setGuestLog((log) =>
        log.map((g) =>
          g.appointmentId === id && !g.checkOutTime
            ? { ...g, checkOutTime: nowIso(), status: 'Checked Out' }
            : g,
        ),
      );
      notify(`${apt.guestName} checked out.`, 'success');
      addLog({
        action:   'Visitor Check-out',
        module:   'Guest Log',
        metadata: { guestName: apt.guestName, type: 'Appointment' },
      });
      sendEmail({
        to:      hostEmailFor(apt.host),
        subject: `Visitor checked out: ${apt.guestName}`,
        message: `${apt.guestName} has left the premises. Visit is now closed.`,
        meta:    { appointmentId: apt.id, kind: 'visitor-checked-out' },
      });
      return prev.map((a) => (a.id === id ? { ...a, status: 'Completed' } : a));
    });
  }, [guard, notify, addLog]);

  /* ─── Walk-in: direct check-in (no appointment) ──────────────── */
  const walkInCheckIn = useCallback((form) => {
    guard('walkin', 'create');
    const entry = {
      id: makeId('gl'),
      appointmentId: null,
      guestName:     form.guestName,
      company:       form.companyName,
      contactNumber: form.contactNumber,
      host:          form.host,
      purpose:       form.purpose,
      idType:        form.idType || '',
      idNumber:      form.idNumber || '',
      photoDataUrl:  form.photoDataUrl || '',
      type:          'Walk-in',
      checkInTime:   nowIso(),
      checkOutTime:  null,
      status:        'Inside',
      orgId:         form.orgId || resolveOrgId(),
    };
    setGuestLog((prev) => [...prev, entry]);
    notify('Walk-in visitor checked in successfully.', 'success');
    addNotification({
      message: `Walk-in checked in: ${entry.guestName}.`,
      type: 'check-in',
    });
    addLog({
      action:   'Walk-in Check-in',
      module:   'Walk-in',
      metadata: { guestName: entry.guestName, host: entry.host, purpose: entry.purpose },
    });
    sendEmail({
      to:      hostEmailFor(entry.host),
      subject: `Walk-in visitor for you: ${entry.guestName}`,
      message: `${entry.guestName} (${entry.company || 'N/A'}) has walked in and is waiting at reception. Purpose: ${entry.purpose || '—'}.`,
      meta:    { guestLogId: entry.id, kind: 'walk-in' },
    });
    return entry;
  }, [guard, notify, addNotification, addLog]);

  /* ─── Generic check-out by guest-log id (works for walk-ins *and*
     linked appointments). Updates the appointment side when linked. */
  const checkOutVisitor = useCallback((guestLogId) => {
    guard('guest-log', 'edit');
    let entry;
    setGuestLog((prev) => {
      entry = prev.find((g) => g.id === guestLogId);
      if (!entry || entry.checkOutTime) return prev;
      return prev.map((g) =>
        g.id === guestLogId
          ? { ...g, checkOutTime: nowIso(), status: 'Checked Out' }
          : g,
      );
    });
    if (entry && !entry.checkOutTime) {
      if (entry.appointmentId) {
        setAppointments((apts) =>
          apts.map((a) =>
            a.id === entry.appointmentId ? { ...a, status: 'Completed' } : a,
          ),
        );
      }
      notify(`${entry.guestName} checked out.`, 'success');
      addLog({
        action:   'Visitor Check-out',
        module:   'Guest Log',
        metadata: { guestName: entry.guestName, type: entry.type },
      });
    }
  }, [guard, notify, addLog]);

  /* ─── Guest RSVP ─────────────────────────────────────────────────
     Records the guest's own accept/decline decision. In a future build
     this will be driven by a token-link the guest clicks in their email;
     for now, reception/manager can record it from the appointment UI. */
  const recordGuestResponse = useCallback((id, response) => {
    if (!['Accepted', 'Declined', 'Awaiting'].includes(response)) return;
    guard('appointments', 'edit');
    setAppointments((prev) => {
      const apt = prev.find((a) => a.id === id);
      if (!apt) return prev;
      if (apt.guestResponse === response) return prev;
      notify(`Guest response recorded: ${response}.`, response === 'Declined' ? 'warn' : 'success');
      addNotification({
        message: `${apt.guestName} ${response.toLowerCase()} the appointment.`,
        type: 'appointment',
      });
      addLog({
        action:   'Guest Response Recorded',
        module:   'Appointments',
        metadata: { guestName: apt.guestName, response },
      });
      /* Stub: confirmation to host so they see the RSVP arrive. */
      sendEmail({
        to:      hostEmailFor(apt.host),
        subject: `Guest ${response.toLowerCase()}: ${apt.guestName}`,
        message: `${apt.guestName} has ${response.toLowerCase()} the appointment scheduled for ${apt.date} ${apt.time}.`,
        meta:    { appointmentId: apt.id, kind: 'guest-response', response },
      });
      return prev.map((a) =>
        a.id === id
          ? { ...a, guestResponse: response, guestResponseAt: nowIso() }
          : a,
      );
    });
  }, [guard, notify, addNotification, addLog]);

  const markNoShow = useCallback((id) => {
    guard('appointments', 'edit');
    setAppointments((prev) => {
      const apt = prev.find((a) => a.id === id);
      if (!apt) return prev;
      notify(`Marked ${apt.guestName} as No-show.`, 'warn');
      addLog({
        action:   'Marked No-show',
        module:   'Appointments',
        metadata: { guestName: apt.guestName },
      });
      return prev.map((a) => (a.id === id ? { ...a, status: 'No-show' } : a));
    });
  }, [guard, notify, addLog]);

  /* ─── Services ───────────────────────────────────────────────── */
  const createService = useCallback((form) => {
    guard('services', 'create');
    /* Guard: the visitor must be on-site. */
    const visitor = form.visitorLogId
      ? guestLog.find((g) => g.id === form.visitorLogId)
      : null;
    if (!visitor || visitor.status !== 'Inside') {
      notify('Cannot create service: visitor is not checked in.', 'error');
      return null;
    }
    const staff = STAFF_LIST.find((s) => s.id === form.assignedStaffId);
    if (!staff) {
      notify('Cannot create service: please select a valid staff member.', 'error');
      return null;
    }
    if ((staff.role || '').toLowerCase() !== 'service staff') {
      notify('Services can only be assigned to Service Staff.', 'error');
      return null;
    }
    const next = {
      id:              makeId('svc'),
      visitorName:     visitor.guestName,
      visitorLogId:    visitor.id,
      serviceType:     form.serviceType,
      assignedStaffId: staff.id,
      assignedStaff:   staff.name,
      assignedTo:      staff.name, /* alias for consumers that read this name */
      notes:           (form.notes || '').trim(),
      status:          'Pending',
      createdAt:       nowIso(),
      /* Inherit from the visitor's org when available so the service stays
         tenant-isolated even if the actor is Super Admin. */
      orgId:           visitor.orgId || form.orgId || resolveOrgId(),
    };
    setServices((prev) => [...prev, next]);
    notify('Service request created successfully.', 'success');
    addNotification({
      message: `New service request: ${next.serviceType} for ${next.visitorName}.`,
      type: 'service',
      staffId: next.assignedStaffId,
    });
    addLog({
      action:   'Service Created',
      module:   'Services',
      metadata: {
        visitorName:   next.visitorName,
        serviceType:   next.serviceType,
        assignedStaff: next.assignedStaff,
      },
    });
    return next;
  }, [guard, guestLog, notify, addNotification, addLog]);

  /**
   * `actor` is `{ actorStaffId, actorRole }`. Only assignees (or Director/
   * Manager with services `edit`) may transition a service — Super Admin is
   * no longer a special case because they have no access to Services at
   * all per spec. The check mirrors `canStartService` / `canCompleteService`
   * from the permissions helper, so UI hiding and context enforcement stay
   * in sync.
   */
  const startService = useCallback((id, actor = {}) => {
    guard('services', 'edit');
    setServices((prev) => {
      const svc = prev.find((s) => s.id === id);
      if (!svc) return prev;
      if (!authorizeTransition(actor, svc)) {
        notify('You are not permitted to start this service.', 'error');
        return prev;
      }
      if (svc.status !== 'Pending') {
        notify(
          svc.status === 'In Progress'
            ? 'This service is already in progress.'
            : 'Only pending services can be started.',
          'error',
        );
        return prev;
      }
      notify('Service started', 'info');
      addNotification({
        message: `Service started: ${svc.serviceType} for ${svc.visitorName}.`,
        type: 'service',
        staffId: svc.assignedStaffId,
      });
      addLog({
        action:   'Service Started',
        module:   'Services',
        metadata: {
          visitorName:   svc.visitorName,
          serviceType:   svc.serviceType,
          assignedStaff: svc.assignedStaff,
        },
      });
      return prev.map((s) =>
        s.id === id ? { ...s, status: 'In Progress', startedAt: nowIso() } : s,
      );
    });
  }, [guard, notify, addNotification, addLog]);

  const completeService = useCallback((id, actor = {}) => {
    guard('services', 'edit');
    setServices((prev) => {
      const svc = prev.find((s) => s.id === id);
      if (!svc) return prev;
      if (!authorizeTransition(actor, svc)) {
        notify('You are not permitted to complete this service.', 'error');
        return prev;
      }
      if (svc.status !== 'In Progress') {
        notify(
          svc.status === 'Pending'
            ? 'Start the service before completing it.'
            : 'This service is already completed.',
          'error',
        );
        return prev;
      }
      notify('Service completed', 'success');
      addNotification({
        message: `Service completed: ${svc.serviceType} for ${svc.visitorName}.`,
        type: 'service',
        staffId: svc.assignedStaffId,
      });
      addLog({
        action:   'Service Completed',
        module:   'Services',
        metadata: {
          visitorName:   svc.visitorName,
          serviceType:   svc.serviceType,
          assignedStaff: svc.assignedStaff,
        },
      });
      return prev.map((s) =>
        s.id === id ? { ...s, status: 'Completed', completedAt: nowIso() } : s,
      );
    });
  }, [guard, notify, addNotification, addLog]);

  /**
   * Editable fields: serviceType, assignedStaffId, notes. Visitor is fixed
   * once the request is raised. Status cannot be changed via this path —
   * use startService / completeService for transitions.
   */
  const updateService = useCallback((id, patch) => {
    guard('services', 'edit');
    const next = {};
    if (typeof patch.serviceType === 'string') next.serviceType = patch.serviceType;
    if (typeof patch.notes === 'string')       next.notes       = patch.notes.trim();
    if (typeof patch.assignedStaffId === 'string') {
      const staff = STAFF_LIST.find((s) => s.id === patch.assignedStaffId);
      if (!staff) {
        notify('Cannot update service: please select a valid staff member.', 'error');
        return;
      }
      if ((staff.role || '').toLowerCase() !== 'service staff') {
        notify('Services can only be assigned to Service Staff.', 'error');
        return;
      }
      next.assignedStaffId = staff.id;
      next.assignedStaff   = staff.name;
      next.assignedTo      = staff.name;
    }
    if (Object.keys(next).length === 0) return;
    setServices((prev) => {
      const svc = prev.find((s) => s.id === id);
      if (svc) {
        addLog({
          action:   'Service Updated',
          module:   'Services',
          metadata: {
            visitorName: svc.visitorName,
            serviceType: next.serviceType || svc.serviceType,
          },
        });
      }
      return prev.map((s) => (s.id === id ? { ...s, ...next } : s));
    });
    notify('Service updated successfully.', 'success');
  }, [guard, notify, addLog]);

  const deleteService = useCallback((id) => {
    guard('services', 'delete');
    setServices((prev) => {
      const svc = prev.find((s) => s.id === id);
      if (svc) {
        addLog({
          action:   'Service Deleted',
          module:   'Services',
          metadata: { visitorName: svc.visitorName, serviceType: svc.serviceType },
        });
      }
      return prev.filter((s) => s.id !== id);
    });
    notify('Service removed.', 'success');
  }, [guard, notify, addLog]);

  /* ─── Rooms & Bookings ──────────────────────────────────────── */

  /** Compare two 24h times lexicographically — works because HH:mm sorts correctly. */
  const rangesOverlap = (aStart, aEnd, bStart, bEnd) =>
    aStart < bEnd && bStart < aEnd;

  /** Walk active bookings for the same room/date and reject on any overlap. */
  const findConflict = useCallback((draft, skipId = null) => {
    return bookings.find((b) =>
      b.id !== skipId &&
      b.status !== 'Cancelled' &&
      b.roomId === draft.roomId &&
      b.date === draft.date &&
      rangesOverlap(draft.startTime, draft.endTime, b.startTime, b.endTime),
    ) || null;
  }, [bookings]);

  const createBooking = useCallback((form) => {
    guard('rooms', 'create');
    const room = rooms.find((r) => r.id === form.roomId);
    if (!room) {
      notify('Select a valid room.', 'error');
      return null;
    }
    if ((room.status || '').toLowerCase() === 'under maintenance') {
      notify('This room is under maintenance.', 'error');
      return null;
    }
    if (!form.date || !form.startTime || !form.endTime) {
      notify('Please fill date and time.', 'error');
      return null;
    }
    if (form.startTime >= form.endTime) {
      notify('End time must be later than start time.', 'error');
      return null;
    }
    if (!(form.bookedBy || '').trim()) {
      notify('Please enter who the booking is for.', 'error');
      return null;
    }
    const draft = {
      roomId:    room.id,
      roomName:  room.name,
      date:      form.date,
      startTime: form.startTime,
      endTime:   form.endTime,
    };
    const clash = findConflict(draft);
    if (clash) {
      notify(
        `Double booking: ${room.name} is already reserved ${clash.startTime}–${clash.endTime} on ${clash.date}.`,
        'error',
      );
      return null;
    }
    const next = {
      id: makeId('bk'),
      ...draft,
      bookedBy:      form.bookedBy.trim(),
      purpose:       (form.purpose || '').trim(),
      appointmentId: form.appointmentId || null,
      status:        'Confirmed',
      createdAt:     nowIso(),
      /* Bookings inherit the room's org so they can never escape its tenant. */
      orgId:         room.orgId || resolveOrgId(),
    };
    setBookings((prev) => [next, ...prev]);
    notify(`Booking confirmed: ${room.name} on ${next.date}.`, 'success');
    addNotification({
      message: `Room booked: ${room.name} on ${next.date} at ${next.startTime} for ${next.bookedBy}.`,
      type: 'appointment',
    });
    addLog({
      action:   'Room Booking Created',
      module:   'Rooms',
      metadata: {
        room:      room.name,
        date:      next.date,
        time:      `${next.startTime}–${next.endTime}`,
        bookedBy:  next.bookedBy,
      },
    });
    return next;
  }, [guard, rooms, findConflict, notify, addNotification, addLog]);

  const cancelBooking = useCallback((id) => {
    guard('rooms', 'edit');
    setBookings((prev) => {
      const bk = prev.find((b) => b.id === id);
      if (!bk || bk.status === 'Cancelled') return prev;
      addLog({
        action:   'Room Booking Cancelled',
        module:   'Rooms',
        metadata: { room: bk.roomName, date: bk.date, bookedBy: bk.bookedBy },
      });
      notify(`Booking cancelled: ${bk.roomName} on ${bk.date}.`, 'warn');
      return prev.map((b) => (b.id === id ? { ...b, status: 'Cancelled' } : b));
    });
  }, [guard, notify, addLog]);

  const deleteBooking = useCallback((id) => {
    guard('rooms', 'delete');
    setBookings((prev) => {
      const bk = prev.find((b) => b.id === id);
      if (bk) {
        addLog({
          action:   'Room Booking Deleted',
          module:   'Rooms',
          metadata: { room: bk.roomName, date: bk.date, bookedBy: bk.bookedBy },
        });
      }
      return prev.filter((b) => b.id !== id);
    });
    notify('Booking removed.', 'success');
  }, [guard, notify, addLog]);

  const updateRoomStatus = useCallback((id, status) => {
    guard('rooms', 'edit');
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    notify('Room status updated.', 'success');
    addLog({
      action:   'Room Status Updated',
      module:   'Rooms',
      metadata: { roomId: id, status },
    });
  }, [guard, notify, addLog]);

  /* ─── Derived metrics ────────────────────────────────────────── */
  const metrics = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const upcomingSoon = appointments.filter((a) => {
      if (!['Pending', 'Approved'].includes(a.status) || !a.date || !a.time) return false;
      const when = new Date(`${a.date}T${a.time}`).getTime();
      const diffMin = (when - now) / 60_000;
      return diffMin >= 0 && diffMin <= 60;
    });
    return {
      total:        appointments.length,
      pending:      appointments.filter((a) => a.status === 'Pending').length,
      approved:     appointments.filter((a) => a.status === 'Approved').length,
      rejected:     appointments.filter((a) => a.status === 'Rejected').length,
      /* Count everyone physically inside — includes walk-ins. */
      inside:       guestLog.filter((g) => g.status === 'Inside').length,
      completed:    appointments.filter((a) => a.status === 'Completed').length,
      noShow:       appointments.filter((a) => a.status === 'No-show').length,
      todayCount:   appointments.filter((a) => a.date === today).length,
      upcomingSoon: upcomingSoon.length,
      walkIns:      guestLog.filter((g) => g.type === 'Walk-in').length,
      services: {
        total:       services.length,
        pending:     services.filter((s) => s.status === 'Pending').length,
        inProgress:  services.filter((s) => s.status === 'In Progress').length,
        completed:   services.filter((s) => s.status === 'Completed').length,
      },
      rooms: {
        total:          rooms.length,
        available:      rooms.filter((r) => r.status === 'Available').length,
        maintenance:    rooms.filter((r) => r.status === 'Under Maintenance').length,
      },
      bookings: {
        total:       bookings.length,
        today:       bookings.filter((b) => b.date === today && b.status !== 'Cancelled').length,
        upcoming:    bookings.filter((b) => b.date > today && b.status !== 'Cancelled').length,
        cancelled:   bookings.filter((b) => b.status === 'Cancelled').length,
      },
    };
  }, [appointments, guestLog, services, rooms, bookings]);

  const value = useMemo(() => ({
    appointments,
    guestLog,
    services,
    serviceTypes: SERVICE_TYPES,
    staff: STAFF_LIST,
    toasts,
    loading,
    metrics,
    notify,
    dismissToast,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    approveAppointment,
    rejectAppointment,
    checkInAppointment,
    checkOutAppointment,
    markNoShow,
    recordGuestResponse,
    walkInCheckIn,
    checkOutVisitor,
    createService,
    updateService,
    startService,
    completeService,
    deleteService,
    rooms,
    bookings,
    createBooking,
    cancelBooking,
    deleteBooking,
    updateRoomStatus,
    findConflict,
  }), [
    appointments,
    guestLog,
    services,
    toasts,
    loading,
    metrics,
    notify,
    dismissToast,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    approveAppointment,
    rejectAppointment,
    checkInAppointment,
    checkOutAppointment,
    markNoShow,
    recordGuestResponse,
    walkInCheckIn,
    checkOutVisitor,
    createService,
    updateService,
    startService,
    completeService,
    deleteService,
    rooms,
    bookings,
    createBooking,
    cancelBooking,
    deleteBooking,
    updateRoomStatus,
    findConflict,
  ]);

  return (
    <AppointmentContext.Provider value={value}>
      {children}
    </AppointmentContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentContext);
  if (!ctx) {
    throw new Error('useAppointments must be used inside <AppointmentProvider>');
  }
  return ctx;
}

/* Toast host — drop once near the top of your app to render notifications. */
export function ToastHost() {
  const { toasts, dismissToast } = useAppointments();
  if (!toasts.length) return null;
  const tone = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info:    'border-blue-200 bg-blue-50 text-blue-700',
    warn:    'border-amber-200 bg-amber-50 text-amber-700',
    error:   'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div className="fixed right-4 top-4 z-[10000] flex flex-col gap-2">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className={`max-w-sm rounded-lg border px-4 py-3 text-left text-sm shadow-lg ${tone[t.type] || tone.success}`}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
