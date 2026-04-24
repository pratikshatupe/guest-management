import React from 'react';
import FormField from './FormField';

const INDUSTRIES = [
  'Technology / SaaS',
  'Finance & Banking',
  'Healthcare',
  'Education',
  'Retail & E-commerce',
  'Manufacturing',
  'Hospitality',
  'Consulting',
  'Real Estate',
  'Government',
  'Other',
];

const SIZES = [
  '1–10 employees',
  '11–50 employees',
  '51–200 employees',
  '201–500 employees',
  '501–1000 employees',
  '1000+ employees',
];

export default function StepOne({ data, errors, onChange }) {
  const set = (key) => (e) => onChange(key, e.target.value);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <FormField label='Company Name' icon='🏢' required value={data.name} error={errors.name} onChange={set('name')} />
      </div>
      <FormField label='Industry' icon='💼' required opts={INDUSTRIES} value={data.industry} error={errors.industry} onChange={set('industry')} />
      <FormField label='Company Size' icon='👥' required opts={SIZES} value={data.size} error={errors.size} onChange={set('size')} />
      <div style={{ gridColumn: '1 / -1' }}>
        <FormField label='Website (optional)' icon='🌐' type='url' value={data.website} error={errors.website} onChange={set('website')} autoComplete='url' />
      </div>
    </div>
  );
}
