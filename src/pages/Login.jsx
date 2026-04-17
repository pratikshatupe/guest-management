import React, { useState, useEffect } from 'react';

/* ─── All 5 demo roles ─── */
const ROLES = [
  {
    id: 'director',
    label: 'Director',
    name: 'Arjun Mehta',
    email: 'director@corpgms.com',
    password: '123456',
    icon: '👑',
    color: '#6D28D9',
    bg: '#F5F3FF',
    border: '#E8E4FF',
    desc: 'Full platform access',
    badge: 'Executive',
  },
  {
    id: 'manager',
    label: 'Manager',
    name: 'Priya Sharma',
    email: 'manager@corpgms.com',
    password: '123456',
    icon: '🏢',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    desc: 'Operations & reporting',
    badge: 'Management',
  },
  {
    id: 'reception',
    label: 'Reception',
    name: 'Sara Khan',
    email: 'reception@corpgms.com',
    password: '123456',
    icon: '🛎️',
    color: '#0891B2',
    bg: '#ECFEFF',
    border: '#A5F3FC',
    desc: 'Guest check-in & walk-ins',
    badge: 'Front Desk',
  },
  {
    id: 'service',
    label: 'Service Staff',
    name: 'Rahul Patil',
    email: 'service@corpgms.com',
    password: '123456',
    icon: '⚙️',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    desc: 'Pantry, AV & logistics',
    badge: 'Operations',
  },
  {
    id: 'superadmin',
    label: 'Super Admin',
    name: 'Super Admin',
    email: 'superadmin@corpgms.com',
    password: '123456',
    icon: '🛡️',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    desc: 'Global platform control',
    badge: 'Platform Control',
  },
];

/* ─── colour tokens ─── */
const P       = '#6D28D9';
const PL      = '#7C3AED';
const PD      = '#5B21B6';
const PBG     = '#F5F3FF';
const PBORDER = '#E8E4FF';
const DARK    = '#1E1B4B';
const MID     = '#4C4A7A';
const MUTED   = '#9B99C4';

