import React from 'react';

const PL = '#0EA5E9';
const PD = '#0D9488';
const PBORDER = '#BAE6FD';
const DARK = '#0C2340';
const MUTED = '#9B99C4';

export default function Stepper({ steps, current }) {
  const total = steps.length;
  const progress = total > 1 ? ((current - 1) / (total - 1)) * 100 : 0;

  return (
    <div style={{ padding: '4px 4px 30px' }}>
      {/* Track */}
      <div style={{ position: 'relative', height: '4px', background: PBORDER, borderRadius: '4px', margin: '26px 22px 14px' }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${PL}, ${PD}, #0EA5E9)`,
          borderRadius: '4px',
          boxShadow: `0 0 12px ${PL}66`,
          transition: 'width 0.5s cubic-bezier(.22,1,.36,1)',
        }} />
        {/* Step dots */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {steps.map((s, i) => {
            const n = i + 1;
            const done = n < current;
            const active = n === current;
            return (
              <div key={s.label} style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: done || active ? `linear-gradient(135deg, ${PL}, ${PD})` : '#fff',
                border: `2px solid ${done || active ? PL : PBORDER}`,
                color: done || active ? '#fff' : MUTED,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 800, fontFamily: 'Outfit, sans-serif',
                boxShadow: active ? `0 0 0 6px ${PL}22, 0 6px 18px ${PL}44` : 'none',
                transition: 'all 0.35s cubic-bezier(.22,1,.36,1)',
                transform: active ? 'scale(1.08)' : 'scale(1)',
                flexShrink: 0,
                position: 'relative', zIndex: 1,
              }}>
                {done ? '✓' : n}
              </div>
            );
          })}
        </div>
      </div>
      {/* Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0 6px' }}>
        {steps.map((s, i) => {
          const n = i + 1;
          const active = n === current;
          const done = n < current;
          return (
            <div key={s.label} style={{
              flex: 1, textAlign: 'center', padding: '0 2px',
              color: active ? DARK : done ? '#0284C7' : MUTED,
              fontWeight: active ? 800 : 600, fontSize: '12px',
              fontFamily: 'Outfit, sans-serif',
              transition: 'color 0.3s',
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>Step {n}</div>
              <div style={{ marginTop: '2px' }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
