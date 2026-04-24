import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { STORAGE_KEYS } from '../store';
import { safeGet } from '../utils/storage';
import { MOCK_STAFF } from '../data/mockData';
import { sha256Hex } from '../utils/passwordValidation';
import { addAuditLog } from '../utils/auditLogger';

const ROLES = [
  { id:'superadmin', label:'Super Admin', name:'Super Admin', email:'superadmin@corpgms.com', password:'123456', icon:'🛡️', color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', badge:'Platform', desc:'Full platform control', staffId:null, organisationId:'all', officeId:'all' },
  { id:'director',   label:'Director',    name:'Arjun Mehta', email:'director@corpgms.com',   password:'123456', icon:'👑', color:'#0284C7', bg:'#E0F2FE', border:'#BAE6FD', badge:'Executive',  desc:'Organisation owner',     staffId:'staff-1', organisationId:'org-acme', officeId:'all' },
  { id:'manager',    label:'Manager',     name:'Priya Sharma', email:'manager@corpgms.com',   password:'123456', icon:'🏢', color:'#059669', bg:'#ECFDF5', border:'#A7F3D0', badge:'Management', desc:'Operations & reporting', staffId:'staff-2', organisationId:'org-acme', officeId:'OFC-00001' },
  { id:'reception',  label:'Reception',   name:'Sara Khan',   email:'reception@corpgms.com',  password:'123456', icon:'🛎️', color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC', badge:'Front Desk', desc:'Guest check-in',         staffId:'staff-3', organisationId:'org-acme', officeId:'OFC-00002' },
  { id:'service',    label:'Service Staff', name:'Rahul Patil', email:'service@corpgms.com',  password:'123456', icon:'⚙️', color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', badge:'Operations', desc:'Pantry, AV & logistics', staffId:'staff-4', organisationId:'org-acme', officeId:'OFC-00001' },
];

function bustPermissionCache() {
  const STALE = ['role_permissions_dynamic.v1','role_permissions_dynamic.v2','role_permissions.v6','role_permissions.v5','role_permissions.v4','role_permissions.v3','role_permissions.v2','role_permissions','current_role'];
  try { STALE.forEach(k => localStorage.removeItem(k)); } catch {}
}

function Orb({ size, top, left, delay, color }) {
  return <div style={{ position:'absolute', width:size, height:size, borderRadius:'50%', top, left, background:`radial-gradient(circle at 35% 35%, ${color}55, ${color}11)`, animation:`orbFloat ${3+delay}s ease-in-out ${delay}s infinite alternate`, pointerEvents:'none', filter:'blur(1px)' }} />;
}

function Typewriter({ texts }) {
  const [idx,setIdx]=useState(0), [displayed,setDisplayed]=useState(''), [deleting,setDeleting]=useState(false), [charIdx,setCharIdx]=useState(0);
  useEffect(()=>{
    const current=texts[idx]; let timeout;
    if(!deleting&&charIdx<current.length) timeout=setTimeout(()=>{setDisplayed(current.slice(0,charIdx+1));setCharIdx(c=>c+1);},60);
    else if(!deleting&&charIdx===current.length) timeout=setTimeout(()=>setDeleting(true),2200);
    else if(deleting&&charIdx>0) timeout=setTimeout(()=>{setDisplayed(current.slice(0,charIdx-1));setCharIdx(c=>c-1);},35);
    else if(deleting&&charIdx===0){setDeleting(false);setIdx(i=>(i+1)%texts.length);}
    return()=>clearTimeout(timeout);
  },[charIdx,deleting,idx,texts]);
  return <span>{displayed}<span style={{borderRight:'2px solid rgba(56,189,248,0.9)',marginLeft:2,animation:'blink 1s step-end infinite'}}>&nbsp;</span></span>;
}

export default function Login({ onBackToLanding, onLogin }) {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [showPass,setShowPass]=useState(false);
  const [rememberMe,setRememberMe]=useState(false);
  const [errors,setErrors]=useState({});
  const [loading,setLoading]=useState(false);
  const [attempts,setAttempts]=useState(0);
  const [locked,setLocked]=useState(false);
  const [lockTimer,setLockTimer]=useState(0);
  const [fillAnim,setFillAnim]=useState(null);
  const emailRef=useRef(null);

  useEffect(()=>{ bustPermissionCache(); },[]);

  useEffect(()=>{
    try { const s=JSON.parse(localStorage.getItem(STORAGE_KEYS.REMEMBER)||'null'); if(s?.email){setEmail(s.email);setRememberMe(true);} } catch{}
  },[]);

  useEffect(()=>{
    if(!locked||lockTimer<=0) return;
    const t=setTimeout(()=>setLockTimer(prev=>{ if(prev<=1){setLocked(false);setAttempts(0);return 0;} return prev-1; }),1000);
    return()=>clearTimeout(t);
  },[locked,lockTimer]);

  const quickFill=(role)=>{
    setFillAnim(role.id);
    setEmail(role.email);
    setPassword(role.password);
    setErrors({});
    setTimeout(()=>setFillAnim(null),600);
    setTimeout(()=>emailRef.current?.focus(),50);
  };

  const validate=()=>{
    const e={};
    if(!email.trim()) e.email='Email ID is required.';
    else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email='Please enter a valid Email ID.';
    if(!password.trim()) e.password='Password is required.';
    else if(password.length<6) e.password='Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handleSubmit=(ev)=>{
    ev.preventDefault();
    if(locked) return;
    if(!validate()) return;
    setLoading(true);
    setTimeout(()=>{
      setLoading(false);
      // Check registered orgs users first
      try {
        const regUsers = JSON.parse(localStorage.getItem('cgms_registered_users') || '[]');
        const regMatch = regUsers.find(u => (u.email||u.emailId||'').toLowerCase()===email.toLowerCase() && u.password===password);
        if (regMatch) {
          if(rememberMe) localStorage.setItem(STORAGE_KEYS.REMEMBER,JSON.stringify({email}));
          else localStorage.removeItem(STORAGE_KEYS.REMEMBER);
          onLogin({ ...regMatch, role: regMatch.role || 'director', id: regMatch.role || 'director' });
          return;
        }
      } catch(e) {}

      const demoMatch=ROLES.find(r=>r.email.toLowerCase()===email.toLowerCase()&&r.password===password);
      if(demoMatch){
        if(rememberMe) localStorage.setItem(STORAGE_KEYS.REMEMBER,JSON.stringify({email}));
        else localStorage.removeItem(STORAGE_KEYS.REMEMBER);
        onLogin({...demoMatch,role:demoMatch.id});
        return;
      }
      const liveStaff=safeGet(STORAGE_KEYS.STAFF,MOCK_STAFF);
      const candidates=Array.isArray(liveStaff)?liveStaff.filter(s=>s&&String(s.status||'Active')!=='Inactive'&&(s.emailId||'').toLowerCase()===email.toLowerCase()):[];
      (async()=>{
        let staffMatch=null,matchKind=null;
        if(candidates.length>0){
          let inputHash=null; try{inputHash=await sha256Hex(password);}catch{}
          for(const s of candidates){if(s.passwordHash&&inputHash&&s.passwordHash===inputHash){staffMatch=s;matchKind='permanent';break;}}
          if(!staffMatch){for(const s of candidates){if(s.tempPassword&&s.tempPassword===password){staffMatch=s;matchKind='temp';break;}}}
        }
        if(staffMatch){
          if(rememberMe) localStorage.setItem(STORAGE_KEYS.REMEMBER,JSON.stringify({email}));
          else localStorage.removeItem(STORAGE_KEYS.REMEMBER);
          const authRole=String(staffMatch.role||'').toLowerCase().replace(/\s+staff$/,'').replace(/\s+/g,'');
          onLogin({id:staffMatch.id,staffId:staffMatch.id,name:staffMatch.fullName||staffMatch.name,email:staffMatch.emailId,label:staffMatch.role,role:authRole,organisationId:staffMatch.orgId,officeId:staffMatch.officeId,mustChangePassword:matchKind==='temp'||Boolean(staffMatch.mustChangePassword),notificationPrefs:staffMatch.notificationPrefs||null});
          addAuditLog({userName:staffMatch.fullName||staffMatch.name||staffMatch.emailId,role:authRole,action:matchKind==='permanent'?'LOGIN_WITH_PERMANENT_PASSWORD':'LOGIN_WITH_TEMP_PASSWORD',module:'Auth',description:`${staffMatch.emailId} logged in.`,orgId:staffMatch.orgId});
          return;
        }
        const next=attempts+1; setAttempts(next);
        if(next>=5){setLocked(true);setLockTimer(900);setErrors({general:'Account locked. Try again in 15 minutes.'});}
        else{const r=5-next;setErrors({general:`Invalid Email ID or password. ${r} ${r===1?'attempt':'attempts'} remaining.`});}
      })();
    },900);
  };

  const PARTICLES=[{x:8,y:12,d:0},{x:92,y:8,d:.5},{x:15,y:88,d:1},{x:85,y:82,d:1.5},{x:45,y:5,d:.3},{x:55,y:95,d:.8},{x:3,y:50,d:1.2},{x:97,y:45,d:.7},{x:25,y:30,d:1.8},{x:75,y:70,d:.2},{x:60,y:20,d:1.1},{x:40,y:75,d:.6}];

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'Plus Jakarta Sans',sans-serif", overflow:'hidden', position:'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        @keyframes orbFloat{from{transform:translate(0,0) scale(1)}to{transform:translate(12px,-18px) scale(1.08)}}
        @keyframes particlePulse{from{opacity:.2;transform:scale(1)}to{opacity:.9;transform:scale(1.8)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(32px)}to{opacity:1;transform:translateX(0)}}
        @keyframes blink{0%,100%{border-color:transparent}50%{border-color:rgba(56,189,248,.8)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fillPop{0%{transform:scale(1)}40%{transform:scale(.96);background:#E0F2FE}100%{transform:scale(1)}}
        @keyframes gradMove{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes shimmerLine{0%{left:-60%}100%{left:160%}}
        @keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(14,165,233,.45)}70%{box-shadow:0 0 0 10px rgba(14,165,233,0)}100%{box-shadow:0 0 0 0 rgba(14,165,233,0)}}
        .inp-field{width:100%;padding:13px 14px 13px 44px;border-radius:12px;font-size:14px;border:1.5px solid #BAE6FD;background:#F0F9FF;color:#0C2340;font-family:inherit;transition:border-color .2s,box-shadow .2s,background .2s;outline:none;}
        .inp-field:focus{border-color:#0EA5E9;box-shadow:0 0 0 3.5px rgba(14,165,233,.12);background:#fff;}
        .inp-field.err{border-color:#EF4444;}
        .inp-field.err:focus{box-shadow:0 0 0 3.5px rgba(239,68,68,.12);}
        .submit-btn{width:100%;padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg,#0EA5E9,#0284C7,#0D9488);background-size:200% 200%;color:#fff;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 6px 22px rgba(14,165,233,.38);transition:transform .2s,box-shadow .2s;display:flex;align-items:center;justify-content:center;gap:10px;animation:gradMove 4s ease infinite;position:relative;overflow:hidden;}
        .submit-btn::after{content:'';position:absolute;top:0;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.13),transparent);animation:shimmerLine 2.5s ease-in-out infinite;}
        .submit-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 10px 30px rgba(14,165,233,.50);}
        .submit-btn:active:not(:disabled){transform:scale(.98);}
        .submit-btn:disabled{background:#E5E7EB;color:#9CA3AF;box-shadow:none;cursor:not-allowed;animation:none;}
        .submit-btn:disabled::after{display:none;}
        .qfill-btn{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:11px;border:1.5px solid #BAE6FD;background:#F0F9FF;cursor:pointer;font-family:inherit;transition:all .18s;text-align:left;width:100%;}
        .qfill-btn:hover{border-color:#0EA5E9;background:#E0F2FE;transform:translateX(3px);}
        .qfill-btn.active-fill{animation:fillPop .5s ease;}
        .back-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:9px;border:1.5px solid #BAE6FD;background:transparent;color:#6BA3C0;cursor:pointer;font-size:13px;font-weight:600;font-family:inherit;transition:all .2s;margin-bottom:32px;}
        .back-btn:hover{background:#E0F2FE;color:#0284C7;border-color:#7DD3FC;}
        .eye-btn{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:15px;opacity:.5;padding:4px;color:#0C2340;transition:opacity .2s;}
        .eye-btn:hover{opacity:.85;}
        .logo-g{animation:pulse-ring 2.5s cubic-bezier(.455,.03,.515,.955) infinite;}
        @media(max-width:900px){.left-panel{display:none!important;}.right-panel{padding:28px 20px!important;}}
      `}</style>

      {/* LEFT PANEL */}
      <div className="left-panel" style={{ width:'44%', background:'linear-gradient(160deg,#020D1A 0%,#0C2340 40%,#0A3060 75%,#073055 100%)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(44px,6vw,84px)', position:'relative', overflow:'hidden' }}>

        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(14,165,233,.15) 1px, transparent 1px)', backgroundSize:'26px 26px', pointerEvents:'none' }} />

        <Orb size="380px" top="-100px"  left="-80px"  delay={0}   color="#0EA5E9" />
        <Orb size="280px" top="55%"     left="60%"    delay={1.2} color="#0D9488" />
        <Orb size="220px" top="20%"     left="70%"    delay={0.6} color="#0369A1" />
        <Orb size="160px" top="80%"     left="-20px"  delay={1.8} color="#0284C7" />

        {PARTICLES.map((p,i)=>(
          <div key={i} style={{ position:'absolute', width:3, height:3, borderRadius:'50%', top:`${p.y}%`, left:`${p.x}%`, background:'rgba(56,189,248,.6)', animation:`particlePulse ${2+p.d}s ease-in-out ${p.d}s infinite alternate`, pointerEvents:'none' }} />
        ))}

        <div style={{ position:'relative', zIndex:2 }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:40, animation:'fadeUp .6s ease both' }}>
            <div className="logo-g" style={{ width:50, height:50, borderRadius:16, background:'linear-gradient(135deg,#38BDF8,#0EA5E9,#0D9488)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900, color:'#fff', fontFamily:'Outfit,sans-serif', boxShadow:'0 6px 24px rgba(14,165,233,.5)' }}>G</div>
            <div>
              <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:18, color:'#fff', letterSpacing:'-.3px' }}>CorpGMS</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', fontWeight:500 }}>Corporate Guest Management</div>
            </div>
          </div>

          {/* Headline */}
          <div style={{ animation:'fadeUp .6s .1s ease both', opacity:0, animationFillMode:'forwards' }}>
            <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(30px,3.4vw,46px)', fontWeight:900, color:'#fff', lineHeight:1.1, letterSpacing:'-1.2px', marginBottom:16 }}>
              Manage guests.<br />
              <span style={{ background:'linear-gradient(90deg,#38BDF8,#0EA5E9,#2DD4BF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                <Typewriter texts={['Effortlessly.','Intelligently.','Securely.','At scale.']} />
              </span>
            </h1>
            <p style={{ fontSize:14, color:'rgba(255,255,255,.55)', lineHeight:1.9, maxWidth:310 }}>
              One platform for walk-ins, appointments, rooms, services, and full audit trails — across every office.
            </p>
          </div>

          {/* Features */}
          <div style={{ marginTop:36, display:'flex', flexDirection:'column', gap:14, animation:'fadeUp .6s .2s ease both', opacity:0, animationFillMode:'forwards' }}>
            {[{icon:'⚡',text:'Check-in in under 30 seconds'},{icon:'🔒',text:'Role-based access & full audit trail'},{icon:'🌐',text:'Multi-office dashboard in one view'},{icon:'📊',text:'Live analytics & instant exports'}].map(f=>(
              <div key={f.text} style={{ display:'flex', alignItems:'center', gap:13 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:'rgba(14,165,233,.22)', border:'1px solid rgba(14,165,233,.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{f.icon}</div>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.65)', fontWeight:500 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{ marginTop:40, padding:'18px 20px', borderRadius:16, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', backdropFilter:'blur(12px)', animation:'fadeUp .6s .3s ease both', opacity:0, animationFillMode:'forwards' }}>
            <div style={{ display:'flex', gap:2, marginBottom:10 }}>
              {[0,1,2,3,4].map(i=><span key={i} style={{ color:'#FBBF24', fontSize:12 }}>★</span>)}
            </div>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.78)', lineHeight:1.65, fontStyle:'italic' }}>
              "CorpGMS reduced our visitor check-in time by <strong style={{ color:'#fff' }}>70%</strong>. The multi-office dashboard is a game changer."
            </p>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:10, fontWeight:500 }}>
              — Anika Reddy, Operations Lead · Infosys
            </div>
          </div>

          {/* Stats */}
          <div style={{ marginTop:36, paddingTop:24, borderTop:'1px solid rgba(255,255,255,.09)', display:'flex', gap:32, animation:'fadeUp .6s .4s ease both', opacity:0, animationFillMode:'forwards' }}>
            {[['500+','Companies'],['2M+','Visitors'],['99.9%','Uptime']].map(([v,l])=>(
              <div key={l}>
                <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:900, fontSize:22, color:'#fff' }}>{v}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.38)', fontWeight:500, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel" style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'clamp(32px,5vw,72px)', overflowY:'auto', background:'#FFFFFF', animation:'slideInRight .55s .1s ease both', opacity:0, animationFillMode:'forwards' }}>
        <div style={{ maxWidth:440, width:'100%', margin:'0 auto' }}>

          <button className="back-btn" onClick={onBackToLanding}>← Back to Home</button>

          <div style={{ marginBottom:30 }}>
            <p style={{ fontSize:11, color:'#9B99C4', fontWeight:700, textTransform:'uppercase', letterSpacing:'.12em', marginBottom:7 }}>CorpGMS · Secure Access</p>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(26px,2.8vw,34px)', fontWeight:900, color:'#0C2340', letterSpacing:'-.8px', marginBottom:8 }}>Log In to Your Account</h2>
            <p style={{ fontSize:14, color:'#4C4A7A', lineHeight:1.6 }}>Enter your credentials, or click any role below to quick-fill.</p>
          </div>

          {errors.general && (
            <div style={{ padding:'11px 15px', borderRadius:11, background:'#FEF2F2', border:'1px solid #FECACA', fontSize:13, color:'#DC2626', marginBottom:18, fontWeight:500, display:'flex', alignItems:'flex-start', gap:8 }}>
              <span style={{ flexShrink:0 }}>⚠️</span>
              <div>{errors.general}{locked&&<div style={{ fontSize:11, marginTop:4, color:'#9B1C1C' }}>Retry in: {lockTimer}s</div>}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Email ID */}
            <div style={{ marginBottom:18 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#0284C7', textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:7 }}>Email ID*</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:15, opacity:.38, pointerEvents:'none' }}>✉</span>
                <input ref={emailRef} className={`inp-field${errors.email?' err':''}`} type="email" value={email}
                  onChange={e=>{setEmail(e.target.value);setErrors(p=>({...p,email:undefined,general:undefined}));}}
                  placeholder="Enter Email ID" maxLength={120} autoComplete="email" />
              </div>
              {errors.email&&<span style={{ fontSize:12, color:'#EF4444', display:'block', marginTop:5, fontWeight:500 }}>{errors.email}</span>}
            </div>

            {/* Password */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:700, color:'#0284C7', textTransform:'uppercase', letterSpacing:'.08em', display:'block', marginBottom:7 }}>Password*</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:15, opacity:.38, pointerEvents:'none' }}>🔒</span>
                <input className={`inp-field${errors.password?' err':''}`} style={{ paddingRight:46 }}
                  type={showPass?'text':'password'} value={password}
                  onChange={e=>{setPassword(e.target.value);setErrors(p=>({...p,password:undefined,general:undefined}));}}
                  placeholder="Enter Password" maxLength={64} autoComplete="current-password" />
                <button className="eye-btn" type="button" onClick={()=>setShowPass(p=>!p)} title={showPass?'Hide password':'View password'}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password&&<span style={{ fontSize:12, color:'#EF4444', display:'block', marginTop:5, fontWeight:500 }}>{errors.password}</span>}
            </div>

            {/* Remember Me + Forgot Password */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:26 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#4C4A7A', fontWeight:500 }}>
                <input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} style={{ width:15, height:15, accentColor:'#0EA5E9', cursor:'pointer' }} />
                Remember Me
              </label>
              <a href="#" onClick={e=>e.preventDefault()} style={{ fontSize:13, color:'#0EA5E9', fontWeight:600, textDecoration:'none' }}
                onMouseEnter={e=>e.target.style.textDecoration='underline'} onMouseLeave={e=>e.target.style.textDecoration='none'}>
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="submit-btn" disabled={loading||locked}>
              {loading?(<><span style={{ width:17,height:17,border:'2px solid rgba(255,255,255,.35)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/>Logging in…</>):locked?(`⏳ Locked — wait ${lockTimer}s`):(<>🔐 Log In</>)}
            </button>
          </form>

          {/* Quick Fill */}
          <div style={{ marginTop:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ flex:1, height:1, background:'#BAE6FD' }} />
              <span style={{ fontSize:10, color:'#9B99C4', fontWeight:700, letterSpacing:'.1em', whiteSpace:'nowrap' }}>DEMO QUICK FILL</span>
              <div style={{ flex:1, height:1, background:'#BAE6FD' }} />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {ROLES.map(r=>(
                <button key={r.id} className={`qfill-btn${fillAnim===r.id?' active-fill':''}`} onClick={()=>quickFill(r)} type="button">
                  <div style={{ width:32, height:32, borderRadius:9, flexShrink:0, background:r.bg, border:`1.5px solid ${r.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{r.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#0C2340' }}>{r.label}</div>
                    <div style={{ fontSize:11, color:'#9B99C4', marginTop:1 }}>{r.email}</div>
                  </div>
                  <span style={{ fontSize:10, padding:'3px 10px', borderRadius:20, background:`${r.color}18`, color:r.color, fontWeight:800, flexShrink:0 }}>{r.badge}</span>
                  <span style={{ fontSize:11, color:'#7DD3FC', fontWeight:600, flexShrink:0 }}>Fill →</span>
                </button>
              ))}
            </div>
            <p style={{ textAlign:'center', fontSize:11, color:'#7DD3FC', marginTop:10 }}>Click any role to auto-fill credentials, then press Log In.</p>
          </div>

          <p style={{ textAlign:'center', fontSize:12, color:'#7DD3FC', marginTop:24 }}>© 2025 CorpGMS by BIZZFLY · All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}