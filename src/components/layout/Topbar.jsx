import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  dashboard:     'Dashboard',
  'guest-log':   'Guest Log',
  walkin:        'Walk-in Check-in',
  appointments:  'Appointments',
  rooms:         'Venues & Rooms',
  staff:         'Team & Staff',
  services:      'Services',
  offices:       'Offices',
  notifications: 'Notifications',
  reports:       'Reports & Analytics',
  subscription:  'Subscription Plans',
  admin:         'Admin Panel',
};

const SEARCH_ROUTES = [
  { keywords:['dashboard','home','overview','live','stats'],        page:'dashboard',     label:'Dashboard',            icon:'📊' },
  { keywords:['guest','log','visitor','history','record','check'],  page:'guest-log',     label:'Guest Log',            icon:'📋' },
  { keywords:['walk','walkin','walk-in','new visitor','checkin'],   page:'walkin',        label:'Walk-in Check-in',     icon:'🚶' },
  { keywords:['appointment','schedule','booking','meeting'],        page:'appointments',  label:'Appointments',         icon:'📅' },
  { keywords:['room','venue','board','conference','cabin','hall'],  page:'rooms',         label:'Venues & Rooms',       icon:'🏢' },
  { keywords:['staff','team','employee','user','member','role'],    page:'staff',         label:'Team & Staff',         icon:'👥' },
  { keywords:['service','pantry','parking','av','facility'],        page:'services',      label:'Services & Facilities',icon:'⚙️' },
  { keywords:['office','location','branch','dubai'],                page:'offices',       label:'Offices',              icon:'🌐' },
  { keywords:['notification','alert','bell','message'],             page:'notifications', label:'Notifications',        icon:'🔔' },
  { keywords:['report','analytics','chart','export','data'],        page:'reports',       label:'Reports & Analytics',  icon:'📈' },
  { keywords:['subscription','plan','billing','payment','upgrade'], page:'subscription',  label:'Subscription Plans',   icon:'💎' },
  { keywords:['admin','super','system','platform','global'],        page:'admin',         label:'Admin Panel',          icon:'🛡️' },
];

function getNotifications() {
  try {
    const stored       = JSON.parse(localStorage.getItem('cgms_live_notifs') || '[]');
    const bookings     = JSON.parse(localStorage.getItem('cgms_bookings') || '[]');
    const walkins      = JSON.parse(localStorage.getItem('cgms_walkins') || '[]');
    const appointments = JSON.parse(localStorage.getItem('cgms_appointments') || '[]');

    const live = [
      ...bookings.slice(0,3).map(b => ({
        id:`book-${b.id}`, type:'appointment', read: b.status !== 'New',
        message:`New appointment request from ${b.name} (${b.company || 'No company'}).`,
        time: b.submittedAt || 'Just now',
      })),
      ...walkins.slice(0,3).map(w => ({
        id:`walk-${w.id}`, type:'checkin', read:false,
        message:`${w.name} checked in — ${w.purpose || 'Walk-in'} · ${w.room || 'Reception'}.`,
        time: w.checkin || 'Just now',
      })),
      ...appointments.slice(0,2).map(a => ({
        id:`appt-${a.id}`, type:'appointment', read:false,
        message:`Appointment confirmed: ${a.visitorName} @ ${a.time}.`,
        time: a.date || 'Today',
      })),
      ...stored,
    ];

    if (live.length === 0) {
      return [
        { id:1, type:'checkin',     message:'Mohammed Al Rashid has checked in at Board Room A.',          time:'2 min ago',  read:false },
        { id:2, type:'service',     message:'Pantry request pending for Board Room A — Sneha assigned.',   time:'5 min ago',  read:false },
        { id:3, type:'appointment', message:'New appointment confirmed: Fatima Al Zaabi @ 2:00 PM.',       time:'15 min ago', read:false },
        { id:4, type:'alert',       message:'Conference Room 2 scheduled for maintenance tomorrow.',        time:'1 hr ago',   read:true  },
        { id:5, type:'checkout',    message:'Sarah Johnson checked out — visit duration: 1h 45m.',         time:'2 hr ago',   read:true  },
      ];
    }
    return live.slice(0,10);
  } catch { return []; }
}

