import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const MOCK_VISITORS = [
  { id: 1, name: 'Ahmed Al Rashid', company: 'Emirates Group', status: 'inside', date: '2026-04-16', purpose: 'Meeting', checkin: '09:15' },
  { id: 2, name: 'Sarah Johnson', company: 'McKinsey', status: 'checked-out', date: '2026-04-16', purpose: 'Consultation', checkin: '10:00' },
  { id: 3, name: 'Fatima Al Zaabi', company: 'ADNOC', status: 'expected', date: '2026-04-16', purpose: 'Site Visit', checkin: '14:00' },
  { id: 4, name: 'Rajesh Patel', company: 'TCS', status: 'inside', date: '2026-04-16', purpose: 'Interview', checkin: '11:30' },
  { id: 5, name: 'Maria Lopez', company: 'Google', status: 'expected', date: '2026-04-16', purpose: 'Demo', checkin: '15:30' },
];

const VISITOR_CHART_DATA = [
  { day: 'Mon', walkin: 12, appointed: 8 },
  { day: 'Tue', walkin: 15, appointed: 10 },
  { day: 'Wed', walkin: 18, appointed: 12 },
  { day: 'Thu', walkin: 14, appointed: 15 },
  { day: 'Fri', walkin: 20, appointed: 18 },
  { day: 'Sat', walkin: 8, appointed: 5 },
  { day: 'Sun', walkin: 6, appointed: 4 },
];

const MONTHLY_DATA = [
  { month: 'Oct', visitors: 120 },
  { month: 'Nov', visitors: 145 },
  { month: 'Dec', visitors: 180 },
  { month: 'Jan', visitors: 210 },
  { month: 'Feb', visitors: 195 },
  { month: 'Mar', visitors: 230 },
];

