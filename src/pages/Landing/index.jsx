import React, { useState, useEffect, useRef } from 'react';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';

/* ─── Intersection Observer hook ─── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, dir = 'up', style: extraStyle = {} }) {
  const [ref, v] = useInView();
  const fromMap = { up: 'translateY(28px)', left: 'translateX(-28px)', right: 'translateX(28px)', scale: 'scale(0.94)' };
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0,
      transform: v ? 'none' : (fromMap[dir] || 'translateY(28px)'),
      transition: `opacity 0.65s ${delay}s cubic-bezier(.22,1,.36,1), transform 0.65s ${delay}s cubic-bezier(.22,1,.36,1)`,
      ...extraStyle,
    }}>{children}</div>
  );
}

/* ─── Animated counter ─── */
function Counter({ val, suffix = '' }) {
  const [cur, setCur] = useState(0);
  const [ref, v] = useInView(0.3);
  useEffect(() => {
    if (!v) return;
    const target = parseFloat(val);
    const dur = 1800, step = 16;
    const inc = target / (dur / step);
    let c = 0;
    const t = setInterval(() => { c = Math.min(c + inc, target); setCur(c); if (c >= target) clearInterval(t); }, step);
    return () => clearInterval(t);
  }, [v, val]);
  const isInt = Number.isInteger(parseFloat(val));
  return <span ref={ref}>{isInt ? Math.round(cur).toLocaleString() : cur.toFixed(1)}{suffix}</span>;
}

