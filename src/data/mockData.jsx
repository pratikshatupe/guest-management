import { useEffect } from "react";

/* ───────── LOCAL STORAGE HELPER ───────── */
export const ls = {
  get: (k, def) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; }
  },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

/* ───────── USERS — matches Login.jsx exactly ───────── */
export const MOCK_USERS = [
  { id: 'director',   email: 'director@corpgms.com',   password: '123456', name: 'Arjun Mehta',  icon: '👑', label: 'Director',      badge: 'Executive',        color: '#6D28D9' },
  { id: 'manager',    email: 'manager@corpgms.com',     password: '123456', name: 'Priya Sharma', icon: '🏢', label: 'Manager',       badge: 'Management',       color: '#059669' },
  { id: 'reception',  email: 'reception@corpgms.com',   password: '123456', name: 'Sara Khan',    icon: '🛎️', label: 'Reception',     badge: 'Front Desk',       color: '#0891B2' },
  { id: 'service',    email: 'service@corpgms.com',     password: '123456', name: 'Rahul Patil',  icon: '⚙️', label: 'Service Staff', badge: 'Operations',       color: '#D97706' },
  { id: 'superadmin', email: 'superadmin@corpgms.com',  password: '123456', name: 'Super Admin',  icon: '🛡️', label: 'Super Admin',   badge: 'Platform Control', color: '#DC2626' },
];

/* ───────── ROLES & PERMISSIONS ───────── */
export const ROLES = [
  { id: 'superadmin', name: 'Super Admin',   permissions: ['all'] },
  { id: 'director',   name: 'Director',      permissions: ['all'] },
  { id: 'manager',    name: 'Manager',       permissions: ['dashboard','guest-log','walkin','appointments','rooms','staff','services','reports','notifications'] },
  { id: 'reception',  name: 'Reception',     permissions: ['dashboard','walkin','appointments','guest-log','notifications'] },
  { id: 'service',    name: 'Service Staff', permissions: ['dashboard','services','notifications'] },
];

/* ───────── ORGANISATIONS ───────── */
export const MOCK_ORGANIZATIONS = [
  { id: 1, name: 'TechCorp Pvt Ltd',   industry: 'IT',          location: 'Mumbai',    status: 'Active',   users: 48  },
  { id: 2, name: 'Innovate Solutions', industry: 'Consulting',  location: 'Pune',      status: 'Active',   users: 32  },
  { id: 3, name: 'Emirates Group',     industry: 'Aviation',    location: 'Dubai',     status: 'Active',   users: 120 },
  { id: 4, name: 'KPMG UAE',           industry: 'Finance',     location: 'Abu Dhabi', status: 'Active',   users: 87  },
  { id: 5, name: 'McKinsey & Co',      industry: 'Consulting',  location: 'Sharjah',   status: 'Inactive', users: 15  },
];

/* ───────── OFFICES ───────── */
export const MOCK_OFFICES = [
  { id: 1, name: 'Pune HQ',       location: 'Pune, India',    org: 'TechCorp Pvt Ltd', status: 'Active' },
  { id: 2, name: 'Mumbai Branch', location: 'Mumbai, India',  org: 'TechCorp Pvt Ltd', status: 'Active' },
  { id: 3, name: 'Dubai Office',  location: 'Dubai, UAE',     org: 'Emirates Group',   status: 'Active' },
  { id: 4, name: 'Abu Dhabi HQ',  location: 'Abu Dhabi, UAE', org: 'KPMG UAE',          status: 'Active' },
];

/* ───────── SUBSCRIPTION PLANS ───────── */
export const SUBSCRIPTION_PLANS = [
  {
    id: 1, name: 'Starter', price: 29, yearlyPrice: 23,
    desc: 'Perfect for small offices getting started with visitor management.',
    offices: 1, users: 5, visitors: '500', color: '#0891B2', featured: false,
    features: [
      { label: 'Walk-in Check-in',           included: true  },
      { label: 'Appointment Scheduling',      included: true  },
      { label: 'Basic Reports',               included: true  },
      { label: 'Email Notifications',         included: true  },
      { label: 'WhatsApp Notifications',      included: false },
      { label: 'Multi-Office Management',     included: false },
      { label: 'Advanced Analytics',          included: false },
      { label: 'Priority Support',            included: false },
    ],
  },
  {
    id: 2, name: 'Professional', price: 79, yearlyPrice: 63,
    desc: 'For growing companies that need advanced features and multi-office control.',
    offices: 5, users: 25, visitors: '5000', color: '#6D28D9', featured: true,
    features: [
      { label: 'Walk-in Check-in',           included: true },
      { label: 'Appointment Scheduling',      included: true },
      { label: 'Advanced Reports',            included: true },
      { label: 'Email Notifications',         included: true },
      { label: 'WhatsApp Notifications',      included: true },
      { label: 'Multi-Office Management',     included: true },
      { label: 'Advanced Analytics',          included: true },
      { label: 'Priority Support',            included: false },
    ],
  },
  {
    id: 3, name: 'Enterprise', price: 199, yearlyPrice: 159,
    desc: 'Unlimited scale, dedicated support, and full platform control.',
    offices: 'Unlimited', users: 'Unlimited', visitors: 'Unlimited', color: '#D97706', featured: false,
    features: [
      { label: 'Walk-in Check-in',           included: true },
      { label: 'Appointment Scheduling',      included: true },
      { label: 'Advanced Reports',            included: true },
      { label: 'Email Notifications',         included: true },
      { label: 'WhatsApp Notifications',      included: true },
      { label: 'Multi-Office Management',     included: true },
      { label: 'Advanced Analytics',          included: true },
      { label: 'Priority Support',            included: true },
    ],
  },
];