export default function Login({ onBackToLanding, onLogin }) {
  const [selectedRole, setSelectedRole] = useState(0);
  const [email,        setEmail]        = useState(ROLES[0].email);
  const [password,     setPassword]     = useState(ROLES[0].password);
  const [showPass,     setShowPass]     = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);
  const [errors,       setErrors]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [attempts,     setAttempts]     = useState(0);
  const [locked,       setLocked]       = useState(false);
  const [lockTimer,    setLockTimer]    = useState(0);

  /* ── Remember Me restore ── */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cgms_remember') || 'null');
      if (saved?.email) { setEmail(saved.email); setRememberMe(true); }
    } catch {}
  }, []);

  /* ── Lock countdown ── */
  useEffect(() => {
    if (!locked || lockTimer <= 0) return;
    const t = setTimeout(() => {
      setLockTimer(prev => {
        if (prev <= 1) { setLocked(false); setAttempts(0); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [locked, lockTimer]);

  /* ── Pick role → auto-fill ── */
  const pickRole = (i) => {
    setSelectedRole(i);
    setEmail(ROLES[i].email);
    setPassword(ROLES[i].password);
    setErrors({});
  };

  /* ── Validate ── */
  const validate = () => {
    const e = {};
    if (!email.trim())
      e.email = 'Email ID is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = 'Please enter a valid Email ID.';
    if (!password.trim())
      e.password = 'Password is required.';
    else if (password.length < 6)
      e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (locked) return;
    if (!validate()) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      /* Find matching role */
      const match = ROLES.find(
        r => r.email.toLowerCase() === email.toLowerCase() && r.password === password
      );

      if (!match) {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= 5) {
          setLocked(true);
          setLockTimer(30);
          setErrors({ general: 'Too many failed attempts. Please wait 30 seconds before trying again.' });
        } else {
          setErrors({ general: `Incorrect Email ID or Password. ${5 - next} attempt(s) remaining.` });
        }
        return;
      }

      /* Save Remember Me */
      if (rememberMe) {
        localStorage.setItem('cgms_remember', JSON.stringify({ email }));
      } else {
        localStorage.removeItem('cgms_remember');
      }

      /* ✅ Pass full role object to App.jsx */
      onLogin(match);
    }, 900);
  };

  const role = ROLES[selectedRole];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        .ll { display:flex !important; }
        .role-card { transition: all 0.2s cubic-bezier(.22,1,.36,1); cursor:pointer; border:none; }
        .role-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.1); }
        .inp:focus { border-color:#7C3AED !important; box-shadow:0 0 0 3px rgba(124,58,237,0.13) !important; outline:none; }
        .btn-lg:hover:not(:disabled) { box-shadow:0 8px 24px rgba(109,40,217,0.45) !important; transform:translateY(-1px); }
        .btn-lg:active:not(:disabled) { transform:scale(0.98); }
        .back:hover { background:${PBG} !important; color:${PD} !important; }
        .qlink:hover { background:#FAFAFA !important; }
        @media (max-width:900px) { .ll { display:none !important; } .rp { padding:28px 20px !important; } }
        @media (max-width:480px) { .rg { grid-template-columns:1fr 1fr !important; } }
      `}</style>

      {/* ═══ LEFT PANEL ═══ */}
      <div className="ll" style={{
        width: '50%', flexDirection: 'column', justifyContent: 'space-between',
        padding: 'clamp(40px,6vw,80px)',
        background: 'linear-gradient(160deg,#1E1B4B 0%,#2D1B69 55%,#3B0764 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative bg */}
        <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(rgba(124,58,237,0.14) 1px, transparent 1px)`, backgroundSize:'28px 28px', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'-120px', right:'-80px', width:'420px', height:'420px', borderRadius:'50%', background:'radial-gradient(circle,rgba(124,58,237,0.22) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-80px', left:'-60px', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle,rgba(91,33,182,0.18) 0%,transparent 70%)', pointerEvents:'none' }} />

        {/* Top — logo + headline */}
        <div style={{ position:'relative', zIndex:2, animation:'fadeUp 0.6s ease both' }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:56 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#7C3AED,#5B21B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:900, color:'#fff', boxShadow:'0 4px 18px rgba(109,40,217,0.5)', fontFamily:'Outfit,sans-serif' }}>G</div>
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:17, color:'#fff' }}>CorpGMS</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontWeight:500 }}>Corporate Guest Management</div>
            </div>
          </div>

          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(28px,3.2vw,42px)', fontWeight:900, color:'#fff', lineHeight:1.12, marginBottom:18, letterSpacing:'-1px' }}>
            Welcome back.<br />Your dashboard<br />awaits.
          </h1>
          <p style={{ fontSize:15, color:'rgba(255,255,255,0.58)', lineHeight:1.85, maxWidth:320 }}>
            Sign in to manage guests, appointments, rooms and services — all from one powerful platform.
          </p>
        </div>

        {/* Bottom — features + stats */}
        <div style={{ position:'relative', zIndex:2, animation:'fadeUp 0.6s 0.15s ease both' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
            {[
              { icon:'🚶', text:'Instant guest check-in with badge printing' },
              { icon:'📅', text:'Pre-scheduled appointments & auto-reminders' },
              { icon:'🏢', text:'Live room & venue availability' },
              { icon:'📊', text:'Real-time analytics across all offices' },
            ].map(f => (
              <div key={f.text} style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(124,58,237,0.2)', border:'1px solid rgba(124,58,237,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{f.icon}</div>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.68)', fontWeight:500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div style={{ marginTop:44, paddingTop:26, borderTop:'1px solid rgba(255,255,255,0.1)', display:'flex', gap:28 }}>
            {[['500+','Companies'],['2M+','Guests Managed'],['99.9%','Uptime']].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:22, color:'#fff' }}>{v}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.42)', fontWeight:500, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT PANEL ═══ */}
      <div className="rp" style={{
        flex:1, display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'clamp(32px,5vw,70px)', overflowY:'auto',
        animation:'fadeUp 0.5s 0.08s ease both', opacity:0, animationFillMode:'forwards',
      }}>
        <div style={{ maxWidth:460, width:'100%', margin:'0 auto' }}>

          {/* Back button */}
          <button className="back" onClick={onBackToLanding} style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'7px 14px', borderRadius:9, border:`1px solid ${PBORDER}`,
            background:'transparent', color:MUTED, cursor:'pointer',
            fontSize:13, fontWeight:600, fontFamily:'inherit', transition:'all 0.2s',
            marginBottom:34,
          }}>
            ← Back to Home
          </button>

          {/* Heading */}
          <div style={{ marginBottom:28 }}>
            <p style={{ fontSize:11, color:MUTED, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>CorpGMS Platform</p>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(24px,2.8vw,32px)', fontWeight:900, color:DARK, letterSpacing:'-0.8px', marginBottom:6 }}>
              Log In to Your Account
            </h2>
            <p style={{ fontSize:14, color:MID }}>Select your role, then enter your credentials.</p>
          </div>

          {/* ── Role selector grid ── */}
          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:11, fontWeight:700, color:P, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:10 }}>
              Select Role
            </label>
            <div className="rg" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9 }}>
              {ROLES.map((r, i) => (
                <button
                  key={r.id}
                  className="role-card"
                  onClick={() => pickRole(i)}
                  style={{
                    padding:'11px 9px', borderRadius:12,
                    border:`1.5px solid ${selectedRole === i ? r.color : PBORDER}`,
                    background: selectedRole === i ? r.bg : '#FAFAFA',
                    textAlign:'left', fontFamily:'inherit', position:'relative', overflow:'hidden',
                  }}
                >
                  {selectedRole === i && (
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'2.5px', background:r.color }} />
                  )}
                  <div style={{ fontSize:18, marginBottom:5 }}>{r.icon}</div>
                  <div style={{ fontSize:11, fontWeight:800, color: selectedRole===i ? r.color : DARK }}>{r.label}</div>
                  <div style={{ fontSize:10, color:MUTED, marginTop:2, lineHeight:1.4 }}>{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected role banner */}
          <div style={{
            padding:'11px 15px', borderRadius:10, background:role.bg,
            border:`1px solid ${role.border}`, display:'flex', alignItems:'center', gap:12, marginBottom:22,
          }}>
            <span style={{ fontSize:19 }}>{role.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:role.color }}>{role.label} — {role.badge}</div>
              <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>Demo: {role.email} · Password: 123456</div>
            </div>
            <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:role.color, color:'#fff', fontWeight:800, flexShrink:0 }}>Active</div>
          </div>

          {/* General error */}
          {errors.general && (
            <div style={{ padding:'11px 15px', borderRadius:10, background:'#FEF2F2', border:'1px solid #FECACA', fontSize:13, color:'#DC2626', marginBottom:16, fontWeight:500 }}>
              ⚠️ {errors.general}
              {locked && <span style={{ display:'block', fontSize:11, marginTop:4, color:'#9B1C1C' }}>Retry in: {lockTimer}s</span>}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Email ID */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:700, color:P, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:5 }}>
                Email ID*
              </label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', fontSize:14, opacity:0.4, pointerEvents:'none' }}>✉</span>
                <input
                  className="inp"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email:undefined, general:undefined })); }}
                  placeholder="Enter Email ID"
                  maxLength={120}
                  style={{
                    width:'100%', padding:'11px 13px 11px 36px', borderRadius:10,
                    fontSize:14, border:`1.5px solid ${errors.email ? '#EF4444' : PBORDER}`,
                    background:'#FAFAFA', color:DARK, fontFamily:'inherit',
                    transition:'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
              </div>
              {errors.email && <span style={{ fontSize:11, color:'#EF4444', display:'block', marginTop:4 }}>{errors.email}</span>}
            </div>

            {/* Password */}
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, fontWeight:700, color:P, textTransform:'uppercase', letterSpacing:'0.08em', display:'block', marginBottom:5 }}>
                Password*
              </label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', fontSize:14, opacity:0.4, pointerEvents:'none' }}>🔒</span>
                <input
                  className="inp"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password:undefined, general:undefined })); }}
                  placeholder="Enter Password"
                  maxLength={64}
                  style={{
                    width:'100%', padding:'11px 42px 11px 36px', borderRadius:10,
                    fontSize:14, border:`1.5px solid ${errors.password ? '#EF4444' : PBORDER}`,
                    background:'#FAFAFA', color:DARK, fontFamily:'inherit',
                    transition:'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
                {/* Eye icon */}
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  title={showPass ? 'Hide password' : 'View password'}
                  style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:15, opacity:0.5, padding:4, lineHeight:1, color:DARK }}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span style={{ fontSize:11, color:'#EF4444', display:'block', marginTop:4 }}>{errors.password}</span>}
            </div>

            {/* Remember Me + Forgot Password */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:MID, fontWeight:500 }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width:15, height:15, accentColor:PL, cursor:'pointer' }}
                />
                Remember Me
              </label>
              <a
                href="#"
                onClick={e => e.preventDefault()}
                style={{ fontSize:13, color:PL, fontWeight:600, textDecoration:'none' }}
                onMouseEnter={e => e.target.style.textDecoration='underline'}
                onMouseLeave={e => e.target.style.textDecoration='none'}
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-lg"
              disabled={loading || locked}
              style={{
                width:'100%', padding:'14px', borderRadius:11, border:'none',
                background: locked ? '#E5E7EB' : `linear-gradient(135deg,${PL},${PD})`,
                color: locked ? '#9CA3AF' : '#fff',
                fontSize:15, fontWeight:700, fontFamily:'Outfit,sans-serif',
                cursor: (loading || locked) ? 'not-allowed' : 'pointer',
                boxShadow: locked ? 'none' : '0 5px 18px rgba(109,40,217,0.32)',
                transition:'all 0.22s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:10,
              }}
            >
              {loading ? (
                <>
                  <span style={{ width:17, height:17, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
                  Logging in…
                </>
              ) : locked ? (
                `⏳ Locked — wait ${lockTimer}s`
              ) : (
                `🔐 Log In as ${role.label}`
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'22px 0' }}>
            <div style={{ flex:1, height:1, background:PBORDER }} />
            <span style={{ fontSize:10, color:MUTED, fontWeight:700, letterSpacing:'0.08em' }}>QUICK LOGIN</span>
            <div style={{ flex:1, height:1, background:PBORDER }} />
          </div>

          {/* Quick-pick list */}
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {ROLES.map((r, i) => (
              <button
                key={r.id}
                className="qlink"
                onClick={() => pickRole(i)}
                style={{
                  display:'flex', alignItems:'center', gap:12, padding:'9px 13px',
                  borderRadius:10,
                  border:`1px solid ${selectedRole===i ? r.color : PBORDER}`,
                  background: selectedRole===i ? r.bg : 'transparent',
                  cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s', textAlign:'left',
                }}
              >
                <span style={{ fontSize:15 }}>{r.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color: selectedRole===i ? r.color : DARK }}>{r.label}</div>
                  <div style={{ fontSize:11, color:MUTED, marginTop:1 }}>{r.email}</div>
                </div>
                <span style={{ fontSize:10, padding:'2px 9px', borderRadius:20, background:`${r.color}18`, color:r.color, fontWeight:800, flexShrink:0 }}>{r.badge}</span>
              </button>
            ))}
          </div>

          <p style={{ textAlign:'center', fontSize:12, color:MUTED, marginTop:28 }}>
            © 2025 CorpGMS by BIZZFLY · All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}