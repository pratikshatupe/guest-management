import React from 'react';

const PL = '#0EA5E9';
const PD = '#0D9488';
const DARK = '#0C2340';
const MUTED = '#9B99C4';

export default function SuccessScreen({ onClose, onContinue, companyName }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 20px 10px', position: 'relative' }}>
      {/* Confetti-ish orbs */}
      <div style={{ position: 'absolute', top: '10px', left: '12%', width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', animation: 'ro-confetti 2.2s ease-out' }} />
      <div style={{ position: 'absolute', top: '22px', right: '14%', width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', animation: 'ro-confetti 2.4s ease-out 0.1s' }} />
      <div style={{ position: 'absolute', top: '40px', left: '28%', width: '6px', height: '6px', borderRadius: '50%', background: PL, animation: 'ro-confetti 2.6s ease-out 0.2s' }} />
      <div style={{ position: 'absolute', top: '8px', right: '30%', width: '7px', height: '7px', borderRadius: '50%', background: '#EC4899', animation: 'ro-confetti 2.8s ease-out 0.15s' }} />

      {/* Check circle */}
      <div style={{
        width: '96px', height: '96px', borderRadius: '50%',
        background: `linear-gradient(135deg, ${PL}, ${PD})`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        margin: '12px auto 26px',
        boxShadow: `0 18px 44px ${PL}55, 0 0 0 8px ${PL}14`,
        animation: 'ro-check-pop 0.7s cubic-bezier(.2,1.4,.3,1) both',
        position: 'relative',
      }}>
        <svg width="46" height="46" viewBox="0 0 52 52" style={{ display: 'block' }}>
          <path
            d="M14 27 l8 8 l16 -18"
            fill="none"
            stroke="#fff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 60,
              strokeDashoffset: 60,
              animation: 'ro-check-draw 0.55s 0.3s cubic-bezier(.22,1,.36,1) forwards',
            }}
          />
        </svg>
      </div>

      <h2 style={{
        fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 900,
        color: DARK, marginBottom: '10px', letterSpacing: '-0.5px',
        animation: 'ro-fade-up 0.5s 0.5s both',
      }}>
        Your office registration request has been submitted
      </h2>

      <p style={{
        fontSize: '14px', color: MUTED, marginBottom: '8px',
        maxWidth: '380px', margin: '0 auto 8px', lineHeight: 1.7,
        animation: 'ro-fade-up 0.5s 0.6s both',
      }}>
        Waiting for admin approval.
      </p>

      {companyName && (
        <p style={{
          fontSize: '13px', color: '#0284C7', fontWeight: 700,
          marginBottom: '28px', animation: 'ro-fade-up 0.5s 0.65s both',
        }}>
          We'll email <strong>{companyName}</strong> once you're approved.
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animation: 'ro-fade-up 0.5s 0.75s both' }}>
        <button
          onClick={onContinue || onClose}
          style={{
            padding: '14px 36px', borderRadius: '12px', border: 'none',
            background: `linear-gradient(135deg, ${PL}, ${PD})`, color: '#fff',
            cursor: 'pointer', fontSize: '14px', fontWeight: 800,
            fontFamily: 'Outfit, sans-serif',
            boxShadow: `0 8px 22px ${PL}55`,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 14px 30px ${PL}77`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 8px 22px ${PL}55`; }}
        >
          Proceed to Log In →
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '14px 28px', borderRadius: '12px',
            background: 'transparent', border: `1.5px solid ${PL}`,
            color: PL, cursor: 'pointer', fontSize: '14px', fontWeight: 700,
            fontFamily: 'Outfit, sans-serif', transition: 'background 0.2s',
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
