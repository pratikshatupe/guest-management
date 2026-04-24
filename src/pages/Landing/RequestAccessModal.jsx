import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2, Globe2, Mail, Phone, Users, Briefcase, User, MapPin,
  FileText, Megaphone, MessageSquare, X, Loader2, CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import {
  validateOrgName, validateBusinessEmail, validateFullName,
  validatePhone, validateGSTIndia, validateTradeLicenseUAE,
  validateRequired, DIAL_CODES,
} from '../../utils/requestValidation';
import { addAuditLog } from '../../utils/auditLogger';
import { useNotificationTriggers } from '../../utils/notificationTriggers';
import { useCollection, STORAGE_KEYS } from '../../store';
import { MOCK_ACCESS_REQUESTS } from '../../data/mockData';

/**
 * RequestAccessModal — public landing-page form that captures a B2B
 * lead and writes it to the ACCESS_REQUESTS store. The Super Admin
 * reviews each entry from the Access Requests inbox and either
 * approves (which opens the AddOrgDrawer pre-filled) or rejects.
 *
 * No instant signup, no auto-account creation. This is the gated B2B
 * onboarding flow per the project's business-model decision.
 *
 * The form is inline-styled to match the Landing page (which itself
 * is inline-styled), but the success view uses Tailwind-style classes
 * since by then the user is in a generic confirmation panel that
 * lives inside the same modal shell.
 */

const COUNTRIES = [
  { value: 'India',                  label: 'India',                  code: 'IN', flag: '🇮🇳' },
  { value: 'United Arab Emirates',   label: 'United Arab Emirates',   code: 'AE', flag: '🇦🇪' },
  { value: 'Saudi Arabia',           label: 'Saudi Arabia',           code: 'SA', flag: '🇸🇦' },
  { value: 'United Kingdom',         label: 'United Kingdom',         code: 'GB', flag: '🇬🇧' },
  { value: 'Qatar',                  label: 'Qatar',                  code: 'QA', flag: '🇶🇦' },
  { value: 'Oman',                   label: 'Oman',                   code: 'OM', flag: '🇴🇲' },
  { value: 'Kuwait',                 label: 'Kuwait',                 code: 'KW', flag: '🇰🇼' },
  { value: 'Bahrain',                label: 'Bahrain',                code: 'BH', flag: '🇧🇭' },
  { value: 'Other',                  label: 'Other',                  code: 'OT', flag: '🌍' },
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '200+'];

const INDUSTRIES = [
  'Retail', 'IT/Software', 'Manufacturing', 'Healthcare',
  'Education', 'Hospitality', 'Real Estate', 'Finance',
  'Logistics', 'Other',
];

const LEAD_SOURCES = [
  'Google Search', 'Social Media', 'Referral', 'Event', 'Other',
];

const MAX_MESSAGE = 500;

/* Generate the next REQ-YYYY-##### id by inspecting the existing
   collection. Stable enough for a mock store; production replaces
   with a backend-issued id. */