/* ───────── NOTIFICATIONS ───────── */
export const NOTIFICATIONS = [
  { id: 1, title: 'Visitor Check-in',  message: 'Ravi Kapoor arrived at Reception',  time: '2 min ago',  type: 'info',    read: false },
  { id: 2, title: 'Service Completed', message: 'Tea served to Board Room A',         time: '10 min ago', type: 'success', read: false },
  { id: 3, title: 'New Appointment',   message: 'Meeting scheduled for 2:00 PM',      time: '30 min ago', type: 'warning', read: true  },
  { id: 4, title: 'Room Booking',      message: 'Conference Room 1 booked by Priya',  time: '1 hr ago',   type: 'info',    read: true  },
];

/* ───────── VISITORS ───────── */
export const MOCK_VISITORS = [
  { id: 1, name: 'Ravi Kapoor',     company: 'TechCorp',       phone: '+91 98765 43210', email: 'ravi@techcorp.com',   type: 'Appointment', status: 'inside',       checkIn: '09:15 AM', host: 'Arjun Mehta',  office: 'Pune HQ',       purpose: 'Business Meeting'       },
  { id: 2, name: 'Meera Joshi',     company: 'Innovate',       phone: '+91 98765 43211', email: 'meera@innovate.com',  type: 'Appointment', status: 'checked-out',  checkIn: '10:00 AM', checkOut: '11:30 AM', host: 'Priya Sharma', office: 'Pune HQ',       purpose: 'Consultation'           },
  { id: 3, name: 'Vikram Singh',    company: 'Freelancer',     phone: '+91 98765 43212', email: 'vikram@mail.com',     type: 'Walk-in',     status: 'inside',       checkIn: '10:30 AM', host: 'Arjun Mehta',  office: 'Mumbai Branch', purpose: 'Site Visit'             },
  { id: 4, name: 'Ahmed Al Rashid', company: 'Emirates Group', phone: '+971 50 123 4567',email: 'ahmed@emirates.com',  type: 'Appointment', status: 'expected',     checkIn: '02:00 PM', host: 'Arjun Mehta',  office: 'Dubai Office',  purpose: 'Partnership Discussion' },
  { id: 5, name: 'Sarah Johnson',   company: 'McKinsey & Co',  phone: '+971 55 987 6543',email: 'sarah@mckinsey.com',  type: 'Walk-in',     status: 'checked-out',  checkIn: '09:00 AM', checkOut: '10:45 AM', host: 'Priya Sharma', office: 'Pune HQ',       purpose: 'Product Demo'           },
];

/* ───────── ROOMS ───────── */
export const MOCK_ROOMS = [
  { id: 1, name: 'Board Room A',      capacity: 12, status: 'occupied',    floor: '3rd Floor', amenities: ['Projector','Whiteboard','Video Conf'] },
  { id: 2, name: 'Conference Room 1', capacity: 8,  status: 'available',   floor: '2nd Floor', amenities: ['Projector','Whiteboard'] },
  { id: 3, name: 'Board Room B',      capacity: 10, status: 'available',   floor: '3rd Floor', amenities: ['Projector','Video Conf'] },
  { id: 4, name: 'Meeting Room 1',    capacity: 4,  status: 'occupied',    floor: '1st Floor', amenities: ['TV Screen'] },
  { id: 5, name: 'Meeting Room 2',    capacity: 4,  status: 'available',   floor: '1st Floor', amenities: ['TV Screen'] },
  { id: 6, name: 'Training Hall',     capacity: 30, status: 'maintenance', floor: '4th Floor', amenities: ['Projector','PA System'] },
  { id: 7, name: 'Cabin 1',           capacity: 2,  status: 'available',   floor: '2nd Floor', amenities: [] },
  { id: 8, name: 'Cabin 2',           capacity: 2,  status: 'occupied',    floor: '2nd Floor', amenities: [] },
];