export default function Topbar({ 
  activePage, 
  setActivePage, 
  isMobile, 
  onMenuClick, 
  collapsed, 
  setCollapsed,
  user,        // ✅ Added user prop
  onLogout     // ✅ Added onLogout prop
}) {
  const { logout } = useAuth();

  const [showNotif, setShowNotif]           = useState(false);
  const [notifs, setNotifs]                 = useState([]);
  const [search, setSearch]                 = useState('');
  const [suggestions, setSuggestions]       = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIdx, setFocusedIdx]         = useState(-1);

  const searchRef = useRef(null);
  const dropRef   = useRef(null);

  /* Reload notifications every 3s */
  useEffect(() => {
    const load = () => setNotifs(getNotifications());
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);

  /* Search suggestions */
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) { setSuggestions([]); return; }
    const matches = SEARCH_ROUTES.filter(r =>
      r.keywords.some(k => k.includes(q) || q.includes(k)) ||
      r.label.toLowerCase().includes(q)
    );
    setSuggestions(matches.slice(0,6));
  }, [search]);

  const navigate = (page) => {
    setActivePage(page);
    setSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    setFocusedIdx(-1);
  };

  const handleKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown')  { e.preventDefault(); setFocusedIdx(i => Math.min(i+1, suggestions.length-1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setFocusedIdx(i => Math.max(i-1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const t = focusedIdx >= 0 ? suggestions[focusedIdx] : suggestions[0];
      if (t) navigate(t.page);
    } else if (e.key === 'Escape') { setShowSuggestions(false); setSearch(''); }
  };

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current   && !dropRef.current.contains(e.target))   setShowNotif(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifs.filter(n => !n.read).length;
  const typeIcon = { checkin:'✅', checkout:'🚪', service:'☕', appointment:'📅', alert:'⚠️' };

  // ✅ SAFE USER AVATAR FUNCTION
  const getUserInitial = (user) => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ').filter(Boolean);
    return names[0]?.charAt(0)?.toUpperCase() || 'U';
  };

  return (
    <>
      <style>{`
        .topbar-root {
          height: 60px;
          background: #1E1B4B;
          border-bottom: 1px solid rgba(139,92,246,0.2);
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 10px;
          position: sticky;
          top: 0;
          z-index: 50;
          flex-shrink: 0;
        }
        .topbar-root::before {
          content:'';
          position:absolute; top:0; left:0; right:0; height:2px;
          background: linear-gradient(90deg, #6D28D9, #8B5CF6, #06B6D4);
        }
        .topbar-menu-btn { transition: border-color 0.2s, background 0.2s; }
        .topbar-menu-btn:hover { border-color: #8B5CF6 !important; background: rgba(109,40,217,0.18) !important; }
        .topbar-menu-btn:hover span { background: #C4B5FD !important; }
        .topbar-notif-btn { transition: border-color 0.2s; }
        .topbar-notif-btn:hover { border-color: rgba(139,92,246,0.5) !important; }
        .topbar-user-btn { transition: border-color 0.2s, background 0.2s; }
        .topbar-user-btn:hover { border-color: #EF4444 !important; background: rgba(229,57,53,0.1) !important; }
        .search-suggestion-item:hover { background: rgba(109,40,217,0.1) !important; }
        .notif-item:hover { background: rgba(109,40,217,0.08) !important; }
        @keyframes slideDown {
          from { opacity:0; transform: translateY(-8px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .dropdown-anim { animation: slideDown 0.18s ease; }
        @keyframes notifPopIn {
          0%   { transform: scale(0); opacity:0; }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); opacity:1; }
        }
        .notif-badge { animation: notifPopIn 0.35s ease; }
      `}</style>

      <header className="topbar-root">
        {/* Hamburger / Sidebar toggle */}
        <button
          onClick={isMobile ? onMenuClick : () => setCollapsed?.(c => !c)}
          title={isMobile ? 'Open menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="topbar-menu-btn"
          style={{
            width:'34px', height:'34px', flexShrink:0,
            background:'rgba(109,40,217,0.12)',
            border:'1px solid rgba(139,92,246,0.25)',
            borderRadius:'9px', cursor:'pointer',
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:'4px',
            padding:0,
          }}
        >
          {[0,1,2].map(i => (
            <span key={i} style={{
              display:'block',
              width: i === 1 ? '10px' : '14px',
              height:'1.5px',
              background:'#C4B5FD',
              borderRadius:'2px',
              transition:'all 0.2s',
            }} />
          ))}
        </button>

        {/* Page title */}
        <div style={{ flex:1, minWidth:0 }}>
          <h1 style={{
            fontFamily:'Outfit, sans-serif',
            fontSize:'15px', fontWeight:700,
            color:'#EDE9FE',
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            margin:0,
          }}>
            {PAGE_TITLES[activePage] || 'Dashboard'}
          </h1>
        </div>

        {/* Search */}
        <div ref={searchRef} style={{ position:'relative', flexShrink:0 }}>
          <div style={{
            display:'flex', alignItems:'center', gap:'8px',
            padding:'7px 12px',
            background:'rgba(109,40,217,0.12)',
            border:`1px solid ${showSuggestions ? '#8B5CF6' : 'rgba(139,92,246,0.25)'}`,
            borderRadius:'9px', transition:'border-color 0.2s',
            width: isMobile ? '120px' : '220px',
          }}>
            <span style={{ fontSize:'13px', flexShrink:0 }}>🔍</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSuggestions(true); setFocusedIdx(-1); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={isMobile ? 'Search…' : 'Search pages… (Enter)'}
              style={{
                background:'transparent', border:'none', outline:'none',
                fontSize:'12px', color:'#EDE9FE', width:'100%', fontFamily:'inherit',
              }}
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setSuggestions([]); }}
                title="Clear search"
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  color:'rgba(167,139,250,0.6)', padding:0, fontSize:'14px',
                  flexShrink:0, lineHeight:1,
                }}
              >
                ×
              </button>
            )}
            {!search && !isMobile && (
              <span style={{
                fontSize:'10px', color:'rgba(167,139,250,0.5)',
                background:'rgba(109,40,217,0.15)', padding:'1px 5px',
                borderRadius:'4px', flexShrink:0,
              }}>⌘K</span>
            )}
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="dropdown-anim" style={{
              position:'absolute', top:'42px', left:0, right:0,
              background:'#1E1B4B',
              border:'1px solid rgba(139,92,246,0.3)',
              borderRadius:'12px',
              boxShadow:'0 16px 40px rgba(0,0,0,0.6)',
              zIndex:300, overflow:'hidden',
            }}>
              <div style={{
                padding:'6px 10px 4px',
                fontSize:'10px', color:'rgba(167,139,250,0.5)',
                fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em',
              }}>
                Navigate to
              </div>
              {suggestions.map((s, i) => (
                <div
                  key={s.page}
                  onMouseDown={() => navigate(s.page)}
                  className="search-suggestion-item"
                  style={{
                    display:'flex', alignItems:'center', gap:'10px',
                    padding:'10px 12px', cursor:'pointer',
                    background: i === focusedIdx ? 'rgba(109,40,217,0.18)' : 'transparent',
                    borderLeft: i === focusedIdx ? '2px solid #8B5CF6' : '2px solid transparent',
                    transition:'all 0.1s',
                  }}
                >
                  <span style={{ fontSize:'16px' }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:600, color:'#EDE9FE' }}>{s.label}</div>
                    <div style={{ fontSize:'10px', color:'rgba(167,139,250,0.5)' }}>Press Enter to navigate</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notification bell */}
        <div ref={dropRef} style={{ position:'relative', flexShrink:0 }}>
          <button
            onClick={() => setShowNotif(v => !v)}
            className="topbar-notif-btn"
            style={{
              width:'36px', height:'36px', borderRadius:'9px',
              background:'rgba(109,40,217,0.12)',
              border:'1px solid rgba(139,92,246,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', position:'relative', fontSize:'15px',
            }}
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="notif-badge" style={{
                position:'absolute', top:'-3px', right:'-3px',
                minWidth:'16px', height:'16px', background:'#DC2626',
                borderRadius:'8px', fontSize:'9px', fontWeight:700, color:'white',
                display:'flex', alignItems:'center', justifyContent:'center',
                border:'2px solid #1E1B4B', padding:'0 3px',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotif && (
            <div className="dropdown-anim" style={{
              position:'absolute', top:'44px', right:0,
              width:'min(360px, 90vw)',
              background:'#1E1B4B',
              border:'1px solid rgba(139,92,246,0.3)',
              borderRadius:'14px',
              boxShadow:'0 20px 50px rgba(0,0,0,0.7)',
              zIndex:300, overflow:'hidden',
            }}>
              {/* Header */}
              <div style={{
                padding:'14px 16px',
                borderBottom:'1px solid rgba(139,92,246,0.15)',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontFamily:'Outfit, sans-serif', fontSize:'13px', fontWeight:700, color:'#EDE9FE' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span style={{
                      fontSize:'10px', background:'#DC2626', color:'white',
                      padding:'2px 7px', borderRadius:'10px', fontWeight:700,
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { setShowNotif(false); setActivePage('notifications'); }}
                  style={{
                    fontSize:'11px', color:'#8B5CF6', background:'none',
                    border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:600,
                  }}
                >
                  View All
                </button>
              </div>

              {/* List */}
              <div style={{ maxHeight:'340px', overflowY:'auto' }}>
                {notifs.length === 0 ? (
                  <div style={{ padding:'28px', textAlign:'center', color:'rgba(167,139,250,0.5)', fontSize:'13px' }}>
                    No notifications yet.
                  </div>
                ) : notifs.slice(0,8).map((n, i) => (
                  <div
                    key={n.id}
                    className="notif-item"
                    style={{
                      padding:'11px 16px',
                      display:'flex', gap:'10px', alignItems:'flex-start',
                      borderBottom: i < Math.min(notifs.length,8)-1 ? '1px solid rgba(139,92,246,0.1)' : 'none',
                      background: !n.read ? 'rgba(109,40,217,0.06)' : 'transparent',
                      borderLeft: !n.read ? '2px solid #8B5CF6' : '2px solid transparent',
                      cursor:'pointer', transition:'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize:'16px', flexShrink:0, marginTop:'1px' }}>{typeIcon[n.type] || '📢'}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{
                        fontSize:'12px',
                        color: n.read ? 'rgba(167,139,250,0.4)' : 'rgba(196,181,253,0.85)',
                        lineHeight:1.5, marginBottom:'3px',
                      }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize:'10px', color:'rgba(167,139,250,0.4)' }}>{n.time}</div>
                    </div>
                    {!n.read && (
                      <div style={{
                        width:'6px', height:'6px', borderRadius:'50%',
                        background:'#8B5CF6', flexShrink:0, marginTop:'5px',
                      }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(139,92,246,0.15)' }}>
                <button
                  onClick={() => { setShowNotif(false); setActivePage('notifications'); }}
                  style={{
                    width:'100%', padding:'8px', borderRadius:'8px',
                    border:'1px solid rgba(139,92,246,0.25)',
                    background:'transparent', color:'rgba(196,181,253,0.7)',
                    cursor:'pointer', fontSize:'12px', fontFamily:'inherit', fontWeight:600,
                    transition:'all 0.2s',
                  }}
                  onMouseEnter={e => { 
                    e.currentTarget.style.background='rgba(109,40,217,0.15)'; 
                    e.currentTarget.style.color='#C4B5FD'; 
                  }}
                  onMouseLeave={e => { 
                    e.currentTarget.style.background='transparent'; 
                    e.currentTarget.style.color='rgba(196,181,253,0.7)'; 
                  }}
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar / Log Out - ✅ FIXED NULL ERROR */}
        {user ? (
          <button
            onClick={onLogout || logout}
            title="Log Out"
            className="topbar-user-btn"
            style={{
              display:'flex', alignItems:'center', gap:'8px',
              padding:'5px 10px',
              background:'rgba(109,40,217,0.12)',
              border:'1px solid rgba(139,92,246,0.25)',
              borderRadius:'9px',
              cursor:'pointer', transition:'all 0.2s',
              fontFamily:'inherit', flexShrink:0,
            }}
          >
            <div style={{
              width:'24px', height:'24px', borderRadius:'7px',
              background:'rgba(139,92,246,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'9px', fontWeight:700, color:'#A78BFA',
              fontFamily:'Outfit, sans-serif',
            }}>
              {getUserInitial(user)}
            </div>
            {!isMobile && (
              <span style={{ 
                fontSize:'12px', 
                fontWeight:600, 
                color:'rgba(196,181,253,0.8)',
                maxWidth: '80px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user.name || 'User'}
              </span>
            )}
          </button>
        ) : (
          <div style={{
            width:'36px', height:'36px', borderRadius:'9px',
            background:'rgba(139,92,246,0.12)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            👤
          </div>
        )}
      </header>
    </>
  );
}