import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { safeGet, safeSet, isoNow } from '../../../utils/storage';
import Stepper from './Stepper';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import StepThree from './StepThree';
import SuccessScreen from './SuccessScreen';

const PL = '#0EA5E9';
const PD = '#0D9488';
const PBORDER = '#BAE6FD';
const PBG = '#E0F2FE';
const DARK = '#0C2340';
const MUTED = '#9B99C4';

const OFFICE_REQUESTS_KEY = 'office_requests';

const STEPS = [
  { label: 'Company' },
  { label: 'Admin' },
  { label: 'Office' },
];

const INITIAL = {
  company: { name: '', industry: '', size: '', website: '' },
  admin: { name: '', email: '', phone: '', password: '', confirmPassword: '' },
  office: { name: '', country: '', city: '', address: '', floors: '', rooms: '' },
};

function reducer(state, action) {
  switch (action.type) {
    case 'field':
      return { ...state, [action.section]: { ...state[action.section], [action.key]: action.value } };
    case 'reset':
      return INITIAL;
    default:
      return state;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;

function validateStep(step, state) {
  const e = {};
  if (step === 1) {
    const { name, industry, size, website } = state.company;
    if (!name.trim()) e.name = 'Company Name is required.';
    if (!industry) e.industry = 'Please choose an industry.';
    if (!size) e.size = 'Please choose a company size.';
    if (website && !URL_RE.test(website.trim())) e.website = 'Please enter a valid URL.';
  } else if (step === 2) {
    const { name, email, phone, password, confirmPassword } = state.admin;
    if (!name.trim()) e.name = 'Full Name is required.';
    if (!email.trim()) e.email = 'Email ID is required.';
    else if (!EMAIL_RE.test(email)) e.email = 'Please enter a valid Email ID.';
    if (!phone.trim()) e.phone = 'Contact Number is required.';
    else if (phone.replace(/\D/g, '').length < 7) e.phone = 'Please enter a valid Contact Number.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!confirmPassword) e.confirmPassword = 'Please confirm password.';
    else if (password && password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
  } else if (step === 3) {
    const { name, country, city, address, floors, rooms } = state.office;
    if (!name.trim()) e.name = 'Office Name is required.';
    if (!country) e.country = 'Please choose a country.';
    if (!city.trim()) e.city = 'City is required.';
    if (!address.trim()) e.address = 'Address is required.';
    if (floors && Number(floors) < 1) e.floors = 'Floors must be at least 1.';
    if (rooms && Number(rooms) < 0) e.rooms = 'Rooms cannot be negative.';
  }
  return e;
}

export default function RegisterOfficeModal({ onClose, onToast, onContinueToLogin }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Lock page scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Esc to close
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const sectionOfStep = { 1: 'company', 2: 'admin', 3: 'office' };
  const currentSection = sectionOfStep[step];

  const onChange = (key, value) => {
    dispatch({ type: 'field', section: currentSection, key, value });
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const next = () => {
    const e = validateStep(step, state);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setDirection(1);
    setStep(s => Math.min(STEPS.length, s + 1));
  };

  const back = () => {
    setErrors({});
    setDirection(-1);
    setStep(s => Math.max(1, s - 1));
  };

  const submit = () => {
    if (submitting) return;
    const e = validateStep(3, state);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);

    // Don't persist plaintext password; keep the rest.
    const { password, confirmPassword, ...safeAdmin } = state.admin;
    const record = {
      id: Date.now(),
      createdAt: isoNow(),
      status: 'pending',
      company: state.company,
      admin: safeAdmin,
      office: state.office,
    };

    const list = safeGet(OFFICE_REQUESTS_KEY, []);
    safeSet(OFFICE_REQUESTS_KEY, [record, ...(Array.isArray(list) ? list : [])]);

    // Simulate brief async for the nice button state
    setTimeout(() => {
      setDone(true);
      setSubmitting(false);
      onToast && onToast(`Request submitted for ${state.company.name}`);
    }, 650);
  };

  const isLast = step === STEPS.length;

  const stepContent = useMemo(() => {
    const common = { errors, onChange };
    if (step === 1) return <StepOne data={state.company} {...common} />;
    if (step === 2) return <StepTwo data={state.admin} {...common} />;
    return <StepThree data={state.office} {...common} />;
  }, [step, state, errors]);

  return (
    <div
      aria-modal='true'
      role='dialog'
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'ro-backdrop-in 0.3s ease both',
      }}
    >
      {/* Backdrop with glassmorphism */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(30,15,80,0.55), rgba(10,5,40,0.75))',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: '620px',
          maxHeight: '94vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          borderRadius: '22px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.94))',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          boxShadow: `0 30px 80px rgba(40,10,120,0.35), 0 0 0 1px ${PBORDER}`,
          animation: 'ro-modal-in 0.45s cubic-bezier(.22,1.2,.36,1) both',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Gradient border accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: `linear-gradient(90deg, ${PL}, ${PD}, #0EA5E9, #06B6D4)`,
          borderRadius: '22px 22px 0 0',
        }} />

        {/* Scrollable inner */}
        <div style={{ overflowY: 'auto', padding: '30px 30px 26px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: `linear-gradient(135deg, ${PL}, ${PD})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', boxShadow: `0 6px 18px ${PL}55`,
              }}>🏢</div>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '19px', fontWeight: 800, color: DARK, margin: 0, letterSpacing: '-0.3px' }}>
                  {done ? 'All set!' : 'Register Your Office'}
                </h2>
                <p style={{ fontSize: '12px', color: MUTED, margin: '2px 0 0' }}>
                  {done ? 'Your request is in the queue.' : 'A few quick steps to get your workspace live.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label='Close'
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                border: `1px solid ${PBORDER}`, background: PBG, color: MUTED,
                cursor: 'pointer', fontSize: '18px', lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FCA5A5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = PBG; e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = PBORDER; }}
            >×</button>
          </div>

          {done ? (
            <SuccessScreen
              onClose={onClose}
              onContinue={onContinueToLogin ? () => { onClose(); onContinueToLogin(); } : undefined}
              companyName={state.company.name}
            />
          ) : (
            <>
              <Stepper steps={STEPS} current={step} />

              {/* Step content with slide transition (keyed) */}
              <div style={{ position: 'relative', minHeight: '290px' }}>
                <div
                  key={step}
                  style={{
                    animation: `${direction > 0 ? 'ro-slide-in-right' : 'ro-slide-in-left'} 0.38s cubic-bezier(.22,1,.36,1) both`,
                  }}
                >
                  {stepContent}
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex', gap: '12px', marginTop: '26px',
                paddingTop: '20px', borderTop: `1px solid ${PBORDER}`,
                alignItems: 'center', flexWrap: 'wrap',
              }}>
                {step > 1 ? (
                  <button
                    onClick={back}
                    disabled={submitting}
                    style={{
                      padding: '13px 22px', borderRadius: '11px',
                      border: `1px solid ${PBORDER}`, background: PBG, color: '#0284C7',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (!submitting) { e.currentTarget.style.background = '#E0F2FE'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = PBG; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    ← Back
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    style={{
                      padding: '13px 22px', borderRadius: '11px',
                      border: `1px solid ${PBORDER}`, background: '#fff', color: MUTED,
                      cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                  >
                    Cancel
                  </button>
                )}

                <div style={{ fontSize: '11px', color: MUTED, marginLeft: 'auto', fontWeight: 600 }}>
                  Step {step} of {STEPS.length}
                </div>

                <button
                  onClick={isLast ? submit : next}
                  disabled={submitting}
                  className='ro-cta'
                  style={{
                    padding: '13px 28px', borderRadius: '12px', border: 'none',
                    background: `linear-gradient(135deg, ${PL}, ${PD})`, color: '#fff',
                    cursor: submitting ? 'wait' : 'pointer',
                    opacity: submitting ? 0.75 : 1,
                    fontSize: '13px', fontWeight: 800,
                    fontFamily: 'Outfit, sans-serif', letterSpacing: '0.02em',
                    boxShadow: `0 8px 22px ${PL}55`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    minWidth: '150px',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                  onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 14px 32px ${PL}77`; } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 22px ${PL}55`; }}
                >
                  {submitting ? (
                    <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'ro-spin 0.7s linear infinite' }} /> Submitting…</>
                  ) : isLast ? (
                    <>✓ Submit Request</>
                  ) : (
                    <>Continue →</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Local keyframes */}
        <style>{`
          @keyframes ro-backdrop-in { from { opacity: 0 } to { opacity: 1 } }
          @keyframes ro-modal-in {
            from { opacity: 0; transform: scale(0.94) translateY(18px); filter: blur(4px); }
            to   { opacity: 1; transform: scale(1) translateY(0);      filter: blur(0);   }
          }
          @keyframes ro-slide-in-right {
            from { opacity: 0; transform: translateX(32px); }
            to   { opacity: 1; transform: translateX(0);    }
          }
          @keyframes ro-slide-in-left {
            from { opacity: 0; transform: translateX(-32px); }
            to   { opacity: 1; transform: translateX(0);    }
          }
          @keyframes ro-err-in {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
          @keyframes ro-spin { to { transform: rotate(360deg); } }
          @keyframes ro-check-pop {
            0%   { transform: scale(0);   opacity: 0; }
            60%  { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1);   opacity: 1; }
          }
          @keyframes ro-check-draw { to { stroke-dashoffset: 0; } }
          @keyframes ro-fade-up {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0);   }
          }
          @keyframes ro-confetti {
            0%   { opacity: 0; transform: translateY(0) scale(0.5); }
            30%  { opacity: 1; }
            100% { opacity: 0; transform: translateY(-70px) scale(1.1) rotate(200deg); }
          }
          @media (max-width: 560px) {
            .ro-cta { min-width: 0 !important; flex: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