/* ───────── STAFF ───────── */
export const MOCK_STAFF = [
  { id: 1, name: 'Arjun Mehta',  role: 'Director',      email: 'director@corpgms.com',   phone: '+91 98001 11111', status: 'active',   office: 'Pune HQ'       },
  { id: 2, name: 'Priya Sharma', role: 'Manager',       email: 'manager@corpgms.com',    phone: '+91 98001 22222', status: 'active',   office: 'Pune HQ'       },
  { id: 3, name: 'Sara Khan',    role: 'Reception',     email: 'reception@corpgms.com',  phone: '+91 98001 33333', status: 'active',   office: 'Mumbai Branch' },
  { id: 4, name: 'Rahul Patil',  role: 'Service Staff', email: 'service@corpgms.com',    phone: '+91 98001 44444', status: 'active',   office: 'Pune HQ'       },
  { id: 5, name: 'Deepa Nair',   role: 'Reception',     email: 'deepa@corpgms.com',      phone: '+91 98001 55555', status: 'inactive', office: 'Dubai Office'  },
];

/* ───────── APPOINTMENTS ───────── */
export const MOCK_APPOINTMENTS = [
  { id: 1, visitorName: 'Ravi Kapoor',     company: 'TechCorp',       host: 'Arjun Mehta',  date: '16/04/2026', time: '10:00 AM', status: 'confirmed', room: 'Board Room A',      purpose: 'Business Meeting',       phone: '+91 98765 43210'  },
  { id: 2, visitorName: 'Ahmed Al Rashid', company: 'Emirates Group', host: 'Priya Sharma', date: '16/04/2026', time: '02:00 PM', status: 'confirmed', room: 'Conference Room 1', purpose: 'Partnership Discussion', phone: '+971 50 123 4567' },
  { id: 3, visitorName: 'Fatima Al Zaabi', company: 'ADNOC',          host: 'Arjun Mehta',  date: '17/04/2026', time: '11:00 AM', status: 'pending',   room: 'Board Room B',      purpose: 'Consultation',           phone: '+971 55 111 2222' },
  { id: 4, visitorName: 'James Fletcher',  company: 'KPMG UAE',       host: 'Priya Sharma', date: '17/04/2026', time: '03:00 PM', status: 'cancelled', room: 'Meeting Room 1',    purpose: 'Product Demo',           phone: '+971 52 333 4444' },
  { id: 5, visitorName: 'Meera Joshi',     company: 'Innovate',       host: 'Arjun Mehta',  date: '18/04/2026', time: '09:30 AM', status: 'confirmed', room: 'Conference Room 1', purpose: 'Interview',              phone: '+91 98765 43211'  },
];

/* ───────── WALK-INS ───────── */
export const MOCK_WALKINS = [
  { id: 1, name: 'Vikram Singh', company: 'Freelancer',   phone: '+91 98765 43212', purpose: 'Meeting',   checkIn: '10:30 AM', status: 'inside',      host: 'Arjun Mehta',  badge: 'W-001' },
  { id: 2, name: 'Neha Gupta',   company: 'Startup Co',   phone: '+91 97654 32109', purpose: 'Interview', checkIn: '11:00 AM', status: 'inside',      host: 'Priya Sharma', badge: 'W-002' },
  { id: 3, name: 'Suresh Nair',  company: 'Self',         phone: '+91 96543 21098', purpose: 'Delivery',  checkIn: '09:45 AM', status: 'checked-out', host: 'Sara Khan',    badge: 'W-003' },
  { id: 4, name: 'Anita Desai',  company: 'BizSolutions', phone: '+91 95432 10987', purpose: 'Site Visit',checkIn: '08:30 AM', status: 'checked-out', host: 'Arjun Mehta',  badge: 'W-004' },
];

/* ───────── SERVICES ───────── */
export const MOCK_SERVICES = [
  { id: 1, title: 'Tea & Coffee',      type: 'Pantry',    visitorName: 'Ravi Kapoor',     location: 'Board Room A',      status: 'Completed',   assignedTo: 'Rahul Patil', time: '09:30 AM' },
  { id: 2, title: 'Parking Slot',      type: 'Logistics', visitorName: 'Ahmed Al Rashid', location: 'B2 Parking',        status: 'In Progress', assignedTo: 'Rahul Patil', time: '10:00 AM' },
  { id: 3, title: 'Projector Setup',   type: 'Facility',  visitorName: 'Meera Joshi',     location: 'Conference Room 1', status: 'Pending',     assignedTo: 'Rahul Patil', time: '11:00 AM' },
  { id: 4, title: 'Lunch Arrangement', type: 'Pantry',    visitorName: 'Fatima Al Zaabi', location: 'Cafeteria',         status: 'Pending',     assignedTo: 'Rahul Patil', time: '01:00 PM' },
  { id: 5, title: 'AV Equipment',      type: 'Facility',  visitorName: 'James Fletcher',  location: 'Board Room B',      status: 'Completed',   assignedTo: 'Rahul Patil', time: '02:30 PM' },
];

