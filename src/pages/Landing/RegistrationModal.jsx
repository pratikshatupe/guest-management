import React, { useState, useEffect } from 'react';
import {
  P, PL, PD, PBG, PBORDER, DARK, MID, MUTED,
  LM_EMAIL_RE, PLANS_REG, INDUSTRIES, ORG_SIZES, COUNTRIES, CITIES_BY_COUNTRY,
  REG_INP, REG_SEL, REG_LBL, ErrMsg,
} from './landingConstants';

const ONLY_LETTERS_RE = /^[a-zA-Z0-9 .,\-&()]+$/;
const PHONE_RE        = /^[+]?[\d\s\-(). ]{7,15}$/;
const WEBSITE_RE      = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/;
const NAME_ONLY_RE    = /^[a-zA-Z\s'-]+$/;

/* ── Step 1: Organization Details — defined OUTSIDE modal to prevent remount on each render ── */
function RegStep1({ orgName, setOrgName, orgSlug, setOrgSlug, industry, setIndustry, orgSize, setOrgSize, country, setCountry, city, setCity, address, setAddress, website, setWebsite, gstin, setGstin, errs, setErrs }) {
  const cityOptions = CITIES_BY_COUNTRY[country] || ['Other'];

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    const newCities = CITIES_BY_COUNTRY[newCountry] || ['Other'];
    if (!newCities.includes(city)) setCity('');
    setErrs(v => ({ ...v, city: null }));
  };

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
          <select value={country} onChange={handleCountryChange} style={REG_SEL(false)}>
            {COUNTRIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={REG_LBL}>City <span style={{color:'#EF4444'}}>*</span></label>
          <select value={city} onChange={e => { setCity(e.target.value); setErrs(v => ({...v, city:null})); }} style={REG_SEL(errs.city)}>
            <option value="">Select City</option>
            {cityOptions.map(c => <option key={c}>{c}</option>)}
          </select>
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
          <input value={website} onChange={e => { setWebsite(e.target.value); setErrs(v => ({...v, website:null})); }}
            placeholder="https://yourcompany.com" style={REG_INP(errs.website)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.website?'#EF4444':PBORDER} />
          <ErrMsg msg={errs.website} />
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
          <input value={firstName}
            onChange={e => {
              const v = e.target.value;
              if (/^[a-zA-Z\s'-]*$/.test(v) || v === '') {
                setFirstName(v);
                setErrs(p => ({ ...p, firstName: null }));
              }
            }}
            placeholder="Arjun" style={REG_INP(errs.firstName)}
            onFocus={e => e.target.style.borderColor=PL} onBlur={e => e.target.style.borderColor=errs.firstName?'#EF4444':PBORDER} />
          <ErrMsg msg={errs.firstName} />
        </div>
        <div>
          <label style={REG_LBL}>Last Name <span style={{color:'#EF4444'}}>*</span></label>
          <input value={lastName}
            onChange={e => {
              const v = e.target.value;
              if (/^[a-zA-Z\s'-]*$/.test(v) || v === '') {
                setLastName(v);
                setErrs(p => ({ ...p, lastName: null }));
              }
            }}
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

export default function RegistrationModal({ onClose, onSuccess, onLoginAndEnter }) {
  const [step, setStep]     = useState(1);
  const [busy, setBusy]     = useState(false);
  const [errs, setErrs]     = useState({});
  const [selectedPlan, setSelectedPlan] = useState('professional');

  const [orgName,     setOrgName]     = useState('');
  const [orgSlug,     setOrgSlug]     = useState('');
  const [industry,    setIndustry]    = useState('');
  const [orgSize,     setOrgSize]     = useState('');
  const [country,     setCountry]     = useState('India');
  const [city,        setCity]        = useState('');
  const [address,     setAddress]     = useState('');
  const [website,     setWebsite]     = useState('');
  const [gstin,       setGstin]       = useState('');

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

  useEffect(() => {
    setOrgSlug(orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }, [orgName]);

  const isOrgNameTaken = (name) => {
    try {
      const norm = name.trim().toLowerCase();
      const DEMOS = ['acme technologies', 'acme', 'corpgms'];
      if (DEMOS.includes(norm)) return true;
      const a = JSON.parse(localStorage.getItem('cgms_organizations') || '[]');
      const b = JSON.parse(localStorage.getItem('cgms_registered_orgs') || '[]');
      return [...a, ...b].some(o => (o.name || '').trim().toLowerCase() === norm);
    } catch { return false; }
  };

  const isEmailTaken = (email) => {
    try {
      const norm = email.trim().toLowerCase();
      const DEMOS = ['superadmin@corpgms.com','director@corpgms.com','manager@corpgms.com',
                     'reception@corpgms.com','service@corpgms.com'];
      if (DEMOS.includes(norm)) return true;
      const users = JSON.parse(localStorage.getItem('cgms_registered_users') || '[]');
      return users.some(u => (u.email || u.emailId || '').trim().toLowerCase() === norm);
    } catch { return false; }
  };

  const validateStep1 = () => {
    const e = {};
    if (!orgName.trim())
      e.orgName = 'Organization name is required.';
    else if (orgName.trim().length < 3)
      e.orgName = 'Organization name must be at least 3 characters.';
    else if (!ONLY_LETTERS_RE.test(orgName.trim()))
      e.orgName = 'Organization name cannot start with numbers or special characters.';
    else if (isOrgNameTaken(orgName))
      e.orgName = 'This organization name is already registered. Please use a unique name.';

    if (!industry)  e.industry = 'Please select your industry.';
    if (!orgSize)   e.orgSize  = 'Please select organization size.';
    if (!city)      e.city     = 'Please select your city.';

    if (website && !WEBSITE_RE.test(website.trim()))
      e.website = 'Please enter a valid website URL (e.g. https://yourcompany.com).';

    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};

    if (!firstName.trim())
      e.firstName = 'First name is required.';
    else if (!NAME_ONLY_RE.test(firstName.trim()))
      e.firstName = 'First name must contain letters only — no numbers or symbols.';

    if (!lastName.trim())
      e.lastName = 'Last name is required.';
    else if (!NAME_ONLY_RE.test(lastName.trim()))
      e.lastName = 'Last name must contain letters only — no numbers or symbols.';

    if (!adminEmail.trim())
      e.adminEmail = 'Email is required.';
    else if (!LM_EMAIL_RE.test(adminEmail))
      e.adminEmail = 'Enter a valid email address.';
    else if (isEmailTaken(adminEmail))
      e.adminEmail = 'This email is already registered. Please use a different email.';

    if (!phone.trim())
      e.phone = 'Phone number is required.';
    else if (!PHONE_RE.test(phone.trim()))
      e.phone = 'Enter a valid phone number (7–15 digits).';

    if (!jobTitle.trim())
      e.jobTitle = 'Job title is required.';
    else if (/^\d/.test(jobTitle.trim()))
      e.jobTitle = 'Job title must not start with a number.';

    if (!adminPw)
      e.adminPw = 'Password is required.';
    else if (adminPw.length < 8)
      e.adminPw = 'Password must be at least 8 characters.';

    if (!confirmPw)
      e.confirmPw = 'Please confirm your password.';
    else if (confirmPw !== adminPw)
      e.confirmPw = 'Passwords do not match.';

    if (!agree) e.agree = 'You must accept the terms to continue.';

    setErrs(e);
    return Object.keys(e).length === 0;
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
        base.unshift(newOrg);
        localStorage.setItem('cgms_organizations', JSON.stringify(base));
      } catch(e) {}

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
        window.dispatchEvent(new Event('notifications-updated'));
      } catch(e) {}

      // Create default Head Office so Staff/Appointments work immediately
      const officeId = 'OFC-' + orgId;
      const newOffice = {
        id: officeId,
        orgId: orgId,
        name: orgName + ' - Head Office',
        code: orgSlug.toUpperCase().slice(0, 6) + '-HQ',
        type: 'HQ',
        status: 'Active',
        address: { line1: address || '–', city, country, state: '', postalCode: '' },
        contact: { contactNumber: phone, emailId: adminEmail, managerName: firstName + ' ' + lastName },
        operations: {
          openTime: '09:00', closeTime: '18:00',
          workingDays: ['Mon','Tue','Wed','Thu','Fri'],
          timezone: country === 'India' ? 'Asia/Kolkata' : 'UTC',
          maxCapacity: 100,
        },
        createdAt: now,
      };
      try {
        const existingOffices = JSON.parse(localStorage.getItem('cgms_offices_v2') || '[]');
        existingOffices.push(newOffice);
        localStorage.setItem('cgms_offices_v2', JSON.stringify(existingOffices));
      } catch(e) {}

      const newUser = {
        id: 'usr-' + Date.now(),
        staffId: 'staff-' + Date.now(),
        fullName: firstName + ' ' + lastName,
        name: firstName + ' ' + lastName,
        email: adminEmail,
        emailId: adminEmail,
        phone,
        jobTitle,
        password: adminPw,
        role: 'director',
        organisationId: orgId,
        orgId,
        officeId,
        icon: '\u{1F451}',
        label: 'Director',
        color: '#5a4bd1',
        bg: '#eef2f9',
        border: '#e9e4ff',
        badge: 'Executive',
        desc: 'Organisation owner',
        status: 'Active',
        createdAt: new Date().toISOString(),
      };
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
        <div style={{ height:4, background:`linear-gradient(90deg,${PL},${PD},#10B981)`, flexShrink:0 }} />

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

        <div style={{ overflowY:'auto', flex:1 }}>
          {step === 1 && <RegStep1 orgName={orgName} setOrgName={setOrgName} orgSlug={orgSlug} setOrgSlug={setOrgSlug} industry={industry} setIndustry={setIndustry} orgSize={orgSize} setOrgSize={setOrgSize} country={country} setCountry={setCountry} city={city} setCity={setCity} address={address} setAddress={setAddress} website={website} setWebsite={setWebsite} gstin={gstin} setGstin={setGstin} errs={errs} setErrs={setErrs} />}
          {step === 2 && <RegStep2 firstName={firstName} setFirstName={setFirstName} lastName={lastName} setLastName={setLastName} adminEmail={adminEmail} setAdminEmail={setAdminEmail} phone={phone} setPhone={setPhone} jobTitle={jobTitle} setJobTitle={setJobTitle} adminPw={adminPw} setAdminPw={setAdminPw} confirmPw={confirmPw} setConfirmPw={setConfirmPw} showPw1={showPw1} setShowPw1={setShowPw1} showPw2={showPw2} setShowPw2={setShowPw2} agree={agree} setAgree={setAgree} errs={errs} setErrs={setErrs} />}
          {step === 3 && <Step3 />}
          {step === 4 && <Step4 />}
        </div>

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