/* ─── Book Appointment Modal ─── */
function BookModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    date: '', time: '', purpose: '', message: '',
  });
  const [errs, setErrs] = useState({});
  const [done, setDone] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full Name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid Email ID is required.';
    if (!form.phone.trim()) e.phone = 'Contact Number is required.';
    if (!form.date) e.date = 'Preferred Date is required.';
    if (!form.time) e.time = 'Preferred Time is required.';
    if (!form.purpose) e.purpose = 'Purpose of Visit is required.';
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    onSubmit({ ...form, id: Date.now(), submittedAt: new Date().toLocaleString(), status: 'New' });
    setDone(true);
  };

  const Field = ({ label, name, type = 'text', opts }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '11px', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {opts ? (
        <select
          value={form[name]}
          onChange={e => { setForm(p => ({ ...p, [name]: e.target.value })); setErrs(p => ({ ...p, [name]: undefined })); }}
          style={{
            padding: '10px 13px', borderRadius: '10px', fontSize: '13px', outline: 'none',
            border: `1.5px solid ${errs[name] ? '#EF4444' : '#E8E4FF'}`,
            background: '#fff', color: '#1E1B4B', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'border-color 0.2s', width: '100%',
          }}
        >
          <option value=''>Select…</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={e => { setForm(p => ({ ...p, [name]: e.target.value })); setErrs(p => ({ ...p, [name]: undefined })); }}
          placeholder={type === 'date' ? 'DD/MM/YYYY' : type === 'time' ? 'HH:MM' : `Enter ${label.replace(' *','').replace(' (Optional)','')}`}
          style={{
            padding: '10px 13px', borderRadius: '10px', fontSize: '13px', outline: 'none',
            border: `1.5px solid ${errs[name] ? '#EF4444' : '#E8E4FF'}`,
            background: '#fff', color: '#1E1B4B', width: '100%', boxSizing: 'border-box',
            fontFamily: 'inherit', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#7C3AED'}
          onBlur={e => e.target.style.borderColor = errs[name] ? '#EF4444' : '#E8E4FF'}
        />
      )}
      {errs[name] && <span style={{ fontSize: '11px', color: '#EF4444' }}>{errs[name]}</span>}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(20,15,55,0.65)', backdropFilter: 'blur(10px)' }} />
      <div style={{
        position: 'relative', zIndex: 10, width: '100%', maxWidth: '580px',
        maxHeight: '92vh', overflowY: 'auto', background: '#fff',
        border: '1px solid #E8E4FF', borderRadius: '22px', padding: '32px',
        boxShadow: '0 40px 90px rgba(109,40,217,0.18)',
      }}>
        {!done ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 14px rgba(109,40,217,0.3)' }}>📅</div>
                <div>
                  <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '18px', fontWeight: 800, color: '#1E1B4B', margin: 0 }}>Book an Appointment</h2>
                  <p style={{ fontSize: '12px', color: '#9B99C4', margin: 0 }}>We'll confirm your slot within 24 hours.</p>
                </div>
              </div>
              <button onClick={onClose} style={{ width: '34px', height: '34px', borderRadius: '9px', border: '1px solid #E8E4FF', background: '#F5F3FF', color: '#9B99C4', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <Field label='Full Name *' name='name' />
              <Field label='Email ID *' name='email' type='email' />
              <Field label='Contact Number *' name='phone' />
              <Field label='Company / Organisation (Optional)' name='company' />
              <Field label='Preferred Date *' name='date' type='date' />
              <Field label='Preferred Time *' name='time' type='time' />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Field label='Purpose of Visit *' name='purpose' opts={['Business Meeting', 'Product Demo', 'Consultation', 'Interview', 'Partnership Discussion', 'Site Visit', 'Other']} />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '5px' }}>Additional Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder='Anything specific we should know…'
                maxLength={500}
                style={{ width: '100%', padding: '10px 13px', borderRadius: '10px', border: '1.5px solid #E8E4FF', fontSize: '13px', outline: 'none', minHeight: '80px', maxHeight: '140px', resize: 'vertical', fontFamily: 'inherit', color: '#1E1B4B', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#E8E4FF'}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={onClose} style={{ padding: '12px 22px', borderRadius: '11px', border: '1px solid #E8E4FF', background: '#F5F3FF', color: '#6D28D9', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={submit} style={{ flex: 1, minWidth: '180px', padding: '12px 22px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'Outfit,sans-serif', boxShadow: '0 5px 18px rgba(109,40,217,0.35)' }}>
                📅 Submit Appointment Request
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '44px 20px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px', boxShadow: '0 8px 28px rgba(109,40,217,0.3)' }}>✓</div>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '22px', fontWeight: 800, color: '#1E1B4B', marginBottom: '10px' }}>Appointment Requested!</h2>
            <p style={{ fontSize: '14px', color: '#9B99C4', marginBottom: '32px', maxWidth: '280px', margin: '0 auto 32px', lineHeight: 1.7 }}>Your request has been submitted successfully. Our team will confirm your slot shortly.</p>
            <button onClick={onClose} style={{ padding: '13px 32px', borderRadius: '11px', border: 'none', background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 700, fontFamily: 'Outfit,sans-serif' }}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function Landing({ onEnterApp }) {
  const [yearly, setYearly] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [bookings, setBookings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cgms_bookings') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const handleBook = (data) => {
    const updated = [data, ...bookings];
    setBookings(updated);
    try { localStorage.setItem('cgms_bookings', JSON.stringify(updated)); } catch {}
  };

  const modules = [
    { icon: '📊', title: 'Live Dashboard', desc: 'Real-time visitor stats, room occupancy, service alerts, and quick actions the moment you log in.', color: '#6D28D9', tag: 'Core' },
    { icon: '📋', title: 'Guest Log', desc: 'Complete visitor history with smart filters by type, date, and office. Export to Excel or PDF.', color: '#059669', tag: 'Records' },
    { icon: '🚶', title: 'Walk-in Check-in', desc: 'Instant registration with live photo capture, ID verification, badge printing, host notification.', color: '#D97706', tag: 'Front Desk' },
    { icon: '📅', title: 'Appointments', desc: 'Pre-schedule visits with host assignment, document requirements, confirmations and auto-reminders.', color: '#7C3AED', tag: 'Scheduling' },
    { icon: '🏢', title: 'Venues & Rooms', desc: 'Manage boardrooms, conference rooms, and cabins with live availability calendar and utilisation reports.', color: '#0891B2', tag: 'Facilities' },
    { icon: '👥', title: 'Team & Staff', desc: 'Role-based access for Directors, Managers, Service Staff, and Reception — module-level permissions.', color: '#DC2626', tag: 'HR' },
    { icon: '⚙️', title: 'Services & Facilities', desc: 'Pantry, parking, AV setup, logistics — all linked to visits, assigned to staff, fully trackable.', color: '#0891B2', tag: 'Operations' },
    { icon: '🌐', title: 'Multi-Office', desc: 'Manage Dubai, Abu Dhabi, Sharjah and any number of locations from one central dashboard.', color: '#D97706', tag: 'Enterprise' },
    { icon: '🔔', title: 'Smart Notifications', desc: 'Email & WhatsApp alerts for check-ins, appointments, and service requests. Customisable templates.', color: '#059669', tag: 'Comms' },
    { icon: '📈', title: 'Reports & Analytics', desc: 'Visitor trends, peak hours, office comparisons, duration tracking — export Excel, CSV, or PDF.', color: '#7C3AED', tag: 'Insights' },
    { icon: '🛡️', title: 'Security & Access', desc: 'Encrypted visitor data, full audit trails, role-based access, ID document verification, HTTPS.', color: '#6D28D9', tag: 'Security' },
    { icon: '👑', title: 'Super Admin Panel', desc: 'Global platform control — all organisations, subscriptions, billing, users, and system health.', color: '#D97706', tag: 'Admin' },
  ];

  const stats = [
    { val: '500', suffix: '+', label: 'Companies Trust Us' },
    { val: '2000000', suffix: '+', label: 'Visitors Managed' },
    { val: '99.9', suffix: '%', label: 'Uptime SLA' },
    { val: '4.9', suffix: '★', label: 'Customer Rating' },
  ];

  const howItWorks = [
    { step: '01', icon: '🚪', title: 'Visitor Arrives', desc: 'Walk-in or pre-scheduled — reception captures details, ID, and photo in seconds.' },
    { step: '02', icon: '✅', title: 'Instant Check-in', desc: 'Badge prints automatically. Host gets WhatsApp + email the moment their guest is here.' },
    { step: '03', icon: '🎯', title: 'Guided Stay', desc: 'Room pre-booked. Pantry, parking, AV — all service requests handled without friction.' },
    { step: '04', icon: '📊', title: 'Smooth Check-out', desc: 'Visit closed, badge returned, data secured. Full visit report available instantly.' },
  ];

  const testimonials = [
    { name: 'Ahmed Al Rashid', role: 'CTO, Emirates Group', initials: 'AR', color: '#6D28D9', quote: 'CorpGMS transformed our visitor experience. Check-in time dropped from 8 minutes to under 45 seconds. The dashboard gives complete visibility across all our offices.' },
    { name: 'Priya Menon', role: 'Ops Director, TCS India', initials: 'PM', color: '#059669', quote: 'The multi-office dashboard gives us visibility across 6 locations. Separate data per office yet central oversight — exactly what we needed at scale.' },
    { name: 'James Fletcher', role: 'Facilities Manager, KPMG UAE', initials: 'JF', color: '#7C3AED', quote: 'WhatsApp notifications are brilliant. Hosts always know when visitors arrive — zero missed meetings, zero confusion at reception.' },
  ];

  /* ── colour tokens ── */
  const P = '#6D28D9';      /* purple-700  */
  const PL = '#7C3AED';     /* purple-600  */
  const PD = '#5B21B6';     /* purple-800  */
  const PBG = '#F5F3FF';    /* purple-50   */
  const PBORDER = '#E8E4FF';
  const DARK = '#1E1B4B';
  const MID = '#4C4A7A';
  const MUTED = '#9B99C4';

  const btnPrimary = {
    padding: '13px 30px', fontSize: '14px', borderRadius: '11px',
    fontFamily: 'Outfit,sans-serif', fontWeight: 700, border: 'none', cursor: 'pointer',
    background: `linear-gradient(135deg,${PL},${PD})`, color: '#fff',
    boxShadow: `0 5px 18px rgba(109,40,217,0.35)`, transition: 'all 0.2s',
  };
  const btnOutline = {
    padding: '13px 26px', fontSize: '14px', borderRadius: '11px',
    fontFamily: 'Outfit,sans-serif', fontWeight: 600, cursor: 'pointer',
    border: `1.5px solid rgba(109,40,217,0.35)`, background: 'transparent',
    color: P, transition: 'all 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', overflowX: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {showModal && <BookModal onClose={() => setShowModal(false)} onSubmit={handleBook} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spin-slow { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @media (max-width: 640px) {
          .nav-links { display: none !important; }
          .hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .nav-book-btn { display: none !important; }
        }

        .mod-card:hover { transform: translateY(-5px) !important; box-shadow: 0 16px 36px rgba(109,40,217,0.12) !important; }
        .testi-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(109,40,217,0.1); }
        .nav-link:hover { color: ${P} !important; background: ${PBG} !important; }
        .btn-primary-lg:hover { box-shadow: 0 10px 30px rgba(109,40,217,0.5) !important; transform: translateY(-2px); }
        .btn-outline-lg:hover { background: ${PBG} !important; border-color: ${PL} !important; }
        .nav-book-btn:hover { background: ${PBG} !important; border-color: ${P} !important; color: ${PD} !important; }
        .nav-cta-btn:hover { box-shadow: 0 8px 22px rgba(109,40,217,0.5) !important; transform: translateY(-1px); }

        .scroll-top-btn {
          position: fixed; bottom: 28px; right: 28px; z-index: 990;
          width: 44px; height: 44px; border-radius: 13px; border: none; cursor: pointer;
          background: linear-gradient(135deg,${PL},${PD}); color: #fff; font-size: 18px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 5px 18px rgba(109,40,217,0.42); transition: all 0.2s;
        }
        .scroll-top-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(109,40,217,0.55); }

        .grad-text {
          background: linear-gradient(135deg,${P} 0%,${PL} 50%,#8B5CF6 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .hero-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 38%, rgba(255,255,255,0.55) 65%, rgba(255,255,255,0.05) 100%);
        }
        @media (max-width: 768px) {
          .hero-img-overlay {
            background: linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.88) 48%, rgba(255,255,255,1) 100%);
          }
        }

        .orb {
          position: absolute; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0) 70%);
          pointer-events: none;
        }

        .plan-card:hover { transform: translateY(-4px); }
        .how-card:hover { border-color: ${P} !important; transform: translateY(-5px); box-shadow: 0 10px 30px rgba(109,40,217,0.13) !important; }

        input, select, textarea { font-family: 'Plus Jakarta Sans', sans-serif; }
      `}</style>

      {/* ─── SCROLL TO TOP ─── */}
      {scrollY > 300 && (
        <button className="scroll-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="Scroll to top">↑</button>
      )}

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 998,
        padding: '0 clamp(14px,4vw,52px)', height: '66px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        background: scrollY > 40 ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(22px)',
        borderBottom: scrollY > 40 ? `1px solid ${PBORDER}` : '1px solid transparent',
        transition: 'all 0.3s ease',
        boxShadow: scrollY > 40 ? '0 2px 24px rgba(109,40,217,0.08)' : 'none',
      }}>
        {/* top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px', background: `linear-gradient(90deg,${P},${PL},#8B5CF6,#06B6D4)` }} />

        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '11px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '11px', background: `linear-gradient(135deg,${PL},${PD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px', color: 'white', boxShadow: `0 3px 14px rgba(109,40,217,0.38)`, fontFamily: 'Outfit,sans-serif' }}>G</div>
          <div>
            <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '15px', color: DARK, letterSpacing: '-0.3px' }}>CorpGMS</div>
            <div style={{ fontSize: '10px', color: MUTED, fontWeight: 500 }}>Guest Management</div>
          </div>
        </a>

        {/* Nav items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="nav-links" style={{ display: 'flex', gap: '2px' }}>
            {[['#modules','Modules'],['#how','How It Works'],['#pricing','Pricing']].map(([h,l]) => (
              <a key={h} href={h} className="nav-link" style={{ padding: '7px 13px', fontSize: '13px', color: MID, textDecoration: 'none', borderRadius: '8px', transition: 'all 0.2s', fontWeight: 500 }}>{l}</a>
            ))}
          </div>
          <button className="nav-book-btn" onClick={() => setShowModal(true)} style={{ padding: '8px 15px', borderRadius: '9px', border: `1px solid ${PBORDER}`, background: PBG, color: P, cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s', marginLeft: '4px' }}>📅 Book Appointment</button>
          <button className="nav-cta-btn" onClick={onEnterApp} style={{ padding: '9px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '13px', background: `linear-gradient(135deg,${PL},${PD})`, color: '#fff', boxShadow: `0 3px 14px rgba(109,40,217,0.33)`, transition: 'all 0.2s', marginLeft: '4px' }}>Get Started →</button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', padding: 'clamp(90px,14vh,130px) clamp(16px,5vw,64px) 70px', overflow: 'hidden', background: '#FFFFFF' }}>
        {/* Background image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center 40%', backgroundRepeat: 'no-repeat' }} />
        <div className="hero-img-overlay" style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

        {/* Subtle dot grid */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, backgroundImage: `radial-gradient(${PL}18 1px, transparent 1px)`, backgroundSize: '30px 30px', pointerEvents: 'none' }} />

        {/* Decorative orbs */}
        <div className="orb" style={{ width: '600px', height: '600px', top: '-100px', right: '-60px', zIndex: 2 }} />
        <div className="orb" style={{ width: '400px', height: '400px', bottom: '60px', left: '-80px', zIndex: 2 }} />

        <div style={{ position: 'relative', zIndex: 3, maxWidth: '880px', width: '100%', margin: '0 auto', textAlign: 'left' }}>

          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 18px', background: PBG, border: `1px solid rgba(109,40,217,0.22)`, borderRadius: '22px', marginBottom: '30px', fontSize: '12px', color: P, fontWeight: 700, boxShadow: '0 2px 10px rgba(109,40,217,0.1)' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: PL, display: 'inline-block', animation: 'pulse 1.6s infinite', boxShadow: `0 0 6px ${PL}` }} />
            Now live — WhatsApp Notifications & Multi-Office Command Centre
          </div>

          <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(36px,6.5vw,70px)', fontWeight: 900, lineHeight: 1.06, marginBottom: '26px', color: DARK, letterSpacing: '-2px' }}>
            The <span className="grad-text">Smarter</span> Way to<br />Manage Every Visitor
          </h1>

          <p style={{ fontSize: 'clamp(15px,1.9vw,18px)', color: MID, lineHeight: 1.85, marginBottom: '44px', maxWidth: '560px' }}>
            A powerful SaaS platform for corporate offices — check-ins, appointments, rooms, services, and real-time analytics, all in one stunning dashboard.
          </p>

          <div className="hero-btns" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '60px' }}>
            <button className="btn-primary-lg" onClick={onEnterApp} style={{ ...btnPrimary, padding: '15px 34px', fontSize: '15px', borderRadius: '12px' }}>🚀 Launch Demo App</button>
            <button className="btn-outline-lg" onClick={() => setShowModal(true)} style={{ ...btnOutline, padding: '15px 28px', fontSize: '15px', borderRadius: '12px' }}>📅 Book Appointment</button>
            <a href="#pricing" style={{ ...btnOutline, padding: '15px 26px', fontSize: '15px', borderRadius: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>View Pricing</a>
          </div>

          {/* Stats row */}
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: PBORDER, borderRadius: '18px', overflow: 'hidden', border: `1px solid ${PBORDER}`, maxWidth: '620px', boxShadow: '0 6px 24px rgba(109,40,217,0.09)' }}>
            {stats.map(s => (
              <div key={s.label} style={{ padding: 'clamp(14px,2vw,22px) 12px', textAlign: 'center', background: '#fff', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px', background: `linear-gradient(90deg,${P},${PL})` }} />
                <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(22px,3vw,30px)', fontWeight: 900, color: DARK, marginBottom: '5px' }}>
                  <Counter val={s.val} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: '11px', color: MUTED, fontWeight: 600, letterSpacing: '0.02em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MODULES ─── */}
      <section id="modules" style={{ padding: 'clamp(64px,9vh,108px) clamp(16px,5vw,64px)', maxWidth: '1320px', margin: '0 auto', background: '#fff' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'inline-flex', padding: '5px 16px', background: PBG, border: `1px solid rgba(109,40,217,0.2)`, borderRadius: '22px', fontSize: '11px', color: P, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '18px' }}>12 Powerful Modules</div>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(28px,4.5vw,48px)', fontWeight: 900, color: DARK, marginBottom: '16px', letterSpacing: '-1px' }}>Built for Modern Enterprises</h2>
            <p style={{ fontSize: '16px', color: MID, maxWidth: '520px', margin: '0 auto', lineHeight: 1.75 }}>Every module designed to save time, impress visitors, and give your team total control.</p>
          </div>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 265px), 1fr))', gap: '18px' }}>
          {modules.map((m, i) => (
            <FadeIn key={m.title} delay={Math.min(i * 0.04, 0.3)}>
              <div className="mod-card" style={{ padding: '26px', borderRadius: '18px', border: `1px solid ${PBORDER}`, background: '#fff', height: '100%', position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = m.color; e.currentTarget.style.background = `${m.color}04`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = PBORDER; e.currentTarget.style.background = '#fff'; }}>
                {/* top accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,${m.color},${m.color}40)`, opacity: 0 }} className="card-accent" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${m.color}10`, border: `1px solid ${m.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{m.icon}</div>
                  <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 11px', borderRadius: '20px', background: `${m.color}10`, color: m.color, border: `1px solid ${m.color}18`, letterSpacing: '0.04em' }}>{m.tag}</span>
                </div>
                <h3 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '15px', fontWeight: 800, color: DARK, marginBottom: '9px' }}>{m.title}</h3>
                <p style={{ fontSize: '13px', color: MID, lineHeight: 1.7 }}>{m.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" style={{ padding: 'clamp(64px,9vh,108px) clamp(16px,5vw,64px)', background: PBG, borderTop: `1px solid ${PBORDER}`, borderBottom: `1px solid ${PBORDER}` }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <div style={{ display: 'inline-flex', padding: '5px 16px', background: '#E0F7F4', border: '1px solid rgba(8,145,178,0.2)', borderRadius: '22px', fontSize: '11px', color: '#0891B2', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '18px' }}>How It Works</div>
              <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(28px,4.5vw,48px)', fontWeight: 900, color: DARK, marginBottom: '14px', letterSpacing: '-1px' }}>From Arrival to Check-out</h2>
              <p style={{ fontSize: '15px', color: MID, lineHeight: 1.7 }}>A smooth, professional visitor experience in 4 simple steps.</p>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: '20px' }}>
            {howItWorks.map((s, i) => (
              <FadeIn key={s.step} delay={i * 0.1}>
                <div className="how-card" style={{ textAlign: 'center', padding: '30px 22px', borderRadius: '18px', border: `1px solid ${PBORDER}`, background: '#fff', transition: 'all 0.3s', cursor: 'default' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: `linear-gradient(135deg,${PL},${PD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 18px', boxShadow: `0 5px 18px rgba(109,40,217,0.28)` }}>{s.icon}</div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: PL, marginBottom: '9px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Step {s.step}</div>
                  <h3 style={{ fontFamily: 'Outfit,sans-serif', fontSize: '16px', fontWeight: 800, color: DARK, marginBottom: '10px' }}>{s.title}</h3>
                  <p style={{ fontSize: '13px', color: MID, lineHeight: 1.7 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT MOCKUP ─── */}
      <section style={{ padding: 'clamp(64px,9vh,108px) clamp(16px,5vw,64px)', maxWidth: '1140px', margin: '0 auto', background: '#fff' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(26px,4vw,44px)', fontWeight: 900, color: DARK, marginBottom: '14px', letterSpacing: '-0.8px' }}>See CorpGMS in Action</h2>
            <p style={{ color: MID, fontSize: '16px', lineHeight: 1.7 }}>One platform. Every visitor. Total control.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ borderRadius: '22px', border: `1px solid ${PBORDER}`, overflow: 'hidden', background: '#fff', boxShadow: `0 24px 70px rgba(109,40,217,0.11)` }}>
            {/* Browser chrome */}
            <div style={{ padding: '10px 18px', background: `linear-gradient(135deg,${DARK},#2D1B69)`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '7px' }}>{['#E53935','#F57C00','#43A047'].map(c => <div key={c} style={{ width: '11px', height: '11px', borderRadius: '50%', background: c }} />)}</div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.09)', borderRadius: '7px', padding: '5px 14px', fontSize: '11px', color: '#A78BFA', fontFamily: 'monospace', border: `1px solid rgba(109,40,217,0.2)` }}>app.corpgms.io/dashboard</div>
            </div>
            <div style={{ padding: 'clamp(18px,3vw,28px)', background: '#F8F7FF' }}>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '13px', marginBottom: '18px' }}>
                {[
                  { label: 'Visitors Today', val: '47', color: P, icon: '🚶', tag: '+12%' },
                  { label: 'Currently Inside', val: '12', color: '#059669', icon: '✅', tag: 'Live' },
                  { label: 'Upcoming Today', val: '8', color: '#D97706', icon: '📅', tag: 'Next 2PM' },
                  { label: 'Rooms Occupied', val: '5/8', color: PL, icon: '🏢', tag: '63%' },
                ].map(c => (
                  <div key={c.label} style={{ padding: '15px', borderRadius: '13px', border: `1px solid ${PBORDER}`, background: '#fff', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = c.color}
                    onMouseLeave={e => e.currentTarget.style.borderColor = PBORDER}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px', background: c.color }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '11px' }}>
                      <span style={{ fontSize: '18px' }}>{c.icon}</span>
                      <span style={{ fontSize: '10px', background: `${c.color}12`, color: c.color, padding: '2px 9px', borderRadius: '10px', fontWeight: 800 }}>{c.tag}</span>
                    </div>
                    <div style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(24px,3vw,30px)', fontWeight: 900, color: DARK, marginBottom: '5px' }}>{c.val}</div>
                    <div style={{ fontSize: '11px', color: MUTED, fontWeight: 500 }}>{c.label}</div>
                  </div>
                ))}
              </div>
              {/* Recent visitors table */}
              <div style={{ borderRadius: '13px', border: `1px solid ${PBORDER}`, overflow: 'hidden', background: '#fff' }}>
                <div style={{ padding: '11px 18px', background: `linear-gradient(135deg,${DARK},#2D1B69)`, fontSize: '12px', fontWeight: 800, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Recent Visitors</span>
                  <span style={{ color: '#34D399', animation: 'pulse 2s infinite', fontSize: '11px' }}>● Live</span>
                </div>
                {[
                  { name: 'Ahmed Al Rashid', company: 'Emirates Group', status: 'Inside', color: '#059669', time: '09:15 AM', room: 'Board Room A' },
                  { name: 'Sarah Johnson', company: 'McKinsey & Co', status: 'Checked Out', color: P, time: '10:00 AM', room: 'Conf. Room 1' },
                  { name: 'Fatima Al Zaabi', company: 'ADNOC', status: 'Expected', color: '#D97706', time: '02:00 PM', room: 'Board Room B' },
                ].map((v, i) => (
                  <div key={v.name} style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: '13px', borderTop: i > 0 ? `1px solid ${PBG}` : 'none', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = PBG}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${v.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: v.color, flexShrink: 0, border: `1px solid ${v.color}20` }}>
                      {v.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
                      <div style={{ fontSize: '11px', color: MUTED }}>{v.company} · {v.room}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: `${v.color}12`, color: v.color, marginBottom: '3px' }}>{v.status}</div>
                      <div style={{ fontSize: '10px', color: MUTED }}>{v.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ padding: 'clamp(64px,9vh,108px) clamp(16px,5vw,64px)', background: PBG, borderTop: `1px solid ${PBORDER}`, borderBottom: `1px solid ${PBORDER}` }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <div style={{ display: 'inline-flex', padding: '5px 16px', background: '#fff', border: `1px solid ${PBORDER}`, borderRadius: '22px', fontSize: '11px', color: P, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '18px', boxShadow: `0 2px 8px rgba(109,40,217,0.08)` }}>Pricing</div>
              <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(28px,4.5vw,48px)', fontWeight: 900, color: DARK, marginBottom: '14px', letterSpacing: '-1px' }}>Simple, Transparent Pricing</h2>
              <p style={{ fontSize: '15px', color: MID, marginBottom: '32px', lineHeight: 1.7 }}>No hidden fees. Scale as you grow. Cancel anytime.</p>
              {/* Toggle */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px', background: '#fff', border: `1px solid ${PBORDER}`, borderRadius: '44px', boxShadow: '0 2px 10px rgba(109,40,217,0.07)' }}>
                <button onClick={() => setYearly(false)} style={{ padding: '9px 24px', borderRadius: '34px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: !yearly ? `linear-gradient(135deg,${PL},${PD})` : 'transparent', color: !yearly ? 'white' : MID, transition: 'all 0.25s', fontFamily: 'inherit' }}>Month</button>
                <button onClick={() => setYearly(true)} style={{ padding: '9px 24px', borderRadius: '34px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: yearly ? `linear-gradient(135deg,${PL},${PD})` : 'transparent', color: yearly ? 'white' : MID, transition: 'all 0.25s', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  Year <span style={{ fontSize: '10px', background: 'rgba(5,150,105,0.12)', color: '#059669', padding: '2px 9px', borderRadius: '12px', fontWeight: 800 }}>Save 20%</span>
                </button>
              </div>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 305px), 1fr))', gap: '22px', alignItems: 'start' }}>
            {SUBSCRIPTION_PLANS.map((plan, i) => (
              <FadeIn key={plan.id} delay={i * 0.1}>
                <div className="plan-card" style={{
                  padding: '30px', borderRadius: '20px', position: 'relative',
                  border: plan.featured ? `2px solid ${P}` : `1px solid ${PBORDER}`,
                  background: '#fff',
                  boxShadow: plan.featured ? `0 16px 48px rgba(109,40,217,0.17)` : `0 2px 10px rgba(109,40,217,0.05)`,
                  transition: 'all 0.3s',
                }}>
                  {plan.featured && (
                    <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 800, padding: '5px 14px', background: `linear-gradient(135deg,${PL},${PD})`, color: 'white', borderRadius: '20px', letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: `0 3px 12px rgba(109,40,217,0.4)` }}>⭐ Most Popular</div>
                  )}
                  <div style={{ fontSize: '11px', fontWeight: 800, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: '48px', fontWeight: 900, color: DARK, letterSpacing: '-2px' }}>${yearly ? plan.yearlyPrice : plan.price}</span>
                    <span style={{ fontSize: '13px', color: MUTED }}>/month</span>
                  </div>
                  <p style={{ fontSize: '13px', color: MID, marginBottom: '22px', lineHeight: 1.65 }}>{plan.desc}</p>
                  <div style={{ display: 'flex', gap: '7px', marginBottom: '22px', flexWrap: 'wrap' }}>
                    {[
                      plan.offices === 'Unlimited' ? '∞ Offices' : `${plan.offices} Office${plan.offices > 1 ? 's' : ''}`,
                      plan.users === 'Unlimited' ? '∞ Users' : `${plan.users} Users`,
                      plan.visitors === 'Unlimited' ? '∞ Visitors' : `${plan.visitors}/mo`,
                    ].map(t => <span key={t} style={{ fontSize: '11px', background: `${plan.color}10`, color: plan.color, padding: '4px 11px', borderRadius: '22px', border: `1px solid ${plan.color}20`, fontWeight: 700 }}>{t}</span>)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '26px' }}>
                    {plan.features.map(f => (
                      <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                        <div style={{ width: '19px', height: '19px', borderRadius: '50%', background: f.included ? 'rgba(5,150,105,0.1)' : '#F8F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: f.included ? '#059669' : '#C4C2DE', flexShrink: 0, border: `1px solid ${f.included ? 'rgba(5,150,105,0.22)' : PBORDER}` }}>
                          {f.included ? '✓' : '×'}
                        </div>
                        <span style={{ fontSize: '13px', color: f.included ? MID : '#C4C2DE' }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={onEnterApp} style={{
                    width: '100%', padding: '13px', fontSize: '14px', borderRadius: '11px',
                    fontFamily: 'Outfit,sans-serif', fontWeight: 700, cursor: 'pointer',
                    ...(plan.featured
                      ? { background: `linear-gradient(135deg,${PL},${PD})`, color: '#fff', border: 'none', boxShadow: `0 5px 18px rgba(109,40,217,0.32)` }
                      : { background: PBG, color: P, border: `1px solid ${PBORDER}` }
                    ),
                    transition: 'all 0.2s',
                  }}>
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: 'clamp(64px,9vh,108px) clamp(16px,5vw,64px)', maxWidth: '1140px', margin: '0 auto', background: '#fff' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(26px,4vw,42px)', fontWeight: 900, color: DARK, marginBottom: '12px', letterSpacing: '-0.8px' }}>Trusted by Leading Organisations</h2>
            <p style={{ fontSize: '15px', color: MID, lineHeight: 1.7 }}>What companies say after switching to CorpGMS.</p>
          </div>
        </FadeIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 305px), 1fr))', gap: '22px' }}>
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} delay={i * 0.1}>
              <div className="testi-card" style={{ padding: '30px', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '18px', border: `1px solid ${PBORDER}`, background: '#fff', transition: 'all 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = t.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = PBORDER}>
                <div style={{ color: '#F59E0B', fontSize: '14px', letterSpacing: '2px', marginBottom: '14px' }}>★★★★★</div>
                <div style={{ fontSize: '40px', color: t.color, marginBottom: '16px', opacity: 0.35, lineHeight: 1, fontFamily: 'Georgia,serif' }}>"</div>
                <p style={{ fontSize: '14px', color: MID, lineHeight: 1.8, marginBottom: '26px', flex: 1 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '13px', paddingTop: '20px', borderTop: `1px solid ${PBORDER}` }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${t.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: t.color, flexShrink: 0, border: `1px solid ${t.color}20` }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: DARK }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: MUTED, marginTop: '2px' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: 'clamp(64px,11vh,128px) clamp(16px,5vw,64px)', textAlign: 'center', position: 'relative', overflow: 'hidden', background: PBG, borderTop: `1px solid ${PBORDER}` }}>
        {/* gradient line top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2.5px', background: `linear-gradient(90deg,transparent,${P},${PL},#06B6D4,transparent)` }} />
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '340px', height: '340px', borderRadius: '50%', background: `radial-gradient(circle,rgba(124,58,237,0.1) 0%,transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '260px', height: '260px', borderRadius: '50%', background: `radial-gradient(circle,rgba(109,40,217,0.08) 0%,transparent 70%)`, pointerEvents: 'none' }} />
        <FadeIn>
          <div style={{ position: 'relative', maxWidth: '660px', margin: '0 auto' }}>
            <div style={{ fontSize: '56px', marginBottom: '22px', display: 'inline-block', animation: 'float 3.2s ease infinite' }}>🚀</div>
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 'clamp(28px,5.5vw,56px)', fontWeight: 900, color: DARK, marginBottom: '18px', lineHeight: 1.07, letterSpacing: '-1.5px' }}>
              Ready to Impress<br /><span className="grad-text">Every Visitor?</span>
            </h2>
            <p style={{ fontSize: '17px', color: MID, marginBottom: '40px', lineHeight: 1.75, maxWidth: '480px', margin: '0 auto 40px' }}>Start your 14-day free trial or book a live demo. No credit card required.</p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary-lg" onClick={onEnterApp} style={{ ...btnPrimary, padding: '16px 38px', fontSize: '16px', borderRadius: '13px' }}>🚀 Start Free Trial</button>
              <button className="btn-outline-lg" onClick={() => setShowModal(true)} style={{ ...btnOutline, padding: '16px 32px', fontSize: '16px', borderRadius: '13px' }}>📅 Book Appointment</button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: 'clamp(22px,3vw,36px) clamp(16px,5vw,52px)', borderTop: `1px solid ${PBORDER}`, background: '#fff' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '18px', marginBottom: '22px' }}>
            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '11px', textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `linear-gradient(135deg,${PL},${PD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: 'white', fontFamily: 'Outfit,sans-serif' }}>G</div>
              <div>
                <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: '14px', color: DARK }}>CorpGMS</div>
                <div style={{ fontSize: '10px', color: MUTED, fontWeight: 500 }}>Corporate Guest Management System</div>
              </div>
            </a>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[['#modules','Modules'],['#how','How It Works'],['#pricing','Pricing']].map(([h,l]) => (
                <a key={h} href={h} style={{ padding: '6px 13px', fontSize: '12px', color: MUTED, textDecoration: 'none', borderRadius: '8px', border: `1px solid ${PBORDER}`, transition: 'all 0.2s', fontWeight: 600 }}
                  onMouseEnter={e => { e.target.style.color = P; e.target.style.borderColor = 'rgba(109,40,217,0.3)'; e.target.style.background = PBG; }}
                  onMouseLeave={e => { e.target.style.color = MUTED; e.target.style.borderColor = PBORDER; e.target.style.background = 'transparent'; }}>{l}</a>
              ))}
              <button onClick={() => setShowModal(true)} style={{ padding: '6px 13px', fontSize: '12px', color: P, border: `1px solid ${PBORDER}`, borderRadius: '8px', background: PBG, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>📅 Book Appointment</button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '18px', borderTop: `1px solid ${PBORDER}` }}>
            <span style={{ fontSize: '12px', color: '#C4C2DE' }}>© 2025 <span style={{ color: MUTED, cursor: 'pointer', fontWeight: 700 }}>CorpGMS by BIZZFLY</span> · All rights reserved.</span>
            <div style={{ display: 'flex', gap: '18px' }}>
              {['Privacy','Terms','Contact','Status'].map(l => (
                <a key={l} href="#" style={{ fontSize: '12px', color: '#C4C2DE', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 500 }}
                  onMouseEnter={e => e.target.style.color = P}
                  onMouseLeave={e => e.target.style.color = '#C4C2DE'}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}