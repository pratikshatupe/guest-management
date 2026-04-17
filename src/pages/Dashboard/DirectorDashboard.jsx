import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ls, Badge, MOCK_SERVICES, MOCK_WALKINS, MOCK_APPOINTMENTS, MOCK_ROOMS, VISITOR_CHART_DATA, MONTHLY_DATA } from '../../data/mockData';

const CARD = { background: '#fff', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 6px rgba(109,40,217,0.07)', border: '1px solid #E8E4FF' };

export default function DirectorDashboard({ setActivePage, currentUser }) {
  const [services,     setServices]     = useState(() => ls.get('cgms_services',     MOCK_SERVICES));
  const [walkins,      setWalkins]      = useState(() => ls.get('cgms_walkins',      MOCK_WALKINS));
  const [appointments, setAppointments] = useState(() => ls.get('cgms_appointments', MOCK_APPOINTMENTS));

  useEffect(() => {
    const t = setInterval(() => {
      setServices(ls.get('cgms_services', MOCK_SERVICES));
      setWalkins(ls.get('cgms_walkins', MOCK_WALKINS));
      setAppointments(ls.get('cgms_appointments', MOCK_APPOINTMENTS));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const stats = [
    { label: 'Total Guests Today',       value: walkins.length + appointments.length,                     icon: '👥', color: '#6D28D9', page: 'guest-log'   },
    { label: 'Confirmed Appointments',   value: appointments.filter(a => a.status === 'confirmed').length, icon: '📅', color: '#0891B2', page: 'appointments'},
    { label: 'Rooms Occupied',           value: MOCK_ROOMS.filter(r => r.status === 'occupied').length,   icon: '🏢', color: '#059669', page: 'rooms'       },
    { label: 'Service Requests',         value: services.length,                                           icon: '🛎️', color: '#D97706', page: 'services'    },
    { label: 'Pending Services',         value: services.filter(s => s.status === 'Pending').length,      icon: '⏳', color: '#EF4444', page: 'services'    },
    { label: "Walk-ins Today",           value: walkins.length,                                            icon: '🚶', color: '#7C3AED', page: 'walkin'      },
  ];

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1240, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 30 }}>👑</span>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1E1B4B', margin: 0 }}>Good Morning, {currentUser?.name || 'Director'}</h2>
            <p style={{ fontSize: 13, color: '#9B99C4', margin: '3px 0 0' }}>{today} — Full Platform Overview</p>
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 22, background: '#F5F3FF', border: '1px solid #E8E4FF', fontSize: 12, color: '#6D28D9', fontWeight: 700 }}>
          {currentUser?.icon} {currentUser?.label} · {currentUser?.badge}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} onClick={() => setActivePage(s.page)} style={{ ...CARD, cursor: 'pointer', borderLeft: `4px solid ${s.color}`, transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}22`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 6px rgba(109,40,217,0.07)'; }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, fontFamily: 'Outfit,sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#9B99C4', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ ...CARD, cursor: 'default' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', marginBottom: 16, margin: '0 0 16px' }}>📊 Weekly Visitor Trend</h3>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={VISITOR_CHART_DATA}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9B99C4' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9B99C4' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E8E4FF', fontSize: 12 }} />
              <Area type="monotone" dataKey="visitors" stroke="#7C3AED" fill="#EDE9FE" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...CARD, cursor: 'default' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', margin: '0 0 16px' }}>📈 Monthly Summary</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={MONTHLY_DATA}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9B99C4' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9B99C4' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #E8E4FF', fontSize: 12 }} />
              <Bar dataKey="guests" fill="#7C3AED" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ ...CARD, cursor: 'default' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', margin: '0 0 14px' }}>🚶 Recent Walk-ins</h3>
          {walkins.slice(0, 5).map((w, i) => (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < 4 ? '1px solid #F5F3FF' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{w.name}</div>
                <div style={{ fontSize: 11, color: '#9B99C4' }}>{w.company || '—'}</div>
              </div>
              <Badge status={w.status} />
            </div>
          ))}
          <button onClick={() => setActivePage('walkin')} style={{ marginTop: 12, fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>View All Walk-ins →</button>
        </div>
        <div style={{ ...CARD, cursor: 'default' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E1B4B', margin: '0 0 14px' }}>📅 Upcoming Appointments</h3>
          {appointments.slice(0, 5).map((a, i) => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < 4 ? '1px solid #F5F3FF' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E1B4B' }}>{a.visitorName}</div>
                <div style={{ fontSize: 11, color: '#9B99C4' }}>{a.time} · {a.room}</div>
              </div>
              <Badge status={a.status} />
            </div>
          ))}
          <button onClick={() => setActivePage('appointments')} style={{ marginTop: 12, fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>View All Appointments →</button>
        </div>
      </div>

    </div>
  );
}