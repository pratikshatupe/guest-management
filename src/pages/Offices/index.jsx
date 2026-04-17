import React from 'react';
import { MOCK_OFFICES } from '../../data/mockData';

const safeText = (value, fallback = '—') => (value ?? fallback);
const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeFirstWord = (value, fallback = '—') => {
  const parts = (value || '').split(' ').filter(Boolean);
  return parts[0] || fallback;
};
const safeInitials = (value, fallback = '?') => {
  const initials = (value || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return initials || fallback;
};

export default function Offices() {
  const offices = safeArray(MOCK_OFFICES);

  return (
    <div style={{ padding: '20px', maxWidth: '1100px' }}>
      <div className="anim-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: '#EDF2F7', marginBottom: '3px' }}>Offices</h2>
          <p style={{ fontSize: '13px', color: '#4A6080' }}>{offices.length} office locations</p>
        </div>
        <button className="btn btn-primary" style={{ fontSize: '12px' }}>+ Add Office</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {offices.map((o, i) => (
          <div key={o?.id ?? i} className="card card-hover anim-up" style={{ padding: '20px', animationDelay: `${i * 0.08}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 800, color: '#EDF2F7', marginBottom: '3px' }}>{safeText(o?.name)}</div>
                <div style={{ fontSize: '12px', color: '#4A6080' }}>{safeText(o?.address)}</div>
              </div>
              <span className="badge badge-active">{safeText(o?.status, 'Active')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'Staff', val: safeText(o?.staff, 0), icon: '👥' },
                { label: 'Visitors Today', val: safeText(o?.visitors_today, 0), icon: '🚶' },
                { label: 'Capacity', val: safeText(o?.capacity, 0), icon: '🏢' },
                { label: 'Manager', val: safeFirstWord(o?.manager), icon: '👤' },
              ].map((s) => (
                <div key={s.label} style={{ padding: '10px', background: '#172240', borderRadius: '8px' }}>
                  <div style={{ fontSize: '16px', marginBottom: '3px' }}>{s.icon}</div>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '16px', fontWeight: 700, color: '#EDF2F7' }}>{s.val}</div>
                  <div style={{ fontSize: '10px', color: '#4A6080' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#4A6080', marginBottom: '14px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(109,40,217,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#9C84E0' }}>
                {safeInitials(o?.name)}
              </div>
              <div>
                <div>{safeText(o?.floors, '📐 Floors not available')}</div>
              </div>
            </div>

            <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '12px' }}>Manage Office</button>
          </div>
        ))}
      </div>
    </div>
  );
}
