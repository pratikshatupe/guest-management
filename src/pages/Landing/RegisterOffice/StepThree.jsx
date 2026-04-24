import React from 'react';
import FormField from './FormField';

const COUNTRIES = [
  'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Singapore',
  'Germany', 'France', 'Netherlands', 'Other',
];

export default function StepThree({ data, errors, onChange }) {
  const set = (key) => (e) => onChange(key, e.target.value);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
      <div style={{ gridColumn: '1 / -1' }}>
        <FormField label='Office Name' icon='🏬' required value={data.name} error={errors.name} onChange={set('name')} />
      </div>
      <FormField label='Country' icon='🌍' required opts={COUNTRIES} value={data.country} error={errors.country} onChange={set('country')} />
      <FormField label='City' icon='📍' required value={data.city} error={errors.city} onChange={set('city')} />
      <div style={{ gridColumn: '1 / -1' }}>
        <FormField label='Full Address' icon='🗺️' required value={data.address} error={errors.address} onChange={set('address')} />
      </div>
      <FormField label='Number of Floors' icon='🏗️' type='number' value={data.floors} error={errors.floors} onChange={set('floors')} />
      <FormField label='Number of Rooms' icon='🚪' type='number' value={data.rooms} error={errors.rooms} onChange={set('rooms')} />
    </div>
  );
}
