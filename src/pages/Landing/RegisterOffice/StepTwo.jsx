import React from 'react';
import FormField from './FormField';

export default function StepTwo({ data, errors, onChange }) {
  const set = (key) => (e) => onChange(key, e.target.value);

  const pwdStrength = (() => {
    const p = data.password || '';
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#059669'];
    const idx = Math.max(0, Math.min(3, score - 1));
    return { label: labels[idx], color: colors[idx], pct: (score / 4) * 100 };
  })();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <FormField label='Full Name' icon='👤' required value={data.name} error={errors.name} onChange={set('name')} autoComplete='name' />
      </div>
      <FormField label='Email ID' icon='✉️' type='email' required value={data.email} error={errors.email} onChange={set('email')} autoComplete='email' />
      <FormField label='Contact Number' icon='📱' type='tel' required value={data.phone} error={errors.phone} onChange={set('phone')} autoComplete='tel' />
      <div>
        <FormField label='Password' icon='🔒' type='password' required value={data.password} error={errors.password} onChange={set('password')} autoComplete='new-password' />
        {pwdStrength && !errors.password && (
          <div style={{ marginTop: '-8px', padding: '0 4px 4px' }}>
            <div style={{ height: '3px', background: '#E0F2FE', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pwdStrength.pct}%`, background: pwdStrength.color,
                borderRadius: '3px', transition: 'width 0.3s, background 0.3s',
              }} />
            </div>
            <div style={{ fontSize: '10px', color: pwdStrength.color, fontWeight: 700, marginTop: '4px', letterSpacing: '0.04em' }}>
              {pwdStrength.label}
            </div>
          </div>
        )}
      </div>
      <FormField label='Confirm Password' icon='🔐' type='password' required value={data.confirmPassword} error={errors.confirmPassword} onChange={set('confirmPassword')} autoComplete='new-password' />
    </div>
  );
}
