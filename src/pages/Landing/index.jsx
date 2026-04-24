import React, { useState, useEffect, useRef, useReducer, useMemo } from 'react';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';
import ThemeToggle from '../../components/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';
import { useCollection, STORAGE_KEYS } from '../../store';
import { MOCK_ACCESS_REQUESTS } from '../../data/mockData';
import { addAuditLog } from '../../utils/auditLogger';
import { useNotificationTriggers } from '../../utils/notificationTriggers';

/* ─── colour tokens (shared) ─── */
const P       = '#0284C7';
const PL      = '#0EA5E9';
const PD      = '#0D9488';
const PBG     = '#E0F2FE';
const PBORDER = '#BAE6FD';
const DARK    = '#0C2340';
const MID     = '#4C6080';
const MUTED   = '#8AACC0';

/* ════════════════════════════════════════════════════════════════
   LOGIN MODAL — opened by every "Sign Up / Sign In" CTA
   Shows email + password + forgot-password flow.
   - superadmin@corpgms.com / 123456 → enters dashboard
   - director@corpgms.com  / 123456 → shows Director role badge
   - other valid roles → enters dashboard as that role
   ════════════════════════════════════════════════════════════════ */
const DEMO_ROLES = [
  { id:'superadmin', label:'Super Admin',   name:'Super Admin',  email:'superadmin@corpgms.com', password:'123456', icon:'🛡️', color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', badge:'Platform',  desc:'Full platform control'    },
  { id:'director',   label:'Director',      name:'Arjun Mehta',  email:'director@corpgms.com',   password:'123456', icon:'👑', color:'#0284C7', bg:'#E0F2FE', border:'#BAE6FD', badge:'Executive', desc:'Organisation owner'        },
  { id:'manager',    label:'Manager',       name:'Priya Sharma', email:'manager@corpgms.com',    password:'123456', icon:'🏢', color:'#059669', bg:'#ECFDF5', border:'#A7F3D0', badge:'Management', desc:'Operations & reporting'   },
  { id:'reception',  label:'Reception',     name:'Sara Khan',    email:'reception@corpgms.com',  password:'123456', icon:'🛎️', color:'#0891B2', bg:'#ECFEFF', border:'#A5F3FC', badge:'Front Desk', desc:'Guest check-in'           },
  { id:'service',    label:'Service Staff', name:'Rahul Patil',  email:'service@corpgms.com',    password:'123456', icon:'⚙️', color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', badge:'Operations', desc:'Pantry, AV & logistics'  },
];

const LM_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordPanel({ onBack }) {
  const [fpEmail,   setFpEmail]   = useState('');
  const [fpErr,     setFpErr]     = useState('');
  const [fpSent,    setFpSent]    = useState(false);
  const [fpBusy,    setFpBusy]    = useState(false);

  const submit = async () => {
    if (!fpEmail.trim())              { setFpErr('Email is required.'); return; }
    if (!LM_EMAIL_RE.test(fpEmail))   { setFpErr('Enter a valid email address.'); return; }
    setFpErr(''); setFpBusy(true);
    await new Promise(r => setTimeout(r, 800));
    setFpBusy(false); setFpSent(true);
  };

  const inp = (err) => ({
    width:'100%', padding:'11px 14px', borderRadius:10, fontSize:13,
    fontFamily:"'Plus Jakarta Sans',sans-serif", color: DARK, outline:'none',
    border:`1.5px solid ${err ? '#EF4444' : PBORDER}`,
    background:'#fff', transition:'border-color .2s',
  });

  return (
    <div style={{ padding:'32px 28px', display:'flex', flexDirection:'column', gap:0 }}>
      <button onClick={onBack} style={{ alignSelf:'flex-start', border:'none', background:'transparent',
        color:P, fontSize:13, fontWeight:700, cursor:'pointer', padding:0, marginBottom:20,
        display:'flex', alignItems:'center', gap:6 }}>
        ← Back to Login
      </button>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <div style={{ width:44, height:44, borderRadius:13, display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:20, background:`linear-gradient(135deg,${PL},${PD})`,
          boxShadow:`0 5px 16px ${PL}55` }}>🔑</div>
        <div>
          <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:900, color:DARK, margin:0 }}>
            Forgot Password
          </h2>
          <p style={{ fontSize:12, color:MUTED, margin:'2px 0 0' }}>We'll send reset instructions to your email</p>
        </div>
      </div>

      {fpSent ? (
        <div style={{ textAlign:'center', padding:'16px 0' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', margin:'0 auto 16px',
            background:`linear-gradient(135deg,#10B981,#059669)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 24px rgba(16,185,129,0.35)' }}>
            <svg width="28" height="28" viewBox="0 0 52 52">
              <path d="M14 27 l8 8 l16-18" fill="none" stroke="#fff" strokeWidth="5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray:60, strokeDashoffset:0 }} />
            </svg>
          </div>
          <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800, color:DARK, marginBottom:8 }}>
            Reset Link Sent!
          </h3>
          <p style={{ fontSize:13, color:MID, lineHeight:1.6, marginBottom:20 }}>
            If <strong>{fpEmail}</strong> is registered, you'll receive a reset link shortly.
          </p>
          <button onClick={onBack} style={{ padding:'11px 28px', borderRadius:11, border:'none',
            background:`linear-gradient(135deg,${PL},${PD})`, color:'#fff',
            fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:13, cursor:'pointer',
            boxShadow:`0 6px 20px ${PL}55` }}>
            Back to Login
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:800, letterSpacing:'0.06em',
              textTransform:'uppercase', color:'#64748B', marginBottom:6 }}>
              Email ID <span style={{ color:'#EF4444' }}>*</span>
            </label>
            <input
              value={fpEmail} onChange={e => { setFpEmail(e.target.value); if(fpErr) setFpErr(''); }}
              placeholder="Enter Email ID" type="email" style={inp(fpErr)}
              onFocus={e => e.target.style.borderColor = PL}
              onBlur={e  => e.target.style.borderColor = fpErr ? '#EF4444' : PBORDER}
            />
            {fpErr && <p style={{ marginTop:5, fontSize:11, fontWeight:600, color:'#EF4444' }}>{fpErr}</p>}
          </div>
          <button onClick={submit} disabled={fpBusy} style={{
            width:'100%', padding:'13px', borderRadius:11, border:'none',
            background:`linear-gradient(135deg,${PL},${PD})`, color:'#fff',
            fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:14,
            cursor: fpBusy ? 'wait' : 'pointer',
            boxShadow:`0 6px 20px ${PL}55`, opacity: fpBusy ? 0.8 : 1,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            {fpBusy ? (
              <><span style={{ width:14, height:14, border:'2px solid #fff',
                borderTopColor:'transparent', borderRadius:'50%',
                display:'inline-block', animation:'lm-spin .7s linear infinite' }} /> Sending…</>
            ) : 'Send Reset Link'}
          </button>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   REGISTRATION MODAL — opened by "Create Free Account" CTA
   Multi-step: Org Info → Admin Account → Choose Plan → Success
   ════════════════════════════════════════════════════════════════ */
const PLANS_REG = [
  { id:'starter',      label:'Starter',       price:'Free',  badge:'Free Forever', color:'#64748B', bg:'#F8FAFC', border:'#E2E8F0', icon:'🌱', features:['Up to 50 visitors/month','1 office location','Basic check-in','Email notifications'] },
  { id:'professional', label:'Professional',  price:'₹2,999',badge:'Most Popular',  color:'#0284C7', bg:'#E0F2FE', border:'#7DD3FC', icon:'🚀', features:['Unlimited visitors','Up to 5 locations','WhatsApp notifications','Analytics dashboard','Room booking','Custom badges'] },
  { id:'enterprise',   label:'Enterprise',    price:'Custom', badge:'Best Value',   color:'#7C3AED', bg:'#F5F3FF', border:'#C4B5FD', icon:'🏢', features:['Unlimited everything','Unlimited locations','Dedicated support','Custom integrations','SSO / SAML','SLA guarantee'] },
];
const INDUSTRIES = ['Technology','Finance & Banking','Healthcare','Manufacturing','Education','Retail & E-Commerce','Real Estate','Consulting','Government','Hospitality','Other'];
const ORG_SIZES  = ['1–10 employees','11–50 employees','51–200 employees','201–500 employees','501–1000 employees','1000+ employees'];
const COUNTRIES  = ['India','United States','United Kingdom','Canada','Australia','Singapore','UAE','Germany','France','Other'];

/* ── Step 1: Organization Details — defined OUTSIDE modal to prevent remount on each render ── */
const REG_INP = (err) => ({
  width:'100%', padding:'10px 13px', borderRadius:9, fontSize:13,
  fontFamily:"'Plus Jakarta Sans',sans-serif", color:DARK, outline:'none',
  border:`1.5px solid ${err ? '#EF4444' : PBORDER}`,
  background:'#FAFCFF', transition:'border-color .2s', boxSizing:'border-box',
});
const REG_SEL = (err) => ({ ...REG_INP(err), cursor:'pointer', appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238AACC0' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:32 });
const REG_LBL = { display:'block', fontSize:11, fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase', color:'#64748B', marginBottom:5 };
const ErrMsg = ({ msg }) => msg ? <p style={{ marginTop:4, fontSize:11, fontWeight:600, color:'#EF4444' }}>{msg}</p> : null;

function RegStep1({ orgName, setOrgName, orgSlug, setOrgSlug, industry, setIndustry, orgSize, setOrgSize, country, setCountry, city, setCity, address, setAddress, website, setWebsite, gstin, setGstin, errs, setErrs }) {
  return (
    <div style={{ padding:'20px 28px 24px', display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={REG_LBL}>Organization Name <span style={{color:'#EF4444'}}>*</span></label>
          <input value={orgName} onChange={e => { setOrgName(e.target.value); setErrs(v => ({...v, orgName:null})); }}
            placeholder="e.g. Acme Technologies Pvt. Ltd." style={REG_INP(errs.orgName)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.orgName?'#EF4444':PBORDER} />
          <ErrMsg msg={errs.orgName} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={REG_LBL}>Workspace URL (auto-generated)</label>
          <div style={{ display:'flex', alignItems:'center', borderRadius:9, border:`1.5px solid ${PBORDER}`, background:'#F1F5F9', overflow:'hidden' }}>
            <span style={{ padding:'10px 12px', fontSize:12, color:MUTED, borderRight:`1px solid ${PBORDER}`, whiteSpace:'nowrap', background:'#E8F0FE' }}>corpgms.com/</span>
            <input value={orgSlug} onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}
              placeholder="your-org" style={{ ...REG_INP(false), border:'none', background:'transparent', flex:1 }} />
          </div>
        </div>
        <div>
          <label style={REG_LBL}>Industry <span style={{color:'#EF4444'}}>*</span></label>
          <select value={industry} onChange={e => { setIndustry(e.target.value); setErrs(v => ({...v, industry:null})); }} style={REG_SEL(errs.industry)}>
            <option value="">Select Industry</option>
            {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
          </select>
          <ErrMsg msg={errs.industry} />
        </div>
        <div>
          <label style={REG_LBL}>Organization Size <span style={{color:'#EF4444'}}>*</span></label>
          <select value={orgSize} onChange={e => { setOrgSize(e.target.value); setErrs(v => ({...v, orgSize:null})); }} style={REG_SEL(errs.orgSize)}>
            <option value="">Select Size</option>
            {ORG_SIZES.map(s => <option key={s}>{s}</option>)}
          </select>
          <ErrMsg msg={errs.orgSize} />
        </div>
        <div>
          <label style={REG_LBL}>Country</label>
          <select value={country} onChange={e => setCountry(e.target.value)} style={REG_SEL(false)}>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={REG_LBL}>City <span style={{color:'#EF4444'}}>*</span></label>
          <input value={city} onChange={e => { setCity(e.target.value); setErrs(v => ({...v, city:null})); }}
            placeholder="e.g. Mumbai" style={REG_INP(errs.city)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.city?'#EF4444':PBORDER} />
          <ErrMsg msg={errs.city} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={REG_LBL}>Office Address</label>
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Street address, building, floor…" style={REG_INP(false)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=PBORDER} />
        </div>
        <div>
          <label style={REG_LBL}>Website</label>
          <input value={website} onChange={e => setWebsite(e.target.value)}
            placeholder="https://yourcompany.com" style={REG_INP(false)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=PBORDER} />
        </div>
        <div>
          <label style={REG_LBL}>GSTIN (optional)</label>
          <input value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5" style={REG_INP(false)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=PBORDER} />
        </div>
      </div>
    </div>
  );
}

/* ── Step 2: Admin Account — defined OUTSIDE modal ── */
function RegStep2({ firstName, setFirstName, lastName, setLastName, adminEmail, setAdminEmail, phone, setPhone, jobTitle, setJobTitle, adminPw, setAdminPw, confirmPw, setConfirmPw, showPw1, setShowPw1, showPw2, setShowPw2, agree, setAgree, errs, setErrs }) {
  return (
    <div style={{ padding:'20px 28px 24px', display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label style={REG_LBL}>First Name <span style={{color:'#EF4444'}}>*</span></label>
          <input value={firstName} onChange={e => { setFirstName(e.target.value); setErrs(v => ({...v, firstName:null})); }}
            placeholder="Arjun" style={REG_INP(errs.firstName)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.firstName?'#EF4444':PBORDER} />
          <ErrMsg msg={errs.firstName} />
        </div>
        <div>
          <label style={REG_LBL}>Last Name <span style={{color:'#EF4444'}}>*</span></label>
          <input value={lastName} onChange={e => { setLastName(e.target.value); setErrs(v => ({...v, lastName:null})); }}
            placeholder="Mehta" style={REG_INP(errs.lastName)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.lastName?'#EF4444':PBORDER} />
          <ErrMsg msg={errs.lastName} />
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={REG_LBL}>Work Email <span style={{color:'#EF4444'}}>*</span></label>
          <input value={adminEmail} onChange={e => { setAdminEmail(e.target.value); setErrs(v => ({...v, adminEmail:null})); }}
            placeholder="arjun@yourcompany.com" type="email" style={REG_INP(errs.adminEmail)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.adminEmail?'#EF4444':PBORDER} />
          <ErrMsg msg={errs.adminEmail} />
        </div>
        <div>
          <label style={REG_LBL}>Phone Number <span style={{color:'#EF4444'}}>*</span></label>
          <input value={phone} onChange={e => { setPhone(e.target.value); setErrs(v => ({...v, phone:null})); }}
            placeholder="+91 98765 43210" style={REG_INP(errs.phone)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.phone?'#EF4444':PBORDER} />
          <ErrMsg msg={errs.phone} />
        </div>
        <div>
          <label style={REG_LBL}>Job Title <span style={{color:'#EF4444'}}>*</span></label>
          <input value={jobTitle} onChange={e => { setJobTitle(e.target.value); setErrs(v => ({...v, jobTitle:null})); }}
            placeholder="e.g. IT Manager, Director" style={REG_INP(errs.jobTitle)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.jobTitle?'#EF4444':PBORDER} />
          <ErrMsg msg={errs.jobTitle} />
        </div>
        <div>
          <label style={REG_LBL}>Password <span style={{color:'#EF4444'}}>*</span></label>
          <div style={{ position:'relative' }}>
            <input value={adminPw} onChange={e => { setAdminPw(e.target.value); setErrs(v => ({...v, adminPw:null})); }}
              placeholder="Min. 8 characters" type={showPw1?'text':'password'} style={{ ...REG_INP(errs.adminPw), paddingRight:40 }}
              onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.adminPw?'#EF4444':PBORDER} />
            <button type="button" onClick={() => setShowPw1(v => !v)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', border:'none', background:'transparent', cursor:'pointer', fontSize:14, color:MUTED }}>{showPw1?'🙈':'👁️'}</button>
          </div>
          <ErrMsg msg={errs.adminPw} />
        </div>
        <div>
          <label style={REG_LBL}>Confirm Password <span style={{color:'#EF4444'}}>*</span></label>
          <div style={{ position:'relative' }}>
            <input value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setErrs(v => ({...v, confirmPw:null})); }}
              placeholder="Re-enter password" type={showPw2?'text':'password'} style={{ ...REG_INP(errs.confirmPw), paddingRight:40 }}
              onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.confirmPw?'#EF4444':PBORDER} />
            <button type="button" onClick={() => setShowPw2(v => !v)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', border:'none', background:'transparent', cursor:'pointer', fontSize:14, color:MUTED }}>{showPw2?'🙈':'👁️'}</button>
          </div>
          <ErrMsg msg={errs.confirmPw} />
        </div>
        {/* Password strength */}
        {adminPw && (
          <div style={{ gridColumn:'1/-1' }}>
            {(() => {
              const s = [adminPw.length>=8, /[A-Z]/.test(adminPw), /[0-9]/.test(adminPw), /[^A-Za-z0-9]/.test(adminPw)].filter(Boolean).length;
              const labels = ['Weak','Fair','Good','Strong'];
              const colors = ['#EF4444','#F59E0B','#3B82F6','#10B981'];
              return (
                <div>
                  <div style={{ display:'flex', gap:3, marginBottom:4 }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i<=s ? colors[s-1] : '#E2E8F0', transition:'background .3s' }} />)}
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:colors[s-1] }}>Password strength: {labels[s-1]}</span>
                </div>
              );
            })()}
          </div>
        )}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', fontSize:12, color:MID, lineHeight:1.5 }}>
            <input type="checkbox" checked={agree} onChange={e => { setAgree(e.target.checked); setErrs(v => ({...v, agree:null})); }}
              style={{ width:16, height:16, marginTop:1, accentColor:P, cursor:'pointer', flexShrink:0 }} />
            I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color:P, fontWeight:700, textDecoration:'underline', cursor:'pointer' }}>Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color:P, fontWeight:700, textDecoration:'underline', cursor:'pointer' }}>Privacy Policy</a>. I confirm I am authorized to register this organization.
          </label>
          <ErrMsg msg={errs.agree} />
        </div>
      </div>
    </div>
  );
}

function RegistrationModal({ onClose, onSuccess, onLoginAndEnter }) {
  const [step, setStep]     = useState(1); // 1=Org, 2=Admin, 3=Plan, 4=Success
  const [busy, setBusy]     = useState(false);
  const [errs, setErrs]     = useState({});
  const [selectedPlan, setSelectedPlan] = useState('professional');

  /* Step 1 — Org */
  const [orgName,     setOrgName]     = useState('');
  const [orgSlug,     setOrgSlug]     = useState('');
  const [industry,    setIndustry]    = useState('');
  const [orgSize,     setOrgSize]     = useState('');
  const [country,     setCountry]     = useState('India');
  const [city,        setCity]        = useState('');
  const [address,     setAddress]     = useState('');
  const [website,     setWebsite]     = useState('');
  const [gstin,       setGstin]       = useState('');

  /* Step 2 — Admin */
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [adminEmail,  setAdminEmail]  = useState('');
  const [phone,       setPhone]       = useState('');
  const [jobTitle,    setJobTitle]    = useState('');
  const [adminPw,     setAdminPw]     = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [showPw1,     setShowPw1]     = useState(false);
  const [showPw2,     setShowPw2]     = useState(false);
  const [agree,       setAgree]       = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', esc); };
  }, [onClose, busy]);

  // Auto-generate slug from org name
  useEffect(() => {
    setOrgSlug(orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }, [orgName]);

  const inp = (err) => ({
    width:'100%', padding:'10px 13px', borderRadius:9, fontSize:13,
    fontFamily:"'Plus Jakarta Sans',sans-serif", color:DARK, outline:'none',
    border:`1.5px solid ${err ? '#EF4444' : PBORDER}`,
    background:'#FAFCFF', transition:'border-color .2s', boxSizing:'border-box',
  });
  const sel = (err) => ({ ...inp(err), cursor:'pointer', appearance:'none', backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238AACC0' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`, backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:32 });
  const lbl = { display:'block', fontSize:11, fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase', color:'#64748B', marginBottom:5 };
  const err = (msg) => msg ? <p style={{ marginTop:4, fontSize:11, fontWeight:600, color:'#EF4444' }}>{msg}</p> : null;

  const validateStep1 = () => {
    const e = {};
    if (!orgName.trim())    e.orgName  = 'Organization name is required.';
    if (!industry)          e.industry = 'Please select your industry.';
    if (!orgSize)           e.orgSize  = 'Please select organization size.';
    if (!city.trim())       e.city     = 'City is required.';
    setErrs(e); return Object.keys(e).length === 0;
  };
  const validateStep2 = () => {
    const e = {};
    if (!firstName.trim())            e.firstName  = 'First name is required.';
    if (!lastName.trim())             e.lastName   = 'Last name is required.';
    if (!adminEmail.trim())           e.adminEmail = 'Email is required.';
    else if (!LM_EMAIL_RE.test(adminEmail)) e.adminEmail = 'Enter a valid email.';
    if (!phone.trim())                e.phone      = 'Phone number is required.';
    if (!jobTitle.trim())             e.jobTitle   = 'Job title is required.';
    if (!adminPw)                     e.adminPw    = 'Password is required.';
    else if (adminPw.length < 8)      e.adminPw    = 'Password must be at least 8 characters.';
    if (confirmPw !== adminPw)        e.confirmPw  = 'Passwords do not match.';
    if (!agree)                       e.agree      = 'You must accept the terms to continue.';
    setErrs(e); return Object.keys(e).length === 0;
  };

  const nextStep = async () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3) {
      setBusy(true);
      await new Promise(r => setTimeout(r, 1400));

      // Save new Organization — format matching MOCK_ORGANIZATIONS shape so SuperAdmin panel shows it
      const orgId = 'org-' + orgSlug + '-' + Date.now();
      const planLabels = { starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' };
      const planMrr    = { starter: 1999, professional: 4999, enterprise: 8999 };
      const now = new Date().toISOString();
      const newOrg = {
        id:          orgId,
        name:        orgName,
        slug:        orgSlug,
        industry,
        size:        orgSize,
        location:    city + ', ' + country,
        country,
        city,
        address,
        website,
        gstin,
        plan:        planLabels[selectedPlan] || 'Starter',
        planId:      selectedPlan,
        mrr:         planMrr[selectedPlan] || 0,
        status:      'Active',
        users:       1,
        adminName:    firstName + ' ' + lastName,
        adminEmail,
        adminPhone:   phone,
        adminTitle:   jobTitle,
        primaryName:  firstName + ' ' + lastName,
        primaryEmail: adminEmail,
        primaryPhone: phone,
        createdAt:   now,
        registeredAt: now,
      };

      // Save to cgms_organizations (same key SuperAdmin panel reads)
      try {
        const existingOrgs = JSON.parse(localStorage.getItem('cgms_organizations') || 'null');
        const base = Array.isArray(existingOrgs) ? existingOrgs : [];
        base.unshift(newOrg); // newest first
        localStorage.setItem('cgms_organizations', JSON.stringify(base));
      } catch(e) {}

      // Also save to cgms_registered_orgs for login lookup
      try {
        const regOrgs = JSON.parse(localStorage.getItem('cgms_registered_orgs') || '[]');
        regOrgs.push(newOrg);
        localStorage.setItem('cgms_registered_orgs', JSON.stringify(regOrgs));
      } catch(e) {}

      // Push SuperAdmin notification into cgms.notifications.v1
      try {
        const notifKey = 'cgms.notifications.v1';
        const existing = JSON.parse(localStorage.getItem(notifKey) || '[]');
        const notif = {
          id:        'notif-neworg-' + Date.now(),
          title:     'New Organisation Registered',
          message:   orgName + ' has registered on CorpGMS. Plan: ' + (planLabels[selectedPlan] || 'Starter') + '. Industry: ' + industry + '. Admin: ' + firstName + ' ' + lastName + ' (' + adminEmail + '). City: ' + city + ', ' + country + '.',
          type:      'system_alert',
          severity:  'success',
          icon:      '🏢',
          actorName: firstName + ' ' + lastName,
          roles:     ['superadmin'],
          orgId:     null,
          link:      { page: 'admin' },
          timestamp: now,
          isRead:    false,
        };
        existing.unshift(notif);
        localStorage.setItem(notifKey, JSON.stringify(existing));
        // Trigger same-tab sync so bell badge updates if SuperAdmin is logged in
        window.dispatchEvent(new Event('notifications-updated'));
      } catch(e) {}

      // Save Director user
      const newUser = { id: 'usr-' + Date.now(), staffId: 'staff-' + Date.now(), fullName: firstName + ' ' + lastName, name: firstName + ' ' + lastName, email: adminEmail, emailId: adminEmail, phone, jobTitle, password: adminPw, role: 'director', organisationId: orgId, orgId, officeId: 'all', icon: '\u{1F451}', label: 'Director', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD', badge: 'Executive', desc: 'Organisation owner', status: 'Active', createdAt: new Date().toISOString() };
      try {
        const existingUsers = JSON.parse(localStorage.getItem('cgms_registered_users') || '[]');
        existingUsers.push(newUser);
        localStorage.setItem('cgms_registered_users', JSON.stringify(existingUsers));
      } catch(e) {}

      setBusy(false);
      setStep(4);
      return;
    }
    setErrs({});
    setStep(s => s + 1);
  };

  const STEPS = ['Organization','Admin Account','Choose Plan','Done'];

  /* ── Stepper bar ── */
  const StepBar = () => (
    <div style={{ display:'flex', alignItems:'center', gap:0, padding:'18px 28px 0' }}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done    = step > n;
        const current = step === n;
        return (
          <React.Fragment key={n}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:0 }}>
              <div style={{
                width:30, height:30, borderRadius:'50%', fontSize:12, fontWeight:800,
                display:'flex', alignItems:'center', justifyContent:'center',
                background: done ? '#10B981' : current ? `linear-gradient(135deg,${PL},${PD})` : '#E2E8F0',
                color: (done || current) ? '#fff' : '#94A3B8',
                boxShadow: current ? `0 4px 12px ${PL}55` : 'none',
                transition:'all .3s',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize:10, fontWeight:700, color: current ? P : done ? '#10B981' : '#94A3B8', marginTop:4, whiteSpace:'nowrap' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex:1, height:2, background: step > n ? '#10B981' : '#E2E8F0', margin:'0 6px 18px', transition:'background .3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  /* ── Step 2: Admin Account ── */

  /* ── Step 3: Choose Plan ── */
  const Step3 = () => (
    <div style={{ padding:'20px 28px 24px' }}>
      <p style={{ fontSize:13, color:MID, marginBottom:16, lineHeight:1.5 }}>
        Choose the plan that best fits your organization. You can upgrade anytime.
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {PLANS_REG.map(plan => {
          const active = selectedPlan === plan.id;
          return (
            <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} style={{
              border:`2px solid ${active ? plan.color : '#E2E8F0'}`,
              borderRadius:12, padding:'14px 16px', cursor:'pointer',
              background: active ? plan.bg : '#FAFCFF',
              transition:'all .2s',
              boxShadow: active ? `0 4px 16px ${plan.color}22` : 'none',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:active ? 8 : 0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:22 }}>{plan.icon}</span>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:15, color:DARK }}>{plan.label}</span>
                      <span style={{ fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:20, background:plan.color, color:'#fff' }}>{plan.badge}</span>
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color:plan.color }}>{plan.price}{plan.price !== 'Free' && plan.price !== 'Custom' ? '/mo' : ''}</span>
                  </div>
                </div>
                <div style={{
                  width:20, height:20, borderRadius:'50%',
                  border:`2px solid ${active ? plan.color : '#CBD5E1'}`,
                  background: active ? plan.color : '#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0,
                }}>
                  {active && <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }} />}
                </div>
              </div>
              {active && (
                <ul style={{ margin:0, paddingLeft:16, display:'flex', flexDirection:'column', gap:3 }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize:12, color:MID, fontWeight:500 }}>
                      <span style={{ color:'#10B981', fontWeight:700, marginRight:4 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ── Step 4: Success ── */
  const Step4 = () => (
    <div style={{ padding:'36px 28px', textAlign:'center' }}>
      <div style={{ width:80, height:80, borderRadius:'50%', margin:'0 auto 20px',
        background:'linear-gradient(135deg,#10B981,#059669)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:36,
        boxShadow:'0 12px 36px rgba(16,185,129,0.38)',
        animation:'lm-pop 0.6s cubic-bezier(.2,1.4,.3,1) both' }}>
        ✅
      </div>
      <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:22, fontWeight:900, color:DARK, marginBottom:8 }}>
        Organization Created! 🎉
      </h2>
      <p style={{ fontSize:13, color:MID, lineHeight:1.7, marginBottom:20 }}>
        Welcome to <strong>CorpGMS</strong>! Your organization <strong>{orgName}</strong> has been set up successfully.<br />
        A verification email has been sent to <strong>{adminEmail}</strong>.
      </p>
      <div style={{ background:'#F0FDF4', border:'1.5px solid #A7F3D0', borderRadius:12, padding:'14px 18px', marginBottom:22, textAlign:'left' }}>
        <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#059669', marginBottom:8 }}>📋 Your Account Summary</p>
        {[
          ['Organization', orgName],
          ['Plan', PLANS_REG.find(p => p.id === selectedPlan)?.label],
          ['Admin Email', adminEmail],
          ['Workspace', `corpgms.com/${orgSlug}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:MID, marginBottom:4 }}>
            <span style={{ fontWeight:600 }}>{k}:</span>
            <span style={{ fontWeight:700, color:DARK }}>{v}</span>
          </div>
        ))}
      </div>
      <button onClick={() => {
          // Auto-login as the newly registered director
          const regUsers = JSON.parse(localStorage.getItem('cgms_registered_users') || '[]');
          const me = regUsers[regUsers.length - 1];
          if (me && onLoginAndEnter) { onLoginAndEnter({ ...me, role: 'director', id: 'director' }); }
          else if (onSuccess) { onSuccess(); } else { onClose(); }
        }} style={{
        width:'100%', padding:'13px', borderRadius:11, border:'none',
        background:`linear-gradient(135deg,${PL},${PD})`, color:'#fff',
        fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:14, cursor:'pointer',
        boxShadow:`0 6px 20px ${PL}55`,
      }}>
        🚀 Enter Dashboard
      </button>
    </div>
  );

  return (
    <div aria-modal="true" role="dialog" style={{
      position:'fixed', inset:0, zIndex:10000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
      background:'rgba(5,14,26,0.72)', backdropFilter:'blur(12px)',
    }} onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>

      <div style={{
        position:'relative', width:'100%', maxWidth: step === 3 ? 520 : 580,
        borderRadius:22, background:'#fff', overflow:'hidden',
        boxShadow:`0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px ${PBORDER}`,
        animation:'lm-in 0.4s cubic-bezier(.22,1.2,.36,1) both',
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        maxHeight:'92vh', display:'flex', flexDirection:'column',
      }}>
        {/* top gradient bar */}
        <div style={{ height:4, background:`linear-gradient(90deg,${PL},${PD},#10B981)`, flexShrink:0 }} />

        {/* Header */}
        {step < 4 && (
          <div style={{ padding:'20px 28px 0', borderBottom:`1px solid ${PBORDER}`, flexShrink:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:13,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                  background:`linear-gradient(135deg,${PL},${PD})`,
                  boxShadow:`0 5px 16px ${PL}55` }}>🏢</div>
                <div>
                  <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:900, color:DARK, margin:0 }}>
                    Create Your Organization
                  </h2>
                  <p style={{ fontSize:12, color:MUTED, margin:'2px 0 0' }}>
                    {step === 1 ? 'Tell us about your company' : step === 2 ? 'Set up your admin account' : 'Pick a plan to get started'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} disabled={busy} style={{ width:34, height:34, borderRadius:9,
                border:`1px solid ${PBORDER}`, background:PBG, cursor:'pointer',
                fontSize:18, color:MUTED, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                onMouseEnter={e=>{e.currentTarget.style.background='#FEE2E2';e.currentTarget.style.color='#DC2626';}}
                onMouseLeave={e=>{e.currentTarget.style.background=PBG;e.currentTarget.style.color=MUTED;}}>×</button>
            </div>
            <StepBar />
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ overflowY:'auto', flex:1 }}>
          {step === 1 && <RegStep1 orgName={orgName} setOrgName={setOrgName} orgSlug={orgSlug} setOrgSlug={setOrgSlug} industry={industry} setIndustry={setIndustry} orgSize={orgSize} setOrgSize={setOrgSize} country={country} setCountry={setCountry} city={city} setCity={setCity} address={address} setAddress={setAddress} website={website} setWebsite={setWebsite} gstin={gstin} setGstin={setGstin} errs={errs} setErrs={setErrs} />}
          {step === 2 && <RegStep2 firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} adminEmail={adminEmail} setAdminEmail={setAdminEmail} phone={phone} setPhone={setPhone} jobTitle={jobTitle} setJobTitle={setJobTitle} adminPw={adminPw} setAdminPw={setAdminPw} confirmPw={confirmPw} setConfirmPw={setConfirmPw} showPw1={showPw1} setShowPw1={setShowPw1} showPw2={showPw2} setShowPw2={setShowPw2} agree={agree} setAgree={setAgree} errs={errs} setErrs={setErrs} />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}
        </div>

        {/* Footer buttons */}
        {step < 4 && (
          <div style={{ padding:'14px 28px 20px', borderTop:`1px solid ${PBORDER}`, flexShrink:0,
            display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, background:'#FAFCFF' }}>
            {step > 1 ? (
              <button onClick={() => setStep(s => s-1)} disabled={busy} style={{
                padding:'11px 22px', borderRadius:10, border:`1.5px solid ${PBORDER}`,
                background:'#fff', color:DARK, fontFamily:'Outfit,sans-serif',
                fontWeight:700, fontSize:13, cursor:'pointer',
              }}>
                ← Back
              </button>
            ) : <div />}
            <button onClick={nextStep} disabled={busy} style={{
              padding:'11px 28px', borderRadius:10, border:'none',
              background:`linear-gradient(135deg,${PL},${PD})`, color:'#fff',
              fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:13,
              cursor: busy ? 'wait' : 'pointer',
              boxShadow:`0 6px 20px ${PL}44`, opacity: busy ? 0.8 : 1,
              display:'flex', alignItems:'center', gap:8,
            }}>
              {busy ? (
                <><span style={{ width:13, height:13, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', display:'inline-block', animation:'lm-spin .7s linear infinite' }} /> Creating…</>
              ) : step === 3 ? '🚀 Create Organization' : 'Continue →'}
            </button>
          </div>
        )}

        <style>{`
          @keyframes lm-in  { from{opacity:0;transform:scale(.93) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
          @keyframes lm-pop { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.15);opacity:1} 100%{transform:scale(1);opacity:1} }
          @keyframes lm-spin { to{transform:rotate(360deg)} }
        `}</style>
      </div>
    </div>
  );
}

function LoginModal({ onClose, onLoginSuccess }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [matchedRole, setMatchedRole] = useState(null); // role found after login
  const [showForgot, setShowForgot]   = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    document.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', esc); };
  }, [onClose, loading]);

  const validate = () => {
    const e = {};
    if (!email.trim())               e.email    = 'Email is required.';
    else if (!LM_EMAIL_RE.test(email)) e.email  = 'Enter a valid email address.';
    if (!password.trim())            e.password = 'Password is required.';
    else if (password.length < 6)    e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    const match = DEMO_ROLES.find(
      r => r.email.toLowerCase() === email.trim().toLowerCase() && r.password === password
    );
    if (!match) {
      setErrors({ general: 'Invalid email or password. Please try again.' });
      return;
    }
    // Show role badge briefly, then enter app
    setMatchedRole(match);
    await new Promise(r => setTimeout(r, 1200));
    onLoginSuccess({ ...match, role: match.id });
  };

  const inp = (err) => ({
    width:'100%', padding:'11px 14px', borderRadius:10, fontSize:13,
    fontFamily:"'Plus Jakarta Sans',sans-serif", color: DARK, outline:'none',
    border:`1.5px solid ${err ? '#EF4444' : PBORDER}`,
    background:'#fff', transition:'border-color .2s',
  });

  return (
    <div aria-modal="true" role="dialog" style={{
      position:'fixed', inset:0, zIndex:10000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
      background:'rgba(5,14,26,0.72)', backdropFilter:'blur(12px)',
    }} onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>

      <div style={{
        position:'relative', width:'100%', maxWidth:440,
        borderRadius:22, background:'#fff', overflow:'hidden',
        boxShadow:`0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px ${PBORDER}`,
        animation:'lm-in 0.4s cubic-bezier(.22,1.2,.36,1) both',
        fontFamily:"'Plus Jakarta Sans',sans-serif",
      }}>
        {/* top gradient bar */}
        <div style={{ height:4, background:`linear-gradient(90deg,${PL},${PD},#10B981)` }} />

        {showForgot ? (
          <ForgotPasswordPanel onBack={() => setShowForgot(false)} />
        ) : matchedRole ? (
          /* ── Role confirmation screen ── */
          <div style={{ padding:'40px 28px', textAlign:'center' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', margin:'0 auto 18px',
              background:`linear-gradient(135deg,${PL},${PD})`,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
              boxShadow:`0 12px 32px ${PL}55`, animation:'lm-pop 0.5s cubic-bezier(.2,1.4,.3,1) both' }}>
              {matchedRole.icon}
            </div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:900, color:DARK, marginBottom:6 }}>
              Welcome back!
            </h2>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'8px 18px',
              borderRadius:50, border:`1.5px solid ${matchedRole.border}`,
              background:matchedRole.bg, marginBottom:12 }}>
              <span style={{ fontSize:14 }}>{matchedRole.icon}</span>
              <span style={{ fontSize:13, fontWeight:800, color:matchedRole.color }}>{matchedRole.label}</span>
              <span style={{ fontSize:11, fontWeight:600, color:MID }}>— {matchedRole.desc}</span>
            </div>
            <p style={{ fontSize:13, color:MID, lineHeight:1.6 }}>
              Signing you in as <strong>{matchedRole.name}</strong>…
            </p>
            <div style={{ marginTop:20, display:'flex', justifyContent:'center' }}>
              <span style={{ width:20, height:20, border:`2.5px solid ${PL}`,
                borderTopColor:'transparent', borderRadius:'50%',
                display:'inline-block', animation:'lm-spin .7s linear infinite' }} />
            </div>
          </div>
        ) : (
          /* ── Main login form ── */
          <>
            {/* Header */}
            <div style={{ padding:'24px 28px 20px', borderBottom:`1px solid ${PBORDER}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:13,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                    background:`linear-gradient(135deg,${PL},${PD})`,
                    boxShadow:`0 5px 16px ${PL}55` }}>🔐</div>
                  <div>
                    <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:18, fontWeight:900, color:DARK, margin:0 }}>
                      Sign In to CorpGMS
                    </h2>
                    <p style={{ fontSize:12, color:MUTED, margin:'2px 0 0' }}>Enter your credentials to continue</p>
                  </div>
                </div>
                <button onClick={onClose} style={{ width:34, height:34, borderRadius:9,
                  border:`1px solid ${PBORDER}`, background:PBG, cursor:'pointer',
                  fontSize:18, color:MUTED, display:'flex', alignItems:'center', justifyContent:'center' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#FEE2E2';e.currentTarget.style.color='#DC2626';}}
                  onMouseLeave={e=>{e.currentTarget.style.background=PBG;e.currentTarget.style.color=MUTED;}}>×</button>
              </div>
            </div>

            {/* Form body */}
            <div style={{ padding:'24px 28px' }}>
              {errors.general && (
                <div style={{ marginBottom:16, padding:'11px 14px', borderRadius:10,
                  background:'#FEF2F2', border:'1.5px solid #FECACA',
                  fontSize:13, fontWeight:600, color:'#DC2626' }}>
                  ⚠️ {errors.general}
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:800, letterSpacing:'0.06em',
                  textTransform:'uppercase', color:'#64748B', marginBottom:6 }}>
                  Email ID <span style={{ color:'#EF4444' }}>*</span>
                </label>
                <input value={email} onChange={e => { setEmail(e.target.value); if(errors.email||errors.general) setErrors({}); }}
                  placeholder="Enter Email ID" type="email" style={inp(errors.email)}
                  onFocus={e => e.target.style.borderColor = PL}
                  onBlur={e  => e.target.style.borderColor = errors.email ? '#EF4444' : PBORDER}
                  onKeyDown={e => { if(e.key==='Enter') handleLogin(); }}
                />
                {errors.email && <p style={{ marginTop:5, fontSize:11, fontWeight:600, color:'#EF4444' }}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom:8 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:800, letterSpacing:'0.06em',
                  textTransform:'uppercase', color:'#64748B', marginBottom:6 }}>
                  Password <span style={{ color:'#EF4444' }}>*</span>
                </label>
                <div style={{ position:'relative' }}>
                  <input value={password} onChange={e => { setPassword(e.target.value); if(errors.password||errors.general) setErrors({}); }}
                    placeholder="Your password" type={showPw ? 'text' : 'password'} style={{ ...inp(errors.password), paddingRight:42 }}
                    onFocus={e => e.target.style.borderColor = PL}
                    onBlur={e  => e.target.style.borderColor = errors.password ? '#EF4444' : PBORDER}
                    onKeyDown={e => { if(e.key==='Enter') handleLogin(); }}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                      border:'none', background:'transparent', cursor:'pointer', color:MUTED, fontSize:16, padding:2 }}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                {errors.password && <p style={{ marginTop:5, fontSize:11, fontWeight:600, color:'#EF4444' }}>{errors.password}</p>}
              </div>

              {/* Forgot password link */}
              <div style={{ textAlign:'right', marginBottom:22 }}>
                <button type="button" onClick={() => setShowForgot(true)}
                  style={{ border:'none', background:'transparent', color:P,
                    fontSize:12, fontWeight:700, cursor:'pointer', padding:0 }}
                  onMouseEnter={e => e.target.style.textDecoration='underline'}
                  onMouseLeave={e => e.target.style.textDecoration='none'}>
                  Forgot Password?
                </button>
              </div>

              {/* Submit */}
              <button onClick={handleLogin} disabled={loading} style={{
                width:'100%', padding:'13px', borderRadius:11, border:'none',
                background:`linear-gradient(135deg,${PL},${PD})`, color:'#fff',
                fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:14,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow:`0 6px 20px ${PL}55`, opacity: loading ? 0.8 : 1,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                transition:'transform .2s, box-shadow .2s',
              }}
              onMouseEnter={e => { if(!loading) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 12px 30px ${PL}77`; }}}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 6px 20px ${PL}55`; }}>
                {loading ? (
                  <><span style={{ width:14, height:14, border:'2px solid #fff',
                    borderTopColor:'transparent', borderRadius:'50%',
                    display:'inline-block', animation:'lm-spin .7s linear infinite' }} /> Signing in…</>
                ) : '🔐 Sign In'}
              </button>
            </div>
          </>
        )}

        <style>{`
          @keyframes lm-in  { from{opacity:0;transform:scale(.93) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
          @keyframes lm-pop { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.15);opacity:1} 100%{transform:scale(1);opacity:1} }
          @keyframes lm-spin { to{transform:rotate(360deg)} }
        `}</style>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════════ */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, style: extraStyle = {} }) {
  const [ref, v] = useInView();
  return (
    <div ref={ref} style={{
      opacity: v ? 1 : 0, transform: v ? 'none' : 'translateY(24px)',
      transition: `opacity .6s ${delay}s cubic-bezier(.22,1,.36,1), transform .6s ${delay}s cubic-bezier(.22,1,.36,1)`,
      ...extraStyle,
    }}>{children}</div>
  );
}

function Counter({ val, suffix = '' }) {
  const [cur, setCur] = useState(0);
  const [ref, v] = useInView(0.3);
  useEffect(() => {
    if (!v) return;
    const target = parseFloat(val), dur = 1800, step = 16;
    const inc = target / (dur / step); let c = 0;
    const t = setInterval(() => { c = Math.min(c + inc, target); setCur(c); if (c >= target) clearInterval(t); }, step);
    return () => clearInterval(t);
  }, [v, val]);
  return <span ref={ref}>{Number.isInteger(parseFloat(val)) ? Math.round(cur).toLocaleString() : cur.toFixed(1)}{suffix}</span>;
}

/* ════════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ════════════════════════════════════════════════════════════════ */
export default function Landing({ onEnterApp, onLogin }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [yearly,    setYearly]    = useState(false);
  const [scrollY,   setScrollY]   = useState(0);
  const [showSignUp,    setShowSignUp]    = useState(false);
  const [showRegister,  setShowRegister]  = useState(false);
  const [toast,     setToast]     = useState(null);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const modules = [
    { icon:'📊', title:'Live Dashboard',       desc:'Real-time visitor stats, room occupancy, service alerts, and quick actions the moment you log in.',               color:'#0284C7', tag:'Core' },
    { icon:'📋', title:'Guest Log',            desc:'Complete visitor history with smart filters by type, date, and office. Export to Excel or PDF.',                 color:'#059669', tag:'Records' },
    { icon:'🚶', title:'Walk-in Check-in',     desc:'Instant registration with live photo capture, ID verification, badge printing, host notification.',              color:'#D97706', tag:'Front Desk' },
    { icon:'📅', title:'Appointments',         desc:'Pre-schedule visits with host assignment, document requirements, confirmations and auto-reminders.',             color:'#0EA5E9', tag:'Scheduling' },
    { icon:'🏢', title:'Venues & Rooms',       desc:'Manage boardrooms, conference rooms, and cabins with live availability calendar and utilisation reports.',        color:'#0891B2', tag:'Facilities' },
    { icon:'👥', title:'Team & Staff',         desc:'Role-based access for Directors, Managers, Service Staff, and Reception — module-level permissions.',           color:'#DC2626', tag:'HR' },
    { icon:'⚙️', title:'Services & Facilities',desc:'Pantry, parking, AV setup, logistics — all linked to visits, assigned to staff, fully trackable.',              color:'#0891B2', tag:'Operations' },
    { icon:'🌐', title:'Multi-Office',         desc:'Manage Dubai, Abu Dhabi, Sharjah and any number of locations from one central dashboard.',                       color:'#D97706', tag:'Enterprise' },
    { icon:'🔔', title:'Smart Notifications',  desc:'Email & WhatsApp alerts for check-ins, appointments, and service requests. Customisable templates.',            color:'#059669', tag:'Comms' },
    { icon:'📈', title:'Reports & Analytics',  desc:'Visitor trends, peak hours, office comparisons, duration tracking — export Excel, CSV, or PDF.',                color:'#0EA5E9', tag:'Insights' },
    { icon:'🛡️', title:'Security & Access',    desc:'Encrypted visitor data, full audit trails, role-based access, ID document verification, HTTPS.',                color:'#0284C7', tag:'Security' },
    { icon:'👑', title:'Super Admin Panel',    desc:'Global platform control — all organisations, subscriptions, billing, users, and system health.',                 color:'#D97706', tag:'Admin' },
  ];

  const stats = [
    { val:'500',     suffix:'+', label:'Companies Trust Us' },
    { val:'2000000', suffix:'+', label:'Visitors Managed' },
    { val:'99.9',    suffix:'%', label:'Uptime SLA' },
    { val:'4.9',     suffix:'★', label:'Customer Rating' },
  ];

  const howItWorks = [
    { step:'01', icon:'🚪', title:'Visitor Arrives',    desc:'Walk-in or pre-scheduled — reception captures details, ID, and photo in seconds.' },
    { step:'02', icon:'✅', title:'Instant Check-in',   desc:'Badge prints automatically. Host gets WhatsApp + email the moment their guest is here.' },
    { step:'03', icon:'🎯', title:'Guided Stay',        desc:'Room pre-booked. Pantry, parking, AV — all service requests handled without friction.' },
    { step:'04', icon:'📊', title:'Smooth Check-out',   desc:'Visit closed, badge returned, data secured. Full visit report available instantly.' },
  ];

  const testimonials = [
    { name:'Rajesh Sharma', role:'CTO, Infosys Ltd',                  initials:'RS', color:'#0284C7', img:'https://randomuser.me/api/portraits/men/32.jpg',
      quote:'CorpGMS transformed our visitor experience across all our campuses. Check-in time dropped from 8 minutes to under 45 seconds.' },
    { name:'Priya Menon',   role:'Operations Director, TCS India',    initials:'PM', color:'#059669', img:'https://randomuser.me/api/portraits/women/44.jpg',
      quote:'The multi-office dashboard gives us visibility across 6 locations. Separate data per office yet central oversight — exactly what we needed.' },
    { name:'Anil Kapoor',   role:'Facilities Manager, Wipro Technologies', initials:'AK', color:'#0EA5E9', img:'https://randomuser.me/api/portraits/men/65.jpg',
      quote:'WhatsApp notifications are brilliant. Hosts always know the moment their visitors arrive — zero missed meetings, zero confusion at reception desks.' },
  ];

  const btnPrimary = {
    padding:'13px 30px', fontSize:'14px', borderRadius:'11px',
    fontFamily:'Outfit,sans-serif', fontWeight:700, border:'none', cursor:'pointer',
    background:`linear-gradient(135deg,${PL},${PD})`, color:'#fff',
    boxShadow:`0 5px 18px rgba(14,165,233,0.35)`, transition:'all 0.2s',
  };
  const btnOutline = {
    padding:'13px 26px', fontSize:'14px', borderRadius:'11px',
    fontFamily:'Outfit,sans-serif', fontWeight:600, cursor:'pointer',
    border:`1.5px solid rgba(14,165,233,0.35)`, background:'transparent',
    color: P, transition:'all 0.2s',
  };

  /* ── Dark mode navbar tokens ── */
  const navBg     = isDark
    ? (scrollY > 40 ? 'rgba(3,10,18,0.97)' : 'rgba(3,10,18,0.88)')
    : (scrollY > 40 ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)');
  const navBorder = isDark
    ? (scrollY > 40 ? 'rgba(14,165,233,0.22)' : '1px solid transparent')
    : (scrollY > 40 ? `1px solid ${PBORDER}` : '1px solid transparent');
  const navShadow = isDark
    ? (scrollY > 40 ? '0 2px 24px rgba(0,0,0,0.5)' : 'none')
    : (scrollY > 40 ? '0 2px 24px rgba(14,165,233,0.08)' : 'none');
  const navLinkColor  = isDark ? '#7EB8D6' : MID;
  const navLogoTitle  = isDark ? '#BAE6FD' : DARK;
  const navLogoSub    = isDark ? 'rgba(56,189,248,0.5)' : MUTED;

  return (
    <div className="cgms-landing-page" style={{ minHeight:'100vh',
      background: isDark ? '#050E1A' : '#FFFFFF',
      overflowX:'hidden', fontFamily:"'Plus Jakarta Sans', sans-serif" }}>

      {showSignUp && (
        <LoginModal
          onClose={() => setShowSignUp(false)}
          onLoginSuccess={(role) => {
            setShowSignUp(false);
            if (onLogin) onLogin(role);
            else if (onEnterApp) onEnterApp();
          }}
        />
      )}

      {showRegister && (
        <RegistrationModal
          onClose={() => setShowRegister(false)}
          onSuccess={() => {
            setShowRegister(false);
            if (onEnterApp) onEnterApp();
          }}
          onLoginAndEnter={(userData) => {
            setShowRegister(false);
            if (onLogin) onLogin(userData);
            else if (onEnterApp) onEnterApp();
          }}
        />
      )}

      {toast && (
        <div role="status" style={{ position:'fixed', top:22, right:22, zIndex:10000,
          minWidth:280, maxWidth:380, padding:'14px 16px',
          background:'#ECFDF5', color:'#15803D', border:'1px solid #86EFAC',
          borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,0.12)',
          display:'flex', alignItems:'flex-start', gap:10, fontSize:13, fontWeight:600 }}>
          <div style={{ flex:1 }}>{toast}</div>
          <button onClick={() => setToast(null)} style={{ border:'none', background:'transparent',
            cursor:'pointer', fontSize:16, color:'#15803D' }}>×</button>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes float       { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-9px)} }
        @keyframes pulse       { 0%,100%{opacity:1}                 50%{opacity:0.35} }
        @keyframes shimmer     { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes hero-float-0 { 0%,100%{transform:translate3d(0,0,0) scale(1);opacity:.55}    50%{transform:translate3d(18px,-28px,0) scale(1.2);opacity:1} }
        @keyframes hero-float-1 { 0%,100%{transform:translate3d(0,0,0) scale(1);opacity:.5}     50%{transform:translate3d(-22px,-34px,0) scale(1.15);opacity:.95} }
        @keyframes hero-float-2 { 0%,100%{transform:translate3d(0,0,0) scale(.9);opacity:.4}    50%{transform:translate3d(10px,-42px,0) scale(1.25);opacity:.85} }
        *, *::before, *::after  { box-sizing:border-box; margin:0; padding:0; }
        @media(max-width:640px){
          .nav-links { display:none !important; }
          .hero-btns { flex-direction:column !important; align-items:stretch !important; }
          .stats-grid { grid-template-columns:repeat(2,1fr) !important; }
          .nav-signup-btn { display:none !important; }
        }
        .mod-card  { transform:translateY(0); }
        .mod-card::before {
          content:''; position:absolute; inset:-1px; border-radius:18px; padding:1px;
          pointer-events:none; opacity:0;
          background:linear-gradient(135deg,${PL},#06B6D4,#EC4899);
          -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
          -webkit-mask-composite:xor; mask-composite:exclude; transition:opacity .35s;
        }
        .mod-card:hover::before   { opacity:1; }
        .mod-card:hover           { transform:translateY(-5px) !important; box-shadow:0 16px 36px rgba(14,165,233,.12) !important; }
        .testi-card:hover         { transform:translateY(-4px); box-shadow:0 12px 30px rgba(14,165,233,.1); }
        .nav-link:hover           { color:${P} !important; background:${PBG} !important; }
        .btn-primary-lg:hover     { box-shadow:0 10px 30px rgba(14,165,233,.5) !important; transform:translateY(-2px); }
        .btn-outline-lg:hover     { background:${PBG} !important; border-color:${PL} !important; }
        .nav-signup-btn:hover     { background:${PBG} !important; border-color:${P} !important; color:${PD} !important; }
        .nav-cta-btn:hover        { box-shadow:0 8px 22px rgba(14,165,233,.5) !important; transform:translateY(-1px); }
        .scroll-top-btn           { position:fixed; bottom:28px; right:28px; z-index:990; width:44px; height:44px; border-radius:13px; border:none; cursor:pointer; background:linear-gradient(135deg,${PL},${PD}); color:#fff; font-size:18px; display:flex; align-items:center; justify-content:center; box-shadow:0 5px 18px rgba(14,165,233,.42); transition:all .2s; }
        .scroll-top-btn:hover     { transform:translateY(-3px); box-shadow:0 10px 26px rgba(14,165,233,.55); }
        .grad-text                { background:linear-gradient(135deg,${P} 0%,${PL} 50%,#0EA5E9 100%); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; animation:shimmer 4s linear infinite; }

        .hero-img-overlay         { position:absolute; inset:0; backdrop-filter:blur(1px);
                                    background:linear-gradient(to right,rgba(255,255,255,1) 0%,rgba(255,255,255,.95) 38%,rgba(255,255,255,.55) 65%,rgba(255,255,255,.05) 100%); }
        @media(max-width:768px)   { .hero-img-overlay { background:linear-gradient(to bottom,rgba(255,255,255,.15) 0%,rgba(255,255,255,.88) 48%,rgba(255,255,255,1) 100%); } }

        [data-theme="dark"] .hero-img-overlay { background:linear-gradient(to right,rgba(5,14,26,.93) 0%,rgba(5,14,26,.80) 40%,rgba(5,14,26,.55) 68%,rgba(5,14,26,.22) 100%); backdrop-filter:blur(2px); }
        @media(max-width:768px)   { [data-theme="dark"] .hero-img-overlay { background:linear-gradient(to bottom,rgba(5,14,26,.45) 0%,rgba(5,14,26,.82) 48%,rgba(5,14,26,.96) 100%); } }
        [data-theme="dark"] .btn-primary-lg:hover { box-shadow:0 12px 34px rgba(14,165,233,.55) !important; }
        [data-theme="dark"] .btn-outline-lg:hover { background:rgba(14,165,233,.14) !important; border-color:#38BDF8 !important; color:#E0F2FE !important; }

        .orb { position:absolute; border-radius:50%; background:radial-gradient(circle,rgba(14,165,233,.12) 0%,rgba(14,165,233,0) 70%); pointer-events:none; }
        .plan-card:hover { transform:translateY(-4px); }
        .how-card:hover  { border-color:${P} !important; transform:translateY(-5px); box-shadow:0 10px 30px rgba(14,165,233,.13) !important; }
        input,select,textarea { font-family:'Plus Jakarta Sans',sans-serif; }
      `}</style>

      {scrollY > 400 && (
        <button className="scroll-top-btn" onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} title="Scroll to top">↑</button>
      )}

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:998,
        padding:'0 clamp(14px,4vw,52px)', height:'66px',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px',
        background: navBg, backdropFilter:'blur(22px)',
        borderBottom: navBorder, transition:'all 0.3s ease', boxShadow: navShadow,
      }}>
        {/* accent bar — always visible in both modes */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'2.5px',
          background:`linear-gradient(90deg,${P},${PL},#0EA5E9,#06B6D4)` }} />

        {/* Logo */}
        <a href="#" style={{ display:'flex', alignItems:'center', gap:'11px', textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'11px',
            background:`linear-gradient(135deg,${PL},${PD})`, display:'flex', alignItems:'center',
            justifyContent:'center', fontWeight:900, fontSize:'16px', color:'white',
            boxShadow:`0 3px 14px rgba(14,165,233,.38)`, fontFamily:'Outfit,sans-serif' }}>G</div>
          <div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:'15px',
              color: navLogoTitle, letterSpacing:'-0.3px' }}>CorpGMS</div>
            <div style={{ fontSize:'10px', color: navLogoSub, fontWeight:500 }}>Guest Management</div>
          </div>
        </a>

        {/* Nav right */}
        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
          <div className="nav-links" style={{ display:'flex', gap:'2px' }}>
            {[['#modules','Modules'],['#how','How It Works'],['#pricing','Pricing']].map(([h,l]) => (
              <a key={h} href={h} className="nav-link" style={{ padding:'7px 13px', fontSize:'13px',
                color: navLinkColor, textDecoration:'none', borderRadius:'8px',
                transition:'all 0.2s', fontWeight:500 }}>{l}</a>
            ))}
          </div>

          {/* Sign Up button (replaces Request Access in navbar) */}
          <button className="nav-signup-btn" onClick={() => setShowSignUp(true)}
            style={{ padding:'8px 15px', borderRadius:'9px',
              border: isDark ? '1px solid rgba(14,165,233,0.3)' : `1px solid ${PBORDER}`,
              background: isDark ? 'rgba(14,165,233,0.1)' : PBG,
              color: isDark ? '#7DD3FC' : P,
              cursor:'pointer', fontSize:'13px', fontWeight:600, fontFamily:'inherit',
              transition:'all 0.2s', marginLeft:'4px' }}>✨ Sign Up</button>

          {/* Log In button */}
          <button className="nav-cta-btn" onClick={onEnterApp}
            style={{ padding:'9px 22px', borderRadius:'9px', border:'none', cursor:'pointer',
              fontFamily:'Outfit,sans-serif', fontWeight:700, fontSize:'13px',
              background:`linear-gradient(135deg,${PL},${PD})`, color:'#fff',
              boxShadow:`0 3px 14px rgba(14,165,233,.33)`, transition:'all 0.2s', marginLeft:'4px' }}>Log In</button>

          <ThemeToggle style={{ marginLeft:'8px', width:38, height:38, borderRadius:10 }} />
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', position:'relative',
        padding:'clamp(90px,14vh,130px) clamp(16px,5vw,64px) 70px', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, zIndex:0,
          backgroundImage:"url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80')",
          backgroundSize:'cover', backgroundPosition:'center 40%', backgroundRepeat:'no-repeat',
          transform:`translate3d(0,${scrollY*.25}px,0) scale(${1+Math.min(scrollY,400)*.0003})`,
          willChange:'transform' }} />
        <div className="hero-img-overlay" style={{ position:'absolute', inset:0, zIndex:1 }} />
        <div style={{ position:'absolute', inset:0, zIndex:2,
          backgroundImage:`radial-gradient(${PL}18 1px,transparent 1px)`,
          backgroundSize:'30px 30px', pointerEvents:'none' }} />
        <div className="orb" style={{ width:'600px', height:'600px', top:'-100px', right:'-60px', zIndex:2,
          transform:`translate3d(0,${scrollY*-.1}px,0)` }} />
        <div className="orb" style={{ width:'400px', height:'400px', bottom:'60px', left:'-80px', zIndex:2,
          transform:`translate3d(0,${scrollY*-.15}px,0)` }} />

        <div aria-hidden style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', overflow:'hidden' }}>
          {[{s:14,t:'12%',l:'8%',c:'#38BDF8',d:0,dur:11},{s:10,t:'22%',l:'88%',c:'#06B6D4',d:1.2,dur:9},
            {s:18,t:'55%',l:'6%',c:'#EC4899',d:.4,dur:13},{s:8,t:'68%',l:'92%',c:'#0EA5E9',d:2,dur:10},
            {s:12,t:'38%',l:'70%',c:'#0EA5E9',d:.8,dur:12},{s:6,t:'82%',l:'55%',c:'#F59E0B',d:1.6,dur:14},
            {s:16,t:'15%',l:'48%',c:'#10B981',d:2.4,dur:15}].map((p,i) => (
            <span key={i} style={{ position:'absolute', top:p.t, left:p.l, width:p.s, height:p.s, borderRadius:'50%',
              background:`radial-gradient(circle,${p.c}cc 0%,${p.c}22 60%,transparent 100%)`,
              boxShadow:`0 0 ${p.s*1.4}px ${p.c}55`,
              animation:`hero-float-${i%3} ${p.dur}s ease-in-out ${p.d}s infinite`, opacity:.8 }} />
          ))}
        </div>

        <div style={{ position:'relative', zIndex:3, maxWidth:'880px', width:'100%', margin:'0 auto', textAlign:'left' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px',
            padding:'7px 18px', borderWidth:1, borderStyle:'solid', borderRadius:'22px', marginBottom:'30px',
            fontSize:'12px', color: isDark?'#7DD3FC':P, fontWeight:700,
            borderColor: isDark?'rgba(56,189,248,0.3)':'rgba(14,165,233,0.2)',
            background: isDark?'rgba(14,165,233,0.1)':PBG,
            boxShadow: isDark?'0 2px 12px rgba(14,165,233,.25)':'0 2px 10px rgba(14,165,233,.1)',
            backdropFilter:'blur(6px)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', display:'inline-block',
              background: isDark?'#38BDF8':PL, animation:'pulse 1.6s infinite',
              boxShadow:`0 0 8px ${isDark?'#38BDF8':PL}` }} />
            Now live — WhatsApp Notifications & Multi-Office Command Centre
          </div>

          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(36px,6.5vw,70px)', fontWeight:900,
            lineHeight:1.06, marginBottom:'26px', letterSpacing:'-2px',
            color: isDark?'#E0F2FE':DARK,
            textShadow: isDark?'0 2px 24px rgba(0,0,0,.55)':'none' }}>
            The <span className="grad-text">Smarter</span> Way to<br />Manage Every Visitor
          </h1>

          <p style={{ fontSize:'clamp(15px,1.9vw,18px)', lineHeight:1.85, marginBottom:'44px',
            maxWidth:'560px', color: isDark?'#94A3B8':MID }}>
            A powerful SaaS platform for corporate offices — check-ins, appointments, rooms,
            services, and real-time analytics, all in one stunning dashboard.
          </p>

          <div className="hero-btns" style={{ display:'flex', gap:'14px', flexWrap:'wrap', marginBottom:'20px', alignItems:'center' }}>
            <button className="btn-primary-lg" onClick={() => setShowRegister(true)} style={{
              ...btnPrimary, padding:'15px 34px', fontSize:'15px', borderRadius:'12px',
              background: isDark?`linear-gradient(135deg,#38BDF8,#0284C7)`:`linear-gradient(135deg,${PL},${PD})`,
              boxShadow: isDark?'0 6px 24px rgba(14,165,233,.45)':'0 5px 18px rgba(14,165,233,.35)',
            }}>✨ Create Free Account</button>
            <a href="#pricing" style={{ ...btnOutline, padding:'15px 26px', fontSize:'15px',
              borderRadius:'12px', textDecoration:'none', display:'inline-flex', alignItems:'center',
              background: isDark?'rgba(255,255,255,.04)':'transparent',
              borderColor: isDark?'rgba(56,189,248,.45)':'rgba(14,165,233,.35)',
              color: isDark?'#7DD3FC':P }}>View Pricing</a>
          </div>
          <div style={{ marginBottom:'60px', fontSize:'14px', color: isDark?'#94A3B8':MID }}>
            Already have an account?{' '}
            <button type="button" onClick={onEnterApp} style={{ background:'transparent', border:'none', padding:0,
              color: isDark?'#38BDF8':P, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              fontSize:'14px', textDecoration:'underline', textUnderlineOffset:'3px' }}>Log In</button>
          </div>

          {/* Stats */}
          <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px',
            background: isDark?'rgba(255,255,255,.08)':PBORDER, borderRadius:'18px', overflow:'hidden',
            borderWidth:1, borderStyle:'solid', borderColor: isDark?'rgba(255,255,255,.08)':PBORDER,
            maxWidth:'620px', boxShadow: isDark?'0 10px 30px rgba(0,0,0,.4)':'0 6px 24px rgba(14,165,233,.09)',
            backdropFilter:'blur(8px)' }}>
            {stats.map(s => (
              <div key={s.label} style={{ padding:'clamp(14px,2vw,22px) 12px', textAlign:'center',
                background: isDark?'rgba(10,24,40,.85)':'#fff', position:'relative' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'2.5px',
                  background:`linear-gradient(90deg,${P},${PL})` }} />
                <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(22px,3vw,30px)', fontWeight:900,
                  marginBottom:5, color: isDark?'#F8FAFC':DARK }}>
                  <Counter val={s.val} suffix={s.suffix} />
                </div>
                <div style={{ fontSize:'11px', fontWeight:600, color: isDark?'#94A3B8':MUTED }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MODULES ─── */}
      <section id="modules" style={{ padding:'clamp(64px,9vh,108px) clamp(16px,5vw,64px)',
        maxWidth:'1320px', margin:'0 auto', background: isDark?'#050E1A':'#fff' }}>
        <FadeIn>
          <div style={{ textAlign:'center', marginBottom:'60px' }}>
            <div style={{ display:'inline-flex', padding:'5px 16px', background:PBG,
              border:`1px solid rgba(14,165,233,.2)`, borderRadius:'22px', fontSize:'11px',
              color:P, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'18px' }}>12 Powerful Modules</div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(28px,4.5vw,48px)', fontWeight:900,
              color: isDark?'#BAE6FD':DARK, marginBottom:'16px', letterSpacing:'-1px' }}>Built for Modern Enterprises</h2>
            <p style={{ fontSize:'16px', color: isDark?MUTED:MID, maxWidth:'520px', margin:'0 auto', lineHeight:1.75 }}>
              Every module designed to save time, impress visitors, and give your team total control.</p>
          </div>
        </FadeIn>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,265px),1fr))', gap:'18px' }}>
          {modules.map((m,i) => (
            <FadeIn key={m.title} delay={Math.min(i*.04,.3)}>
              <div className="mod-card" style={{ padding:'26px', borderRadius:'18px', height:'100%',
                border:`1px solid ${isDark?'#142535':PBORDER}`,
                background: isDark?'#0D1F30':'#fff',
                position:'relative', overflow:'hidden', cursor:'default', transition:'all .3s ease' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.background=isDark?`${m.color}08`:`${m.color}04`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=isDark?'#142535':PBORDER;e.currentTarget.style.background=isDark?'#0D1F30':'#fff';}}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:`${m.color}10`,
                    border:`1px solid ${m.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{m.icon}</div>
                  <span style={{ fontSize:10, fontWeight:800, padding:'3px 11px', borderRadius:20,
                    background:`${m.color}10`, color:m.color, border:`1px solid ${m.color}18`, letterSpacing:'0.04em' }}>{m.tag}</span>
                </div>
                <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:15, fontWeight:800,
                  color: isDark?'#BAE6FD':DARK, marginBottom:9 }}>{m.title}</h3>
                <p style={{ fontSize:13, color: isDark?MUTED:MID, lineHeight:1.7 }}>{m.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" style={{ padding:'clamp(64px,9vh,108px) clamp(16px,5vw,64px)',
        background: isDark?'#030A12':PBG,
        borderTop:`1px solid ${isDark?'#142535':PBORDER}`, borderBottom:`1px solid ${isDark?'#142535':PBORDER}` }}>
        <div style={{ maxWidth:'1140px', margin:'0 auto' }}>
          <FadeIn>
            <div style={{ textAlign:'center', marginBottom:'60px' }}>
              <div style={{ display:'inline-flex', padding:'5px 16px',
                background: isDark?'rgba(8,145,178,0.12)':'#E0F7F4',
                border:'1px solid rgba(8,145,178,0.2)', borderRadius:'22px', fontSize:'11px',
                color:'#0891B2', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'18px' }}>How It Works</div>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(28px,4.5vw,48px)', fontWeight:900,
                color: isDark?'#BAE6FD':DARK, marginBottom:'14px', letterSpacing:'-1px' }}>From Arrival to Check-out</h2>
              <p style={{ fontSize:'15px', color: isDark?MUTED:MID, lineHeight:1.7 }}>A smooth, professional visitor experience in 4 simple steps.</p>
            </div>
          </FadeIn>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,230px),1fr))', gap:'20px' }}>
            {howItWorks.map((s,i) => (
              <FadeIn key={s.step} delay={i*.1}>
                <div className="how-card" style={{ textAlign:'center', padding:'30px 22px', borderRadius:'18px',
                  border:`1px solid ${isDark?'#142535':PBORDER}`,
                  background: isDark?'#0D1F30':'#fff', transition:'all .3s', cursor:'default' }}>
                  <div style={{ width:56, height:56, borderRadius:18, background:`linear-gradient(135deg,${PL},${PD})`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
                    margin:'0 auto 18px', boxShadow:`0 5px 18px rgba(14,165,233,.28)` }}>{s.icon}</div>
                  <div style={{ fontSize:11, fontWeight:800, color:PL, marginBottom:9,
                    letterSpacing:'0.1em', textTransform:'uppercase' }}>Step {s.step}</div>
                  <h3 style={{ fontFamily:'Outfit,sans-serif', fontSize:16, fontWeight:800,
                    color: isDark?'#BAE6FD':DARK, marginBottom:10 }}>{s.title}</h3>
                  <p style={{ fontSize:13, color: isDark?MUTED:MID, lineHeight:1.7 }}>{s.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRODUCT MOCKUP ─── */}
      <section style={{ padding:'clamp(64px,9vh,108px) clamp(16px,5vw,64px)', maxWidth:'1140px', margin:'0 auto',
        background: isDark?'#050E1A':'#fff' }}>
        <FadeIn>
          <div style={{ textAlign:'center', marginBottom:'52px' }}>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(26px,4vw,44px)', fontWeight:900,
              color: isDark?'#BAE6FD':DARK, marginBottom:'14px', letterSpacing:'-0.8px' }}>See CorpGMS in Action</h2>
            <p style={{ color: isDark?MUTED:MID, fontSize:'16px', lineHeight:1.7 }}>One platform. Every visitor. Total control.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <div style={{ borderRadius:'22px', border:`1px solid ${isDark?'#142535':PBORDER}`,
            overflow:'hidden', background: isDark?'#0D1F30':'#fff',
            boxShadow:`0 24px 70px rgba(14,165,233,.11)` }}>
            <div style={{ padding:'10px 18px', background:`linear-gradient(135deg,${DARK},#0C3060)`,
              display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ display:'flex', gap:'7px' }}>
                {['#E53935','#F57C00','#43A047'].map(c=><div key={c} style={{ width:11, height:11, borderRadius:'50%', background:c }} />)}
              </div>
              <div style={{ flex:1, background:'rgba(255,255,255,.09)', borderRadius:7, padding:'5px 14px',
                fontSize:11, color:'#38BDF8', fontFamily:'monospace', border:`1px solid rgba(14,165,233,.2)` }}>
                app.corpgms.io/dashboard</div>
            </div>
            <div style={{ padding:'clamp(18px,3vw,28px)', background: isDark?'#071220':'#F0F9FF' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,160px),1fr))',
                gap:'13px', marginBottom:'18px' }}>
                {[{label:'Visitors Today',val:'47',color:P,icon:'🚶',tag:'+12%'},
                  {label:'Currently Inside',val:'12',color:'#059669',icon:'✅',tag:'Live'},
                  {label:'Upcoming Today',val:'8',color:'#D97706',icon:'📅',tag:'Next 2PM'},
                  {label:'Rooms Occupied',val:'5/8',color:PL,icon:'🏢',tag:'63%'}].map(c=>(
                  <div key={c.label} style={{ padding:15, borderRadius:13,
                    border:`1px solid ${isDark?'#142535':PBORDER}`,
                    background: isDark?'#0A1828':'#fff', position:'relative', overflow:'hidden', cursor:'pointer', transition:'border-color .2s' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=c.color}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=isDark?'#142535':PBORDER}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'2.5px', background:c.color }} />
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:11 }}>
                      <span style={{ fontSize:18 }}>{c.icon}</span>
                      <span style={{ fontSize:10, background:`${c.color}12`, color:c.color, padding:'2px 9px', borderRadius:10, fontWeight:800 }}>{c.tag}</span>
                    </div>
                    <div style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(24px,3vw,30px)', fontWeight:900,
                      color: isDark?'#BAE6FD':DARK, marginBottom:5 }}>{c.val}</div>
                    <div style={{ fontSize:11, color:MUTED, fontWeight:500 }}>{c.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderRadius:13, border:`1px solid ${isDark?'#142535':PBORDER}`, overflow:'hidden',
                background: isDark?'#0A1828':'#fff' }}>
                <div style={{ padding:'11px 18px', background:`linear-gradient(135deg,${DARK},#0C3060)`,
                  fontSize:12, fontWeight:800, color:'#38BDF8', textTransform:'uppercase',
                  letterSpacing:'0.07em', display:'flex', justifyContent:'space-between' }}>
                  <span>Recent Visitors</span>
                  <span style={{ color:'#34D399', animation:'pulse 2s infinite', fontSize:11 }}>● Live</span>
                </div>
                {[{name:'Ahmed Al Rashid',company:'Emirates Group',status:'Inside',color:'#059669',time:'09:15 AM',room:'Board Room A'},
                  {name:'Sarah Johnson',company:'McKinsey & Co',status:'Checked Out',color:P,time:'10:00 AM',room:'Conf. Room 1'},
                  {name:'Fatima Al Zaabi',company:'ADNOC',status:'Expected',color:'#D97706',time:'02:00 PM',room:'Board Room B'}
                ].map((v,i)=>(
                  <div key={v.name} style={{ padding:'13px 18px', display:'flex', alignItems:'center', gap:13,
                    borderTop: i>0?`1px solid ${isDark?'#142535':PBG}`:'none', transition:'background .2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=isDark?'#0A1828':PBG}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${v.color}12`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:12,
                      fontWeight:800, color:v.color, flexShrink:0, border:`1px solid ${v.color}20` }}>
                      {v.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color: isDark?'#BAE6FD':DARK,
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{v.name}</div>
                      <div style={{ fontSize:11, color:MUTED }}>{v.company} · {v.room}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20,
                        background:`${v.color}12`, color:v.color, marginBottom:3 }}>{v.status}</div>
                      <div style={{ fontSize:10, color:MUTED }}>{v.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ padding:'clamp(64px,9vh,108px) clamp(16px,5vw,64px)',
        background: isDark?'#030A12':PBG,
        borderTop:`1px solid ${isDark?'#142535':PBORDER}`, borderBottom:`1px solid ${isDark?'#142535':PBORDER}` }}>
        <div style={{ maxWidth:'1140px', margin:'0 auto' }}>
          <FadeIn>
            <div style={{ textAlign:'center', marginBottom:'52px' }}>
              <div style={{ display:'inline-flex', padding:'5px 16px',
                background: isDark?'rgba(14,165,233,0.08)':'#fff',
                border:`1px solid ${PBORDER}`, borderRadius:'22px', fontSize:11,
                color:P, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase',
                marginBottom:18, boxShadow:`0 2px 8px rgba(14,165,233,.08)` }}>Pricing</div>
              <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(28px,4.5vw,48px)', fontWeight:900,
                color: isDark?'#BAE6FD':DARK, marginBottom:14, letterSpacing:'-1px' }}>Simple, Transparent Pricing</h2>
              <p style={{ fontSize:15, color: isDark?MUTED:MID, marginBottom:32, lineHeight:1.7 }}>No hidden fees. Scale as you grow. Cancel anytime.</p>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:5,
                background: isDark?'#0A1828':'#fff', border:`1px solid ${PBORDER}`,
                borderRadius:44, boxShadow:'0 2px 10px rgba(14,165,233,.07)' }}>
                <button onClick={()=>setYearly(false)} style={{ padding:'9px 24px', borderRadius:34, border:'none',
                  cursor:'pointer', fontSize:13, fontWeight:700,
                  background: !yearly?`linear-gradient(135deg,${PL},${PD})`:'transparent',
                  color: !yearly?'white': isDark?MUTED:MID, transition:'all .25s', fontFamily:'inherit' }}>Month</button>
                <button onClick={()=>setYearly(true)} style={{ padding:'9px 24px', borderRadius:34, border:'none',
                  cursor:'pointer', fontSize:13, fontWeight:700,
                  background: yearly?`linear-gradient(135deg,${PL},${PD})`:'transparent',
                  color: yearly?'white': isDark?MUTED:MID, transition:'all .25s', fontFamily:'inherit',
                  display:'flex', alignItems:'center', gap:7 }}>
                  Year <span style={{ fontSize:10, background:'rgba(5,150,105,.12)', color:'#059669',
                    padding:'2px 9px', borderRadius:12, fontWeight:800 }}>Save 20%</span>
                </button>
              </div>
            </div>
          </FadeIn>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,305px),1fr))', gap:22, alignItems:'start' }}>
            {SUBSCRIPTION_PLANS.map((plan,i) => (
              <FadeIn key={plan.id} delay={i*.1}>
                <div className="plan-card" style={{ padding:30, borderRadius:20, position:'relative',
                  border: plan.featured?`2px solid ${P}`:`1px solid ${isDark?'#142535':PBORDER}`,
                  background: isDark?'#0D1F30':'#fff',
                  boxShadow: plan.featured?`0 16px 48px rgba(14,165,233,.17)`:`0 2px 10px rgba(14,165,233,.05)`,
                  transition:'all .3s' }}>
                  {plan.featured && (
                    <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                      fontSize:10, fontWeight:800, padding:'5px 14px',
                      background:`linear-gradient(135deg,${PL},${PD})`, color:'white',
                      borderRadius:20, letterSpacing:'0.07em', textTransform:'uppercase',
                      whiteSpace:'nowrap', boxShadow:`0 3px 12px rgba(14,165,233,.4)` }}>⭐ Most Popular</div>
                  )}
                  <div style={{ fontSize:11, fontWeight:800, color:plan.color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>{plan.name}</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:5, marginBottom:10 }}>
                    <span style={{ fontFamily:'Outfit,sans-serif', fontSize:48, fontWeight:900,
                      color: isDark?'#BAE6FD':DARK, letterSpacing:'-2px' }}>
                      ₹{Number(yearly?plan.yearlyPrice:plan.price).toLocaleString('en-IN')}</span>
                    <span style={{ fontSize:13, color:MUTED }}>per Month</span>
                  </div>
                  <p style={{ fontSize:13, color: isDark?MUTED:MID, marginBottom:22, lineHeight:1.65 }}>{plan.desc}</p>
                  <div style={{ display:'flex', gap:7, marginBottom:22, flexWrap:'wrap' }}>
                    {[plan.offices==='Unlimited'?'∞ Offices':`${plan.offices} Office${plan.offices>1?'s':''}`,
                      plan.users==='Unlimited'?'∞ Users':`${plan.users} Users`,
                      plan.visitors==='Unlimited'?'∞ Visitors':`${Number(plan.visitors).toLocaleString('en-GB')} per Month`
                    ].map(t=><span key={t} style={{ fontSize:11, background:`${plan.color}10`, color:plan.color,
                      padding:'4px 11px', borderRadius:22, border:`1px solid ${plan.color}20`, fontWeight:700 }}>{t}</span>)}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:11, marginBottom:26 }}>
                    {plan.features.map(f=>(
                      <div key={f.label} style={{ display:'flex', alignItems:'center', gap:11 }}>
                        <div style={{ width:19, height:19, borderRadius:'50%',
                          background: f.included?'rgba(5,150,105,.1)': isDark?'#071220':'#F0F9FF',
                          display:'flex', alignItems:'center', justifyContent:'center', fontSize:11,
                          color: f.included?'#059669':'#6BA3C0', flexShrink:0,
                          border:`1px solid ${f.included?'rgba(5,150,105,.22)':PBORDER}` }}>
                          {f.included?'✓':'×'}</div>
                        <span style={{ fontSize:13, color: f.included? (isDark?MUTED:MID) :'#6BA3C0' }}>{f.label}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setShowSignUp(true)} style={{ width:'100%', padding:13, fontSize:14,
                    borderRadius:11, fontFamily:'Outfit,sans-serif', fontWeight:700, cursor:'pointer',
                    ...(plan.featured
                      ? { background:`linear-gradient(135deg,${PL},${PD})`, color:'#fff', border:'none', boxShadow:`0 5px 18px rgba(14,165,233,.32)` }
                      : { background: isDark?'rgba(14,165,233,0.08)':PBG, color:P, border:`1px solid ${PBORDER}` }),
                    transition:'all .2s' }}>
                    {plan.name==='Enterprise'?'Contact Sales':'Get Started Free'}
                  </button>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding:'clamp(64px,9vh,108px) clamp(16px,5vw,64px)',
        maxWidth:'1140px', margin:'0 auto', background: isDark?'#050E1A':'#fff' }}>
        <FadeIn>
          <div style={{ textAlign:'center', marginBottom:'52px' }}>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(26px,4vw,42px)', fontWeight:900,
              color: isDark?'#BAE6FD':DARK, marginBottom:12, letterSpacing:'-0.8px' }}>Trusted by Leading Organisations</h2>
            <p style={{ fontSize:15, color: isDark?MUTED:MID, lineHeight:1.7 }}>What companies say after switching to CorpGMS.</p>
          </div>
        </FadeIn>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,305px),1fr))', gap:22 }}>
          {testimonials.map((t,i) => (
            <FadeIn key={t.name} delay={i*.1}>
              <div className="testi-card" style={{ padding:30, height:'100%', display:'flex', flexDirection:'column',
                borderRadius:18, border:`1px solid ${isDark?'#142535':PBORDER}`,
                background: isDark?'#0D1F30':'#fff', transition:'all .3s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=t.color}
                onMouseLeave={e=>e.currentTarget.style.borderColor=isDark?'#142535':PBORDER}>
                <div style={{ color:'#F59E0B', fontSize:14, letterSpacing:2, marginBottom:14 }}>★★★★★</div>
                <div style={{ fontSize:40, color:t.color, marginBottom:16, opacity:.35, lineHeight:1, fontFamily:'Georgia,serif' }}>"</div>
                <p style={{ fontSize:14, color: isDark?MUTED:MID, lineHeight:1.8, marginBottom:26, flex:1 }}>{t.quote}</p>
                <div style={{ display:'flex', alignItems:'center', gap:13, paddingTop:20,
                  borderTop:`1px solid ${isDark?'#142535':PBORDER}` }}>
                  <img src={t.img} alt={t.name}
                    onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextElementSibling.style.display='flex';}}
                    style={{ width:48, height:48, borderRadius:14, objectFit:'cover', flexShrink:0,
                      border:`2px solid ${t.color}30`, boxShadow:`0 3px 10px ${t.color}25` }} />
                  <div style={{ width:48, height:48, borderRadius:14, background:`${t.color}14`, display:'none',
                    alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800,
                    color:t.color, flexShrink:0, border:`2px solid ${t.color}20` }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color: isDark?'#BAE6FD':DARK }}>{t.name}</div>
                    <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding:'clamp(64px,11vh,128px) clamp(16px,5vw,64px)', textAlign:'center',
        position:'relative', overflow:'hidden',
        background: isDark?'#030A12':PBG,
        borderTop:`1px solid ${isDark?'#142535':PBORDER}` }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'2.5px',
          background:`linear-gradient(90deg,transparent,${P},${PL},#06B6D4,transparent)` }} />
        <div style={{ position:'absolute', top:'-80px', right:'-80px', width:340, height:340, borderRadius:'50%',
          background:`radial-gradient(circle,rgba(14,165,233,.10) 0%,transparent 70%)`, pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:260, height:260, borderRadius:'50%',
          background:`radial-gradient(circle,rgba(14,165,233,.08) 0%,transparent 70%)`, pointerEvents:'none' }} />
        <FadeIn>
          <div style={{ position:'relative', maxWidth:660, margin:'0 auto' }}>
            <div style={{ fontSize:56, marginBottom:22, display:'inline-block', animation:'float 3.2s ease infinite' }}>🚀</div>
            <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(28px,5.5vw,56px)', fontWeight:900,
              color: isDark?'#BAE6FD':DARK, marginBottom:18, lineHeight:1.07, letterSpacing:'-1.5px' }}>
              Ready to Impress<br /><span className="grad-text">Every Visitor?</span>
            </h2>
            <p style={{ fontSize:17, color: isDark?MUTED:MID, lineHeight:1.75,
              maxWidth:480, margin:'0 auto 40px' }}>Start your 14-day free trial. No credit card required.</p>
            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
              <button className="btn-primary-lg" onClick={() => setShowRegister(true)}
                style={{ ...btnPrimary, padding:'16px 38px', fontSize:16, borderRadius:13 }}>
                ✨ Create Free Account</button>
              <button className="btn-outline-lg" onClick={onEnterApp}
                style={{ ...btnOutline, padding:'16px 32px', fontSize:16, borderRadius:13,
                  color: isDark?'#7DD3FC':P,
                  borderColor: isDark?'rgba(56,189,248,.4)':'rgba(14,165,233,.35)',
                  background: isDark?'rgba(14,165,233,.05)':'transparent' }}>Log In</button>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding:'clamp(22px,3vw,36px) clamp(16px,5vw,52px)',
        borderTop:`1px solid ${isDark?'#142535':PBORDER}`,
        background: isDark?'#050E1A':'#fff' }}>
        <div style={{ maxWidth:'1140px', margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:18, marginBottom:22 }}>
            <a href="#" style={{ display:'flex', alignItems:'center', gap:11, textDecoration:'none' }}>
              <div style={{ width:32, height:32, borderRadius:9, background:`linear-gradient(135deg,${PL},${PD})`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
                fontWeight:900, color:'white', fontFamily:'Outfit,sans-serif' }}>G</div>
              <div>
                <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:14, color: isDark?'#BAE6FD':DARK }}>CorpGMS</div>
                <div style={{ fontSize:10, color:MUTED, fontWeight:500 }}>Corporate Guest Management System</div>
              </div>
            </a>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              {[['#modules','Modules'],['#how','How It Works'],['#pricing','Pricing']].map(([h,l]) => (
                <a key={h} href={h} style={{ padding:'6px 13px', fontSize:12, color:MUTED, textDecoration:'none',
                  borderRadius:8, border:`1px solid ${isDark?'#142535':PBORDER}`, transition:'all .2s', fontWeight:600 }}
                  onMouseEnter={e=>{e.target.style.color=P;e.target.style.borderColor='rgba(14,165,233,.3)';e.target.style.background=isDark?'rgba(14,165,233,.08)':PBG;}}
                  onMouseLeave={e=>{e.target.style.color=MUTED;e.target.style.borderColor=isDark?'#142535':PBORDER;e.target.style.background='transparent';}}>{l}</a>
              ))}
              <button onClick={() => setShowSignUp(true)} style={{ padding:'6px 13px', fontSize:12,
                color:P, border:`1px solid ${PBORDER}`, borderRadius:8,
                background: isDark?'rgba(14,165,233,.08)':PBG, cursor:'pointer',
                fontFamily:'inherit', fontWeight:700 }}>✨ Sign Up Free</button>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
            flexWrap:'wrap', gap:12, paddingTop:18, borderTop:`1px solid ${isDark?'#142535':PBORDER}` }}>
            <span style={{ fontSize:12, color: isDark?'#3A6480':'#C4C2DE' }}>
              © 2025 <span style={{ color:MUTED, cursor:'pointer', fontWeight:700 }}>CorpGMS by BIZZFLY</span> · All rights reserved.
            </span>
            <div style={{ display:'flex', gap:18 }}>
              {[{label:'Privacy',href:'/privacy'},{label:'Terms',href:'/terms'},
                {label:'Contact',href:'mailto:support@corpgms.com'},{label:'Status',href:'#'}].map(({label,href}) => (
                <a key={label} href={href} style={{ fontSize:12, color: isDark?'#3A6480':'#C4C2DE',
                  textDecoration:'none', transition:'color .2s', fontWeight:500 }}
                  onMouseEnter={e=>e.target.style.color=P}
                  onMouseLeave={e=>e.target.style.color=isDark?'#3A6480':'#C4C2DE'}>{label}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}