function nextRequestId(existing) {
  const year = new Date().getFullYear();
  const prefix = `REQ-${year}-`;
  const max = existing
    .filter((r) => typeof r?.id === 'string' && r.id.startsWith(prefix))
    .map((r) => Number(r.id.slice(prefix.length)) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  const next = String(max + 1).padStart(5, '0');
  return `${prefix}${next}`;
}

export default function RequestAccessModal({ onClose, onSubmitted }) {
  const [requests, addRequest] = useCollection(
    STORAGE_KEYS.ACCESS_REQUESTS,
    MOCK_ACCESS_REQUESTS,
  );
  const { fireSystemAlert } = useNotificationTriggers();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(null);  /* { id } when done */
  const firstFieldRef = useRef(null);
  const dialogRef     = useRef(null);

  /* Form state. Country defaults to UAE since the marketing site is
     positioned there, but the dropdown is required so the user must
     consciously select. */
  const [form, setForm] = useState({
    orgName:       '',
    country:       '',
    businessEmail: '',
    countryCode:   'AE',
    contactNumber: '',
    companySize:   '',
    industry:      '',
    fullName:      '',
    designation:   '',
    city:          '',
    gstOrLicense:  '',
    leadSource:    '',
    message:       '',
    consent:       false,
  });
  const [errors, setErrors] = useState({});

  /* Keep the dial-code in sync with the country picker so the user
     does not need to flip two dropdowns when changing nationality. */
  useEffect(() => {
    if (!form.country) return;
    const c = COUNTRIES.find((x) => x.value === form.country);
    if (c && DIAL_CODES[c.code] && c.code !== form.countryCode) {
      setForm((f) => ({ ...f, countryCode: c.code }));
    }
  }, [form.country]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Lock body scroll, focus first field, close on Escape. */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 30);
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, submitting]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[key];
        return next;
      });
    }
  };

  /* Tax-ID label/validator swap: India → GST, UAE → Trade License,
     anything else → optional free text with no validation. */
  const taxIdConfig = useMemo(() => {
    if (form.country === 'India') {
      return {
        label:       'GST Number',
        placeholder: 'Enter GST Number (e.g. 27AABCS1234N1Z2)',
        required:    true,
        validate:    validateGSTIndia,
      };
    }
    if (form.country === 'United Arab Emirates') {
      return {
        label:       'Trade License Number',
        placeholder: 'Enter Trade License Number',
        required:    true,
        validate:    validateTradeLicenseUAE,
      };
    }
    return {
      label:       'Tax / Registration Number',
      placeholder: 'Enter tax or registration number (optional)',
      required:    false,
      validate:    null,
    };
  }, [form.country]);

  const validateAll = () => {
    const e = {};
    const checks = [
      ['orgName',       validateOrgName(form.orgName)],
      ['country',       validateRequired(form.country, 'Country')],
      ['businessEmail', validateBusinessEmail(form.businessEmail)],
      ['contactNumber', validatePhone(form.contactNumber, form.countryCode)],
      ['companySize',   validateRequired(form.companySize, 'Company Size')],
      ['fullName',      validateFullName(form.fullName)],
      ['designation',   validateRequired(form.designation, 'Designation')],
    ];
    if (taxIdConfig.required) {
      checks.push(['gstOrLicense', taxIdConfig.validate(form.gstOrLicense)]);
    }
    for (const [field, res] of checks) {
      if (!res.valid) e[field] = res.reason;
    }
    if ((form.message || '').length > MAX_MESSAGE) {
      e.message = `Message must be ${MAX_MESSAGE} characters or fewer.`;
    }
    if (!form.consent) {
      e.consent = 'You must accept the Terms of Service and Privacy Policy to continue.';
    }
    return e;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const e = validateAll();
    if (Object.keys(e).length) {
      setErrors(e);
      /* Scroll to the first error so the user notices it. */
      const firstKey = Object.keys(e)[0];
      window.setTimeout(() => {
        const el = dialogRef.current?.querySelector(`[data-field="${firstKey}"]`);
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 0);
      return;
    }
    setSubmitting(true);
    /* Simulate a server call so the success state only fires after a
       confirmed save — matches the QA rule "success message fires only
       after server confirms". */
    await new Promise((r) => setTimeout(r, 700));

    const id = nextRequestId(requests || []);
    const record = {
      id,
      status:        'Pending',
      submittedAt:   Date.now(),
      orgName:       form.orgName.trim(),
      country:       form.country,
      companySize:   form.companySize,
      industry:      form.industry || '',
      businessEmail: form.businessEmail.trim(),
      countryCode:   form.countryCode,
      contactNumber: form.contactNumber.replace(/[^0-9]/g, ''),
      gstOrLicense:  (form.gstOrLicense || '').trim(),
      ownerName:     form.fullName.trim(),
      designation:   form.designation.trim(),
      city:          (form.city || '').trim(),
      leadSource:    form.leadSource || '',
      message:       (form.message || '').trim(),
      internalNotes: [],
      metadata: {
        ipAddress: 'pending-ip-capture',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
      reviewedBy:       null,
      reviewedAt:       null,
      rejectionReason:  null,
    };
    addRequest(record);

    addAuditLog({
      userName:    form.fullName.trim() || 'Public visitor',
      role:        'public',
      action:      'CREATE',
      module:      'Access Requests',
      description: `Submitted access request ${id} for ${record.orgName}.`,
    });

    /* Module 7 — platform-level alert for SuperAdmin review queue.
       orgId is explicitly null so visibleNotifications() surfaces the row
       only to SuperAdmin (platform broadcast rule). */
    fireSystemAlert({
      title:  `New access request — ${record.orgName}`,
      detail: `${form.fullName.trim() || 'Public visitor'} (${record.country || 'unknown region'}) has requested access. Review in the Access Requests queue.`,
      link:   { page: 'access-requests' },
      orgId:  null,
    });

    setSubmitted({ id });
    setSubmitting(false);
    onSubmitted?.(record);
  };

  /* ── Inline style tokens ───────────────────────────────────────── */
  const P  = '#0284C7';
  const PL = '#0EA5E9';
  const PD = '#0D9488';
  const DARK = '#0C2340';
  const PBORDER = '#BAE6FD';

  const inputBase = {
    width: '100%',
    padding: '11px 12px',
    border: `1px solid ${PBORDER}`,
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "'Plus Jakarta Sans',sans-serif",
    color: DARK,
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };
  const inputErr = { borderColor: '#EF4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' };

  const renderField = ({ key, label, required, hint, children }) => (
    <div data-field={key} style={{ marginBottom: 14 }}>
      <label
        htmlFor={`req-${key}`}
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#64748B',
          marginBottom: 6,
        }}
      >
        {label}
        {required && <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>}
        {required && <span style={{ position: 'absolute', left: -9999 }}> (required)</span>}
      </label>
      {children}
      {errors[key] ? (
        <p role="alert" style={{ marginTop: 5, fontSize: 11, fontWeight: 600, color: '#EF4444' }}>
          {errors[key]}
        </p>
      ) : hint ? (
        <p style={{ marginTop: 5, fontSize: 11, color: '#94A3B8' }}>{hint}</p>
      ) : null}
    </div>
  );

  /* ── Success view ──────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="req-success-title"
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.55)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 16,
        }}
      >
        <div
          style={{
            width: '100%', maxWidth: 480, background: '#fff',
            borderRadius: 16, padding: '40px 28px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#ECFDF5', color: '#15803D',
              display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
              border: '2px solid #86EFAC',
            }}
          >
            <CheckCircle2 size={34} />
          </div>
          <h2
            id="req-success-title"
            style={{
              margin: 0, fontFamily: 'Outfit,sans-serif',
              fontSize: 22, fontWeight: 800, color: DARK,
            }}
          >
            Request Submitted Successfully.
          </h2>
          <p style={{ margin: '12px 0 6px', fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
            Thank you. Our team will review your request and respond within 24 hours.
          </p>
          <div
            style={{
              margin: '18px auto 22px', padding: '12px 18px',
              border: `1px dashed ${PBORDER}`, borderRadius: 12,
              background: '#E0F2FE', display: 'inline-flex', flexDirection: 'column',
              alignItems: 'center', gap: 4,
            }}
          >
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Request ID
            </span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: P }}>
              {submitted.id}
            </span>
          </div>
          <p style={{ margin: '0 0 22px', fontSize: 12, color: '#94A3B8' }}>
            Expected response time: 24 hours.
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '12px 28px', borderRadius: 11, border: 'none',
              cursor: 'pointer', fontFamily: 'Outfit,sans-serif',
              fontWeight: 700, fontSize: 14,
              background: `linear-gradient(135deg,${PL},${PD})`,
              color: '#fff', boxShadow: '0 5px 18px rgba(14,165,233,0.32)',
            }}
          >
            Return to Home →
          </button>
        </div>
      </div>
    );
  }

  /* ── Form view ─────────────────────────────────────────────────── */
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="req-form-title"
      ref={dialogRef}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !submitting) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.55)', display: 'flex',
        alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', overflowY: 'auto',
      }}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{
          width: '100%', maxWidth: 720, background: '#fff',
          borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 28px', background: `linear-gradient(135deg,${PL},${PD})`,
            color: '#fff', position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            title="Close"
            style={{
              position: 'absolute', top: 14, right: 14, width: 32, height: 32,
              borderRadius: 8, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
          <h2
            id="req-form-title"
            style={{
              margin: 0, fontFamily: 'Outfit,sans-serif',
              fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px',
            }}
          >
            Request Organisation Access
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>
            Tell us a little about your business — our team responds within 24 hours.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>

          {/* Section 1 — Organisation Details */}
          <h3 style={sectionStyle()}><Building2 size={14} /> Organisation Details</h3>

          {renderField({
            key: 'orgName', label: 'Organisation Name', required: true,
            children: (
              <input
                ref={firstFieldRef}
                id="req-orgName"
                type="text"
                value={form.orgName}
                onChange={(e) => setField('orgName', e.target.value)}
                placeholder="Enter organisation name"
                maxLength={100}
                aria-invalid={Boolean(errors.orgName)}
                style={errors.orgName ? { ...inputBase, ...inputErr } : inputBase}
              />
            ),
          })}

          <div style={twoCol()}>
            {renderField({
              key: 'country', label: 'Country', required: true,
              children: (
                <SelectInput
                  id="req-country"
                  value={form.country}
                  onChange={(v) => setField('country', v)}
                  options={[{ value: '', label: 'Select country' }, ...COUNTRIES.map((c) => ({ value: c.value, label: `${c.flag} ${c.label}` }))]}
                  invalid={Boolean(errors.country)}
                />
              ),
            })}
            {renderField({
              key: 'businessEmail', label: 'Business Email ID', required: true,
              children: (
                <input
                  id="req-businessEmail"
                  type="email"
                  value={form.businessEmail}
                  onChange={(e) => setField('businessEmail', e.target.value)}
                  placeholder="Enter business email ID (no Gmail/Yahoo)"
                  aria-invalid={Boolean(errors.businessEmail)}
                  style={errors.businessEmail ? { ...inputBase, ...inputErr } : inputBase}
                />
              ),
            })}
          </div>

          {renderField({
            key: 'contactNumber', label: 'Contact Number', required: true,
            children: (
              <div style={{ display: 'flex', gap: 8 }}>
                <SelectInput
                  id="req-countryCode"
                  value={form.countryCode}
                  onChange={(v) => setField('countryCode', v)}
                  options={Object.entries(DIAL_CODES).map(([code, dial]) => ({
                    value: code, label: `${code} ${dial}`,
                  }))}
                  style={{ width: 120, flex: '0 0 auto' }}
                  invalid={false}
                />
                <input
                  id="req-contactNumber"
                  type="tel"
                  inputMode="numeric"
                  value={form.contactNumber}
                  onChange={(e) => setField('contactNumber', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter contact number"
                  aria-invalid={Boolean(errors.contactNumber)}
                  style={errors.contactNumber ? { ...inputBase, ...inputErr, flex: 1 } : { ...inputBase, flex: 1 }}
                />
              </div>
            ),
          })}

          {renderField({
            key: 'companySize', label: 'Company Size', required: true,
            children: (
              <div role="radiogroup" aria-label="Company Size" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {COMPANY_SIZES.map((sz) => {
                  const active = form.companySize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setField('companySize', sz)}
                      style={{
                        padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit',
                        background: active ? `linear-gradient(135deg,${PL},${PD})` : '#F0F9FF',
                        color: active ? '#fff' : '#475569',
                        border: active ? 'none' : `1px solid ${PBORDER}`,
                        boxShadow: active ? '0 2px 8px rgba(14,165,233,0.25)' : 'none',
                      }}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            ),
          })}

          {renderField({
            key: 'industry', label: 'Industry', required: false,
            children: (
              <SelectInput
                id="req-industry"
                value={form.industry}
                onChange={(v) => setField('industry', v)}
                options={[{ value: '', label: 'Select industry' }, ...INDUSTRIES.map((i) => ({ value: i, label: i }))]}
                invalid={false}
              />
            ),
          })}

          {/* Section 2 — Your Details */}
          <h3 style={{ ...sectionStyle(), marginTop: 22 }}><User size={14} /> Your Details</h3>

          <div style={twoCol()}>
            {renderField({
              key: 'fullName', label: 'Full Name', required: true,
              children: (
                <input
                  id="req-fullName"
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  placeholder="Enter full name"
                  maxLength={80}
                  aria-invalid={Boolean(errors.fullName)}
                  style={errors.fullName ? { ...inputBase, ...inputErr } : inputBase}
                />
              ),
            })}
            {renderField({
              key: 'designation', label: 'Designation', required: true,
              children: (
                <input
                  id="req-designation"
                  type="text"
                  value={form.designation}
                  onChange={(e) => setField('designation', e.target.value)}
                  placeholder="Enter designation"
                  maxLength={80}
                  aria-invalid={Boolean(errors.designation)}
                  style={errors.designation ? { ...inputBase, ...inputErr } : inputBase}
                />
              ),
            })}
          </div>

          {renderField({
            key: 'city', label: 'City', required: false,
            children: (
              <input
                id="req-city"
                type="text"
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
                placeholder="Enter city"
                maxLength={60}
                style={inputBase}
              />
            ),
          })}

          {/* Section 3 — Additional Information */}
          <h3 style={{ ...sectionStyle(), marginTop: 22 }}><FileText size={14} /> Additional Information</h3>

          {renderField({
            key: 'gstOrLicense',
            label: taxIdConfig.label,
            required: taxIdConfig.required,
            children: (
              <input
                id="req-gstOrLicense"
                type="text"
                value={form.gstOrLicense}
                onChange={(e) => setField('gstOrLicense', e.target.value.toUpperCase())}
                placeholder={taxIdConfig.placeholder}
                maxLength={20}
                aria-invalid={Boolean(errors.gstOrLicense)}
                style={errors.gstOrLicense ? { ...inputBase, ...inputErr } : inputBase}
              />
            ),
          })}

          {renderField({
            key: 'leadSource', label: 'How did you hear about us?', required: false,
            children: (
              <SelectInput
                id="req-leadSource"
                value={form.leadSource}
                onChange={(v) => setField('leadSource', v)}
                options={[{ value: '', label: 'Select source' }, ...LEAD_SOURCES.map((s) => ({ value: s, label: s }))]}
                invalid={false}
              />
            ),
          })}

          {renderField({
            key: 'message', label: 'Message',
            hint: `${form.message.length}/${MAX_MESSAGE} characters.`,
            children: (
              <textarea
                id="req-message"
                value={form.message}
                onChange={(e) => setField('message', e.target.value.slice(0, MAX_MESSAGE))}
                placeholder="Tell us about your requirements (optional)"
                rows={4}
                aria-invalid={Boolean(errors.message)}
                style={errors.message
                  ? { ...inputBase, ...inputErr, resize: 'vertical', minHeight: 90, fontFamily: 'inherit' }
                  : { ...inputBase, resize: 'vertical', minHeight: 90, fontFamily: 'inherit' }}
              />
            ),
          })}

          {/* Section 4 — Consent */}
          <h3 style={{ ...sectionStyle(), marginTop: 18 }}>Consent</h3>
          <div data-field="consent" style={{ marginBottom: 4 }}>
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <input
                id="req-consent"
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setField('consent', e.target.checked)}
                aria-invalid={Boolean(errors.consent)}
                style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', accentColor: P }}
              />
              <span>
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: P, fontWeight: 700, textDecoration: 'none' }}>Terms of Service</a>{' '}and{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: P, fontWeight: 700, textDecoration: 'none' }}>Privacy Policy</a>
                <span aria-hidden="true" style={{ color: '#EF4444' }}>*</span>
              </span>
            </label>
            {errors.consent && (
              <p role="alert" style={{ marginTop: 5, marginLeft: 26, fontSize: 11, fontWeight: 600, color: '#EF4444' }}>
                {errors.consent}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px', borderTop: `1px solid ${PBORDER}`,
            background: '#FAFAFA', display: 'flex', gap: 12,
            justifyContent: 'flex-end', flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '11px 22px', borderRadius: 11,
              border: `1px solid ${PBORDER}`, background: '#fff',
              color: '#475569', fontWeight: 700, fontSize: 13,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '11px 26px', borderRadius: 11, border: 'none',
              background: submitting
                ? '#38BDF8'
                : `linear-gradient(135deg,${PL},${PD})`,
              color: '#fff', fontWeight: 700, fontSize: 13,
              fontFamily: 'Outfit,sans-serif',
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: submitting ? 'none' : '0 5px 18px rgba(14,165,233,0.32)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {submitting ? 'Submitting…' : 'Submit Request →'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Tiny inline styled <select> wrapper so the chevron rotates and
   the focus state matches the sibling <input>s. ─────────────────── */
function SelectInput({ id, value, onChange, options, invalid, style = {} }) {
  const [open, setOpen] = useState(false);
  const PBORDER = '#BAE6FD';
  const base = {
    width: '100%',
    padding: '11px 36px 11px 12px',
    border: `1px solid ${invalid ? '#EF4444' : PBORDER}`,
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "'Plus Jakarta Sans',sans-serif",
    color: '#0C2340',
    background: '#fff',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
    ...style,
  };
  return (
    <div style={{ position: 'relative', ...(style.width ? { width: style.width } : {}) }}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onMouseDown={() => setOpen((o) => !o)}
        style={base}
      >
        {options.map((o) => (
          <option key={`${o.value}__${o.label}`} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        aria-hidden="true"
        style={{
          position: 'absolute', right: 12, top: '50%',
          transform: open ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%) rotate(0deg)',
          color: '#94A3B8', pointerEvents: 'none',
          transition: 'transform 0.2s',
        }}
      />
    </div>
  );
}

function sectionStyle() {
  return {
    margin: '0 0 12px',
    fontFamily: 'Outfit,sans-serif',
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: '#0284C7',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  };
}

function twoCol() {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
    gap: 12,
  };
}
