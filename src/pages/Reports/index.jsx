import React, { useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { VISITOR_CHART_DATA, MONTHLY_DATA, OFFICE_CHART_DATA } from '../../data/mockData';

const T2 = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div style={{ background: '#172240', border: '1px solid #1E2F4A', borderRadius: '8px', padding: '10px 14px' }}>
      <div style={{ fontSize: '11px', color: '#4A6080', marginBottom: '5px' }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ fontSize: '12px', color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>)}
    </div>
  );
  return null;
};

const COLORS = ['#1E88E5', '#00897B', '#7E57C2'];

export default function Reports() {
  const [period, setPeriod] = useState('week');

  return (
    <div style={{ padding: '20px', maxWidth: '1300px' }}>
      <div className="anim-fade" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: '#EDF2F7', marginBottom: '3px' }}>Reports & Analytics</h2>
          <p style={{ fontSize: '13px', color: '#4A6080' }}>Visitor trends and office performance</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['week', 'month', 'quarter'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '7px 14px', borderRadius: '8px', border: period === p ? 'none' : '1px solid #1E2F4A', background: period === p ? '#1E88E5' : '#0F1A2E', color: period === p ? 'white' : '#4A6080', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s' }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
          <button className="btn btn-secondary" style={{ fontSize: '12px' }}>📥 Export</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Visitors', val: '4,284', delta: '+14%', color: '#1E88E5' },
          { label: 'Avg Daily', val: '142', delta: '+8%', color: '#00897B' },
          { label: 'Peak Day', val: 'Friday', delta: 'Consistent', color: '#7E57C2' },
          { label: 'Walk-in Rate', val: '38%', delta: '-2%', color: '#F57C00' },
          { label: 'No-Show Rate', val: '5.2%', delta: '-1%', color: '#E53935' },
        ].map((k, i) => (
          <div key={k.label} className={`card anim-up d${i + 1}`} style={{ padding: '16px' }}>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 900, color: k.color, marginBottom: '3px' }}>{k.val}</div>
            <div style={{ fontSize: '12px', color: '#90A4C0', marginBottom: '4px' }}>{k.label}</div>
            <div style={{ fontSize: '11px', color: k.delta.startsWith('+') ? '#43A047' : k.delta.startsWith('-') ? '#E53935' : '#4A6080' }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div className="card anim-up d2" style={{ padding: '18px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#EDF2F7', marginBottom: '3px' }}>Weekly Visitor Traffic</div>
          <div style={{ fontSize: '11px', color: '#4A6080', marginBottom: '16px' }}>Walk-ins vs Pre-appointed</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={VISITOR_CHART_DATA} barSize={10} barGap={2}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#4B5563' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#4B5563' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<T2 />} cursor={{ fill: 'rgba(30,136,229,0.05)' }} />
              <Bar dataKey="walkin" fill="#1E88E5" radius={[4,4,0,0]} name="Walk-in" />
              <Bar dataKey="appointed" fill="#00897B" radius={[4,4,0,0]} name="Appointed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card anim-up d3" style={{ padding: '18px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#EDF2F7', marginBottom: '3px' }}>6-Month Growth</div>
          <div style={{ fontSize: '11px', color: '#4A6080', marginBottom: '16px' }}>Monthly visitor count trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_DATA}>
              <defs>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1E88E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#4B5563' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#4B5563' }} axisLine={false} tickLine={false} width={32} />
              <Tooltip content={<T2 />} />
              <Area type="monotone" dataKey="visitors" stroke="#1E88E5" strokeWidth={2} fill="url(#grad2)" name="Visitors" dot={{ fill: '#1E88E5', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Office Breakdown + Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '14px' }}>
        <div className="card anim-up d4" style={{ padding: '18px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#EDF2F7', marginBottom: '16px' }}>Office Performance</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Office</th><th>Visitors</th><th>Avg Daily</th><th>Walk-in %</th><th>No-show %</th><th>Performance</th></tr></thead>
              <tbody>
                {[
                  { office: 'Dubai HQ', visitors: 2418, avg: 81, walkin: 42, noshow: 4 },
                  { office: 'Abu Dhabi', visitors: 1190, avg: 40, walkin: 35, noshow: 6 },
                  { office: 'Sharjah', visitors: 676, avg: 23, walkin: 28, noshow: 7 },
                ].map(o => (
                  <tr key={o.office}>
                    <td style={{ fontWeight: 600, color: '#EDF2F7' }}>{o.office}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{o.visitors.toLocaleString()}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{o.avg}/day</td>
                    <td style={{ fontSize: '12px', color: '#1E88E5', fontWeight: 600 }}>{o.walkin}%</td>
                    <td style={{ fontSize: '12px', color: '#E53935', fontWeight: 600 }}>{o.noshow}%</td>
                    <td>
                      <div style={{ height: '5px', width: '80px', background: '#1E2F4A', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(o.visitors / 2418) * 100}%`, background: '#1E88E5', borderRadius: '3px' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card anim-up d5" style={{ padding: '18px' }}>
          <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '13px', fontWeight: 700, color: '#EDF2F7', marginBottom: '16px' }}>Office Split</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={OFFICE_CHART_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="visitors" paddingAngle={3}>
                {OFFICE_CHART_DATA.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Visitors']} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {OFFICE_CHART_DATA.map((o, i) => (
              <div key={o.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: COLORS[i] }} />
                  <span style={{ fontSize: '11px', color: '#90A4C0' }}>{o.name}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#EDF2F7' }}>{o.visitors}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
