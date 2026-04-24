import React, { useState } from 'react';

const PL = '#0EA5E9';
const PBORDER = '#BAE6FD';
const DARK = '#0C2340';
const MUTED = '#9B99C4';
const ERR = '#EF4444';

/* Floating-label input with icon + inline error.
   Works for text, email, tel, password, number, url, and <select>. */
export default function FormField({
  label,
  icon,
  type = 'text',
  value = '',
  error,
  onChange,
  opts,
  required,
  autoComplete,
  maxLength,
}) {
  const [focused, setFocused] = useState(false);
  const filled = value !== '' && value !== null && value !== undefined;
  const floating = focused || filled || !!opts;
  const showError = !!error;
  const borderColor = showError ? ERR : focused ? PL : PBORDER;

  const wrapStyle = {
    position: 'relative',
    borderRadius: '12px',
    background: '#fff',
    border: `1.5px solid ${borderColor}`,
    transition: 'border-color 0.2s, box-shadow 0.25s',
    boxShadow: focused && !showError ? `0 0 0 4px ${PL}1C` : 'none',
  };

  const labelStyle = {
    position: 'absolute',
    left: icon ? '40px' : '14px',
    top: floating ? '-8px' : '50%',
    transform: floating ? 'translateY(0)' : 'translateY(-50%)',
    fontSize: floating ? '11px' : '13px',
    fontWeight: 600,
    color: showError ? ERR : floating ? (focused ? PL : '#0284C7') : MUTED,
    background: floating ? '#fff' : 'transparent',
    padding: floating ? '0 6px' : 0,
    letterSpacing: floating ? '0.04em' : 0,
    pointerEvents: 'none',
    transition: 'all 0.18s cubic-bezier(.4,.01,.2,1)',
    textTransform: floating ? 'uppercase' : 'none',
    whiteSpace: 'nowrap',
    maxWidth: `calc(100% - ${icon ? 60 : 28}px)`,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const iconStyle = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '16px',
    color: focused ? PL : MUTED,
    transition: 'color 0.2s',
    pointerEvents: 'none',
  };

  const inputStyle = {
    width: '100%',
    padding: icon ? '14px 14px 14px 40px' : '14px',
    fontSize: '14px',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: DARK,
    fontFamily: 'inherit',
    borderRadius: '12px',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={wrapStyle}>
        {icon && <span style={iconStyle}>{icon}</span>}
        <label style={labelStyle}>
          {label}{required ? ' *' : ''}
        </label>
        {opts ? (
          <select
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', paddingRight: '38px' }}
          >
            <option value=''>Select…</option>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete={autoComplete}
            maxLength={maxLength}
            style={inputStyle}
          />
        )}
        {opts && (
          <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: MUTED, pointerEvents: 'none' }}>▼</span>
        )}
      </div>
      <div style={{ minHeight: '14px', paddingLeft: '4px' }}>
        {showError && (
          <span style={{ fontSize: '11px', color: ERR, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', animation: 'ro-err-in 0.25s ease' }}>
            <span>⚠</span>{error}
          </span>
        )}
      </div>
    </div>
  );
}
