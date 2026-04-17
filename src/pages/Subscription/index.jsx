import React, { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';

export default function Subscription() {
  const [yearly, setYearly] = useState(false);
  const [current] = useState('professional');

  return (
    <div style={{ padding: '20px', maxWidth: '1100px' }}>
      {/* Header */}
      <div className="anim-fade" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ padding: '5px 12px', background: 'rgba(30,136,229,0.12)', border: '1px solid rgba(30,136,229,0.25)', borderRadius: '6px', fontSize: '11px', color: '#42A5F5', fontWeight: 700, letterSpacing: '0.08em' }}>PLANS & BILLING</div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: '#EDF2F7' }}>Subscription</h2>
        </div>
        <p style={{ color: '#4A6080', fontSize: '13px' }}>Manage your plan, billing, and feature access</p>
      </div>

      {/* Current Plan Banner */}
      <div className="card anim-up d1" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(30,136,229,0.07)', border: '1px solid rgba(30,136,229,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #1E88E5, #7E57C2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>💎</div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#42A5F5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Current Plan</div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '18px', fontWeight: 800, color: '#EDF2F7' }}>Professional Plan</div>
            <div style={{ fontSize: '12px', color: '#4A6080' }}>$129/month · Renews April 15, 2024 · 3 Offices · 50 Users</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ fontSize: '12px' }}>Manage Billing</button>
          <button className="btn btn-primary" style={{ fontSize: '12px' }}>Upgrade Plan</button>
        </div>
      </div>

      {/* Usage */}
      <div className="card anim-up d2" style={{ padding: '18px', marginBottom: '24px' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#EDF2F7', marginBottom: '16px' }}>Usage This Month</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Visitors', used: 1420, max: 2000, color: '#1E88E5' },
            { label: 'Users', used: 28, max: 50, color: '#00897B' },
            { label: 'Offices', used: 2, max: 3, color: '#7E57C2' },
            { label: 'API Calls', used: 0, max: 0, color: '#9CA3AF', locked: true },
          ].map(u => {
            const pct = u.locked ? 0 : Math.round((u.used / u.max) * 100);
            return (
              <div key={u.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#90A4C0', fontWeight: 500 }}>{u.label}</span>
                  <span style={{ fontSize: '12px', color: u.locked ? '#4A6080' : '#EDF2F7', fontWeight: 600 }}>{u.locked ? 'Locked' : `${u.used} / ${u.max}`}</span>
                </div>
                <div style={{ height: '6px', background: '#172240', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: u.locked ? '#1E2F4A' : pct > 80 ? '#E53935' : u.color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                </div>
                {!u.locked && <div style={{ fontSize: '10px', color: '#4A6080', marginTop: '4px' }}>{pct}% used</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing toggle */}
      <div className="anim-up d3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '15px', fontWeight: 700, color: '#EDF2F7' }}>All Plans</h3>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0', padding: '5px', background: '#0F1A2E', border: '1px solid #1E2F4A', borderRadius: '30px' }}>
          <button onClick={() => setYearly(false)} style={{ padding: '7px 18px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: !yearly ? '#1E88E5' : 'transparent', color: !yearly ? 'white' : '#4A6080', transition: 'all 0.25s', fontFamily: 'inherit' }}>Monthly</button>
          <button onClick={() => setYearly(true)} style={{ padding: '7px 18px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: yearly ? '#1E88E5' : 'transparent', color: yearly ? 'white' : '#4A6080', transition: 'all 0.25s', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Yearly <span style={{ fontSize: '9px', background: 'rgba(67,160,71,0.2)', color: '#43A047', padding: '1px 5px', borderRadius: '8px', fontWeight: 700 }}>-20%</span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="anim-up d4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {SUBSCRIPTION_PLANS.map(plan => {
          const isCurrent = plan.id === current;
          return (
            <div key={plan.id} className={`plan-card ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && !isCurrent && (
                <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '10px', fontWeight: 700, padding: '3px 10px', background: '#7C3AED', color: 'white', borderRadius: '20px', letterSpacing: '0.06em' }}>POPULAR</div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: '14px', right: '14px', fontSize: '10px', fontWeight: 700, padding: '3px 10px', background: 'rgba(67,160,71,0.15)', color: '#43A047', border: '1px solid rgba(67,160,71,0.3)', borderRadius: '20px' }}>CURRENT</div>
              )}
              <div style={{ fontSize: '11px', fontWeight: 700, color: plan.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '38px', fontWeight: 900, color: '#EDF2F7' }}>${yearly ? plan.yearlyPrice : plan.price}</span>
                <span style={{ fontSize: '13px', color: '#4A6080' }}>/mo</span>
              </div>
              {yearly && <div style={{ fontSize: '11px', color: '#43A047', marginBottom: '8px' }}>Save ${(plan.price - plan.yearlyPrice) * 12}/year</div>}
              <p style={{ fontSize: '12px', color: '#4A6080', marginBottom: '16px' }}>{plan.desc}</p>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', background: `${plan.color}12`, color: plan.color, padding: '2px 8px', borderRadius: '10px', border: `1px solid ${plan.color}25` }}>{plan.offices === 'Unlimited' ? '∞ Offices' : `${plan.offices} Office${plan.offices > 1 ? 's' : ''}`}</span>
                <span style={{ fontSize: '10px', background: `${plan.color}12`, color: plan.color, padding: '2px 8px', borderRadius: '10px', border: `1px solid ${plan.color}25` }}>{plan.users === 'Unlimited' ? '∞ Users' : `${plan.users} Users`}</span>
                <span style={{ fontSize: '10px', background: `${plan.color}12`, color: plan.color, padding: '2px 8px', borderRadius: '10px', border: `1px solid ${plan.color}25` }}>{plan.visitors === 'Unlimited' ? '∞ Visitors' : `${plan.visitors}/mo`}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {plan.features.map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div className={f.included ? 'feat-tick' : 'feat-cross'}>{f.included ? '✓' : '×'}</div>
                    <span style={{ fontSize: '12px', color: f.included ? '#90A4C0' : '#4A6080' }}>{f.label}</span>
                  </div>
                ))}
              </div>
              <button
                className={`btn ${isCurrent ? 'btn-secondary' : plan.featured ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '13px', opacity: isCurrent ? 0.7 : 1, cursor: isCurrent ? 'default' : 'pointer' }}
                disabled={isCurrent}>
                {isCurrent ? '✓ Current Plan' : plan.name === 'Enterprise' ? 'Contact Sales' : plan.price > 129 ? 'Upgrade' : 'Downgrade'}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="card anim-up d5" style={{ padding: '20px' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: 700, color: '#EDF2F7', marginBottom: '16px' }}>Frequently Asked Questions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { q: 'Can I change my plan anytime?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately and are prorated.' },
            { q: 'What happens when I exceed visitor limits?', a: 'You will receive an alert at 80% usage. Above 100%, you can still use the system but will be prompted to upgrade.' },
            { q: 'Do you offer a free trial?', a: 'Yes! All plans include a 14-day free trial with no credit card required.' },
            { q: 'Is there a discount for annual billing?', a: 'Yes, you save 20% when you choose annual billing for any plan.' },
          ].map((item, i, arr) => (
            <div key={item.q} style={{ padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(31,41,55,0.6)' : 'none' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#EDF2F7', marginBottom: '5px' }}>Q: {item.q}</div>
              <div style={{ fontSize: '12px', color: '#4A6080', lineHeight: 1.6 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
