import React, { useState } from 'react';
import { NOTIFICATIONS } from '../../data/mockData';

const typeConfig = {
  checkin: { icon: '✅', color: '#43A047', label: 'Check-in', bg: 'rgba(67,160,71,0.12)' },
  checkout: { icon: '🚪', color: '#9CA3AF', label: 'Check-out', bg: 'rgba(107,114,128,0.12)' },
  service: { icon: '☕', color: '#F57C00', label: 'Service', bg: 'rgba(245,124,0,0.12)' },
  appointment: { icon: '📅', color: '#1E88E5', label: 'Appointment', bg: 'rgba(30,136,229,0.12)' },
  alert: { icon: '⚠️', color: '#E53935', label: 'Alert', bg: 'rgba(229,57,53,0.12)' },
};

export default function Notifications() {
  const [items, setItems] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? items
    : filter === 'unread' ? items.filter(n => !n.read)
    : items.filter(n => n.type === filter);

  const markAllRead = () => setItems(items.map(n => ({ ...n, read: true })));
  const markRead = (id) => setItems(items.map(n => n.id === id ? { ...n, read: true } : n));
  const unreadCount = items.filter(n => !n.read).length;

  const channels = [
    { icon: '📧', label: 'Email Alerts', sub: 'Appointment & check-in confirmations', status: 'Active', color: '#1E88E5', enabled: true },
    { icon: '💬', label: 'WhatsApp', sub: 'Visitor arrival & departure alerts', status: 'Active', color: '#43A047', enabled: true },
    { icon: '🔔', label: 'In-App', sub: 'Real-time dashboard updates', status: 'Active', color: '#7E57C2', enabled: true },
    { icon: '📱', label: 'SMS Alerts', sub: 'Fallback for urgent notifications', status: 'Inactive', color: '#9CA3AF', enabled: false },
  ];

  const [channelState, setChannelState] = useState(channels.map(c => c.enabled));

  const toggleChannel = (i) => {
    const next = [...channelState];
    next[i] = !next[i];
    setChannelState(next);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px' }}>
      {/* Header */}
      <div className="anim-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: '#EDF2F7', marginBottom: '3px' }}>Notifications</h2>
          {unreadCount > 0
            ? <p style={{ fontSize: '13px', color: '#4A6080' }}><span style={{ color: '#1E88E5', fontWeight: 700 }}>{unreadCount} unread</span> · {items.length} total</p>
            : <p style={{ fontSize: '13px', color: '#4A6080' }}>All caught up ✓</p>
          }
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead} style={{ fontSize: '12px', padding: '8px 14px' }}>✓ Mark all as read</button>
        )}
      </div>

      {/* Notification Channels */}
      <div className="card anim-up d1" style={{ padding: '18px', marginBottom: '20px' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#EDF2F7', marginBottom: '14px' }}>Notification Channels</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {channels.map((c, i) => (
            <div key={c.label} style={{ padding: '14px', background: '#172240', borderRadius: '10px', border: `1px solid ${channelState[i] ? c.color + '30' : '#1E2F4A'}`, display: 'flex', gap: '10px', alignItems: 'center', transition: 'all 0.25s' }}>
              <div style={{ fontSize: '22px' }}>{c.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#EDF2F7', marginBottom: '2px' }}>{c.label}</div>
                <div style={{ fontSize: '10px', color: '#4A6080', lineHeight: 1.4 }}>{c.sub}</div>
              </div>
              {/* Toggle switch */}
              <button onClick={() => toggleChannel(i)} style={{
                width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                background: channelState[i] ? c.color : '#1E2F4A', transition: 'background 0.25s',
              }}>
                <div style={{ position: 'absolute', top: '3px', left: channelState[i] ? '18px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'left 0.25s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card anim-up d2" style={{ padding: '18px', marginBottom: '20px' }}>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#EDF2F7', marginBottom: '14px' }}>Notification Preferences</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { label: 'Visitor Check-in', sub: 'Alert when visitor arrives and checks in', key: 'checkin', def: true },
            { label: 'Visitor Check-out', sub: 'Alert when visitor checks out', key: 'checkout', def: true },
            { label: 'New Appointment', sub: 'Notify when new appointment is scheduled', key: 'appointment', def: true },
            { label: 'Service Request', sub: 'Alert on new pantry, parking, AV requests', key: 'service', def: false },
            { label: 'Room Status Change', sub: 'Notify on room availability changes', key: 'room', def: false },
            { label: 'System Alerts', sub: 'Platform updates and maintenance notices', key: 'system', def: true },
          ].map((pref, i, arr) => {
            const [enabled, setEnabled] = useState(pref.def);
            return (
              <div key={pref.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(31,41,55,0.6)' : 'none' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#EDF2F7', marginBottom: '1px' }}>{pref.label}</div>
                  <div style={{ fontSize: '11px', color: '#4A6080' }}>{pref.sub}</div>
                </div>
                <button onClick={() => setEnabled(!enabled)} style={{
                  width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                  background: enabled ? '#1E88E5' : '#1E2F4A', transition: 'background 0.25s',
                }}>
                  <div style={{ position: 'absolute', top: '3px', left: enabled ? '20px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.25s' }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="anim-up d3" style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { val: 'all', label: `All (${items.length})` },
          { val: 'unread', label: `Unread (${unreadCount})` },
          { val: 'checkin', label: 'Check-ins' },
          { val: 'appointment', label: 'Appointments' },
          { val: 'service', label: 'Services' },
          { val: 'alert', label: 'Alerts' },
        ].map(f => (
          <button key={f.val} onClick={() => setFilter(f.val)} style={{
            padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 600,
            background: filter === f.val ? '#1E88E5' : '#0F1A2E',
            color: filter === f.val ? 'white' : '#4A6080',
            
            transition: 'all 0.2s',
          }}>{f.label}</button>
        ))}
      </div>

      {/* Notification List */}
      <div className="card anim-up d4" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#4A6080' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔔</div>
            <div style={{ fontSize: '14px' }}>No notifications found</div>
          </div>
        ) : filtered.map((n, i) => {
          const cfg = typeConfig[n.type] || typeConfig.alert;
          return (
            <div key={n.id} onClick={() => markRead(n.id)} className="notif-item"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(31,41,55,0.5)' : 'none',
                cursor: 'pointer',
                borderLeft: !n.read ? '2px solid #1E88E5' : '2px solid transparent',
                background: !n.read ? 'rgba(30,136,229,0.03)' : 'transparent',
              }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, background: cfg.bg, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{cfg.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '10px', color: cfg.color, background: `${cfg.color}15`, padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>{cfg.label}</span>
                  {!n.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1E88E5', display: 'inline-block' }} />}
                </div>
                <div style={{ fontSize: '13px', color: n.read ? '#4A6080' : '#90A4C0', marginBottom: '3px' }}>{n.message}</div>
                <div style={{ fontSize: '11px', color: '#4A6080' }}>{n.time}</div>
              </div>
              {!n.read && (
                <span style={{ fontSize: '10px', color: '#1E88E5', background: 'rgba(30,136,229,0.1)', padding: '3px 8px', borderRadius: '8px', flexShrink: 0, fontWeight: 600 }}>New</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