const MOCK_ROOMS = [
  { id: 1, name: 'Board Room A', office: 'Dubai HQ', capacity: 12, status: 'occupied' },
  { id: 2, name: 'Conf Room 1', office: 'Dubai HQ', capacity: 8, status: 'available' },
  { id: 3, name: 'Board Room B', office: 'Dubai HQ', capacity: 10, status: 'reserved' },
  { id: 4, name: 'Training Room', office: 'Dubai HQ', capacity: 20, status: 'available' },
  { id: 5, name: 'AV Studio', office: 'Dubai HQ', capacity: 6, status: 'under-maintenance' },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-[12px] px-3 py-2.5 shadow-lg text-[12px] font-[system-ui,sans-serif]">
      <div className="text-slate-400 mb-1.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: <span className="text-slate-700">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const statusStyle = {
  inside: { label: 'Inside', color: '#15803D', bg: '#ECFDF5', border: '#86EFAC' },
  'checked-out': { label: 'Checked Out', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
  expected: { label: 'Expected', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  'no-show': { label: 'No Show', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
};

function getLiveNotifCount() {
  try {
    const bookings = JSON.parse(localStorage.getItem('cgms_bookings') || '[]').filter(b => b.status === 'New').length;
    const walkins = JSON.parse(localStorage.getItem('cgms_walkins') || '[]').length;
    return bookings + walkins;
  } catch {
    return Math.floor(Math.random() * 3) + 1;
  }
}

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [liveCount, setLiveCount] = useState(getLiveNotifCount());
  const [recentWalkins, setRecentWalkins] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1100);

  useEffect(() => {
    const h = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth < 1100);
    };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    const refresh = () => {
      setLiveCount(getLiveNotifCount());
      try {
        const w = JSON.parse(localStorage.getItem('cgms_walkins') || '[]');
        setRecentWalkins(w.slice(0, 3));
      } catch {
        setRecentWalkins(MOCK_VISITORS.slice(0, 3));
      }
    };
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, []);

  const today = MOCK_VISITORS.filter(v => v.date === '2026-04-16');
  const inside = today.filter(v => v.status === 'inside');
  const expected = today.filter(v => v.status === 'expected');
  const available = MOCK_ROOMS.filter(r => r.status === 'available');
  const allRecent = [...recentWalkins.map(w => ({ ...w, _live: true })), ...today.slice(0, 6)].slice(0, 6);

  const metrics = [
    { label: 'Visitors Today', value: today.length, sub: '↑ 18% from yesterday', color: '#6D28D9', icon: '👥' },
    { label: 'Currently Inside', value: inside.length, sub: 'Real-time tracking', color: '#15803D', icon: '📍' },
    { label: 'Expected Today', value: expected.length, sub: 'Next 24 hours', color: '#B45309', icon: '⏰' },
    { label: 'Rooms Available', value: available.length, sub: `of ${MOCK_ROOMS.length} total`, color: '#0369A1', icon: '🏠' },
  ];

  const roomColors = {
    available: '#15803D',
    occupied: '#DC2626',
    reserved: '#B45309',
    'under-maintenance': '#6B7280',
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 bg-slate-50 min-h-full">

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[Outfit,sans-serif] text-[20px] font-extrabold text-[#1E1B4B] mb-1">
            Good morning{user?.name ? `, ${user.name.split(' ')[0]}!` : ''} 👋
          </h2>
          <p className="text-[13px] text-slate-400 font-medium">
            Thursday, April 16 · Dubai HQ ·{' '}
            <span className="text-violet-600 font-semibold">Live Data</span>
          </p>
        </div>
        {liveCount > 0 && (
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] border border-red-200 bg-red-50 text-red-600 font-bold text-[13px] hover:bg-red-100 transition"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            {liveCount} new alert{liveCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white border border-slate-200 rounded-[14px] shadow-sm hover:shadow-md transition p-5 relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{ background: `radial-gradient(circle at top right, ${m.color}, transparent 60%)` }}
            />
            <div className="flex justify-between items-start mb-3">
              <div
                className="w-11 h-11 rounded-[10px] flex items-center justify-center text-xl"
                style={{ background: `${m.color}14`, border: `1px solid ${m.color}20` }}
              >
                {m.icon}
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                ● Live
              </span>
            </div>
            <div className="font-[Outfit,sans-serif] text-[32px] font-extrabold text-[#1E1B4B] leading-none mb-1">
              {m.value}
            </div>
            <div className="text-[13px] font-semibold text-slate-600 mb-0.5">{m.label}</div>
            <div className="text-[12px] font-semibold" style={{ color: m.color }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className={`grid ${isTablet ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-6`}>
        <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm hover:shadow-md transition p-5" style={{ height: 280 }}>
          <div className="mb-4">
            <div className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#1E1B4B]">Weekly Traffic</div>
            <div className="text-[12px] text-slate-400">Walk-ins vs Appointments</div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={VISITOR_CHART_DATA} barSize={18} barGap={4}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(109,40,217,0.06)' }} />
              <Bar dataKey="walkin" fill="#6D28D9" radius={[6, 6, 0, 0]} name="Walk-in" />
              <Bar dataKey="appointed" fill="#10B981" radius={[6, 6, 0, 0]} name="Appointed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm hover:shadow-md transition p-5" style={{ height: 280 }}>
          <div className="mb-4">
            <div className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#1E1B4B]">Monthly Growth</div>
            <div className="text-[12px] text-slate-400">6-month visitor trend</div>
          </div>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={MONTHLY_DATA}>
              <defs>
                <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6D28D9" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6D28D9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#6D28D9"
                strokeWidth={2.5}
                fill="url(#dashGrad)"
                name="Visitors"
                dot={{ fill: '#6D28D9', strokeWidth: 2, r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className={`grid ${isTablet ? 'grid-cols-1' : 'grid-cols-[1fr_340px]'} gap-5`}>

        {/* Recent Visitors Table */}
        <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm hover:shadow-md transition overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <div className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#1E1B4B]">Recent Visitors</div>
            <button
              onClick={() => navigate('/guest-logs')}
              className="px-4 py-2 rounded-[10px] border border-slate-200 bg-white text-slate-700 text-[12px] font-semibold hover:bg-slate-50 transition"
            >
              View All →
            </button>
          </div>

          {isMobile ? (
            <div className="p-4 flex flex-col gap-3">
              {allRecent.slice(0, 4).map(v => {
                const s = statusStyle[v.status] || statusStyle.expected;
                const initials = v.name?.split(' ').slice(0, 2).map(n => n[0]).join('').slice(0, 2) || 'VD';
                return (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 p-3 rounded-[10px] border border-slate-100"
                    style={{ background: v._live ? '#F5F3FF' : '#FAFAFA' }}
                  >
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[12px] font-bold shrink-0"
                      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#1E1B4B] truncate">{v.name}</div>
                      <div className="text-[11px] text-slate-400">{v.company} · {v.purpose}</div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full shrink-0"
                      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Visitor</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">Purpose</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 w-24">Check-in</th>
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 w-32">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allRecent.map(v => {
                    const s = statusStyle[v.status] || statusStyle.expected;
                    const initials = v.name?.split(' ').slice(0, 2).map(n => n[0]).join('').slice(0, 2) || 'VD';
                    return (
                      <tr
                        key={v.id}
                        className="border-t border-slate-100 hover:bg-slate-50 transition"
                        style={{ background: v._live ? 'rgba(109,40,217,0.03)' : 'transparent' }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-[8px] flex items-center justify-center text-[11px] font-bold shrink-0"
                              style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                            >
                              {initials}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-[#1E1B4B]">{v.name}</div>
                              <div className="text-[11px] text-slate-400">{v.company}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[13px] text-slate-600">{v.purpose || 'Meeting'}</td>
                        <td className="px-4 py-3.5 font-mono text-[12px] font-semibold text-slate-600">{v.checkin || '—'}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                          >
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm hover:shadow-md transition p-5">
            <div className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#1E1B4B] mb-4">Quick Actions</div>
            <div className={`grid ${isTablet && !isMobile ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5`}>
              {[
                { icon: '🚶', label: 'New Walk-in', page: '/walkin', color: '#6D28D9' },
                { icon: '📅', label: 'Appointments', page: '/appointments', color: '#15803D' },
                { icon: '⚙️', label: 'Services', page: '/services', color: '#B45309' },
                { icon: '📊', label: 'Reports', page: '/reports', color: '#0369A1' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.page)}
                  className="flex items-center gap-3 p-3.5 rounded-[10px] border border-slate-200 bg-white text-left hover:bg-slate-50 hover:border-violet-200 transition group"
                >
                  <div
                    className="w-10 h-10 rounded-[8px] flex items-center justify-center text-[17px] shrink-0"
                    style={{ background: `${action.color}12`, border: `1px solid ${action.color}20` }}
                  >
                    {action.icon}
                  </div>
                  <span className="text-[13px] font-semibold text-slate-700 flex-1">{action.label}</span>
                  <span className="text-[16px] text-slate-300 group-hover:text-violet-500 transition">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Room Status */}
          <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm hover:shadow-md transition p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="font-[Outfit,sans-serif] text-[15px] font-extrabold text-[#1E1B4B]">Room Status</div>
              <button
                onClick={() => navigate('/rooms')}
                className="px-3 py-1.5 rounded-[8px] border border-slate-200 bg-white text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition"
              >
                All Rooms →
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {MOCK_ROOMS.slice(0, 5).map(room => {
                const color = roomColors[room.status] || '#6B7280';
                return (
                  <div
                    key={room.id}
                    className="flex justify-between items-center p-3 rounded-[10px] border"
                    style={{ borderColor: `${color}20`, background: `${color}04` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#1E1B4B] truncate">{room.name}</div>
                      <div className="text-[11px] text-slate-400">{room.office} · Cap {room.capacity}</div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2"
                      style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}
                    >
                      {room.status.replace('-', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}