/* ───────── CHART DATA ───────── */
export const VISITOR_CHART_DATA = [
  { day: 'Mon', visitors: 32 },
  { day: 'Tue', visitors: 45 },
  { day: 'Wed', visitors: 28 },
  { day: 'Thu', visitors: 56 },
  { day: 'Fri', visitors: 63 },
  { day: 'Sat', visitors: 18 },
  { day: 'Sun', visitors: 9  },
];

export const MONTHLY_DATA = [
  { month: 'Jan', guests: 320 },
  { month: 'Feb', guests: 410 },
  { month: 'Mar', guests: 390 },
  { month: 'Apr', guests: 520 },
  { month: 'May', guests: 480 },
  { month: 'Jun', guests: 610 },
  { month: 'Jul', guests: 540 },
  { month: 'Aug', guests: 590 },
  { month: 'Sep', guests: 670 },
  { month: 'Oct', guests: 720 },
  { month: 'Nov', guests: 690 },
  { month: 'Dec', guests: 780 },
];

export const OFFICE_CHART_DATA = [
  { name: 'Pune HQ',       visitors: 210 },
  { name: 'Mumbai Branch', visitors: 145 },
  { name: 'Dubai Office',  visitors: 190 },
  { name: 'Abu Dhabi HQ',  visitors: 98  },
];

/* ───────── CONSTANTS ───────── */
export const SERVICE_TYPES      = ['Tea','Coffee','Water','Lunch','Parking','Projector Setup','AV Equipment','Wi-Fi Access'];
export const SERVICE_CATEGORIES = ['Pantry','Logistics','Facility','Security'];
export const VISITOR_TYPES      = ['Walk-in','Appointment','Vendor','Delivery','Contractor'];
export const PURPOSES           = ['Business Meeting','Product Demo','Consultation','Interview','Partnership Discussion','Site Visit','Delivery','Other'];

export const STATUS_COLORS = {
  Pending:        { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  'In Progress':  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  Completed:      { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  confirmed:      { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  pending:        { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  cancelled:      { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  inside:         { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  'checked-out':  { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
  expected:       { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  available:      { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  occupied:       { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  maintenance:    { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A' },
  active:         { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  inactive:       { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
  waiting:        { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
};

/* ───────── SHARED UI COMPONENTS ───────── */

export function Badge({ status }) {
  const key   = status?.toLowerCase?.() ?? '';
  const found = STATUS_COLORS[key] || STATUS_COLORS[status] || { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: found.bg, color: found.text, border: `1px solid ${found.border}`,
      display: 'inline-block', textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
}

export function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  const C = { success: '#059669', error: '#DC2626', info: '#0891B2', warning: '#D97706' };
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#1E1B4B', color: '#fff', padding: '12px 20px',
      borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 28px rgba(0,0,0,0.25)', minWidth: 260,
      borderLeft: `4px solid ${C[type] || C.success}`,
      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', color:'#9B99C4', cursor:'pointer', fontSize:18, lineHeight:1 }}>×</button>
    </div>
  );
}

export function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(20,15,55,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:9999, backdropFilter:'blur(6px)' }}>
      <div style={{ background:'#fff', padding:'28px 32px', borderRadius:16, maxWidth:400, width:'90%', boxShadow:'0 24px 60px rgba(109,40,217,0.18)', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        <div style={{ fontSize:36, marginBottom:16, textAlign:'center' }}>🗑️</div>
        <h3 style={{ fontSize:16, fontWeight:800, color:'#1E1B4B', marginBottom:10, textAlign:'center' }}>Confirm Delete</h3>
        <p style={{ fontSize:13, color:'#4C4A7A', textAlign:'center', lineHeight:1.7, marginBottom:24 }}>{message}</p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel}  style={{ flex:1, padding:'10px', borderRadius:10, border:'1px solid #E8E4FF', background:'#F5F3FF', color:'#6D28D9', cursor:'pointer', fontWeight:600, fontSize:13, fontFamily:'inherit' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'10px', borderRadius:10, border:'none', background:'#DC2626', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}