import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, NOTIFICATIONS } from '../../data/mockData';

const NAV = [
  { path: 'dashboard', label: 'Dashboard', icon: '⬛', roles: ['all'] },
  { path: 'guest-log', label: 'Guest Log', icon: '📋', roles: ['all'] },
  { path: 'walkin', label: 'Walk-in Check-in', icon: '🚶', roles: [ROLES.RECEPTION, ROLES.MANAGER, ROLES.DIRECTOR, ROLES.SUPER_ADMIN] },
  { path: 'appointments', label: 'Appointments', icon: '📅', roles: [ROLES.MANAGER, ROLES.DIRECTOR, ROLES.SUPER_ADMIN, ROLES.RECEPTION] },
  { path: 'rooms', label: 'Venues & Rooms', icon: '🏢', roles: [ROLES.MANAGER, ROLES.DIRECTOR, ROLES.SUPER_ADMIN] },
  { path: 'staff', label: 'Team & Staff', icon: '👥', roles: [ROLES.MANAGER, ROLES.DIRECTOR, ROLES.SUPER_ADMIN] },
  { path: 'services', label: 'Services', icon: '⚙️', roles: ['all'] },
  { path: 'offices', label: 'Offices', icon: '🌐', roles: [ROLES.DIRECTOR, ROLES.SUPER_ADMIN] },
  { path: 'notifications', label: 'Notifications', icon: '🔔', roles: ['all'], badge: true },
  { path: 'reports', label: 'Reports', icon: '📊', roles: [ROLES.MANAGER, ROLES.DIRECTOR, ROLES.SUPER_ADMIN] },
  { path: 'settings', label: 'Settings', icon: '🔧', roles: ['all'] },
  { path: 'subscription', label: 'Subscription', icon: '💎', roles: [ROLES.DIRECTOR, ROLES.SUPER_ADMIN] },
  { path: 'admin', label: 'Admin Panel', icon: '🛡️', roles: [ROLES.SUPER_ADMIN] },
  { path: 'roles-permissions', label: 'Roles & Permissions', icon: '🔐', roles: [ROLES.SUPER_ADMIN, ROLES.DIRECTOR] },
];

const roleColors = {
  [ROLES.SUPER_ADMIN]: '#A78BFA',
  [ROLES.DIRECTOR]: '#60A5FA',
  [ROLES.MANAGER]: '#34D399',
  [ROLES.SERVICE_STAFF]: '#FBBF24',
  [ROLES.RECEPTION]: '#22D3EE',
};

const roleLabels = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.DIRECTOR]: 'Director',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.SERVICE_STAFF]: 'Service Staff',
  [ROLES.RECEPTION]: 'Reception',
};

export default function Sidebar({
  activePage,
  setActivePage,
  collapsed,
  setCollapsed,
  isMobile,
  mobileOpen,
  onMobileClose,
}) {
  const { user, logout } = useAuth();

  const allowed = useMemo(() => {
    const userRole = user?.role;
    return NAV.filter((n) => n.roles.includes('all') || n.roles.includes(userRole));
  }, [user?.role]);

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;
  const isExpanded = isMobile ? true : !collapsed;
  const sidebarWidthClass = isMobile ? 'w-[260px]' : collapsed ? 'w-[72px]' : 'w-[260px]';

  if (isMobile && !mobileOpen) return null;

  const handleNavClick = (path) => {
    setActivePage(path);
    if (isMobile && onMobileClose) onMobileClose();
  };

  return (
    <>
      {isMobile && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-[99] bg-black/55 backdrop-blur-[2px]"
        />
      )}

      <aside
        className={[
          'fixed left-0 top-0 bottom-0 z-[100] flex min-h-screen flex-col overflow-x-hidden overflow-y-auto',
          'border-r border-violet-500/15',
          'bg-gradient-to-b from-[#1E1B4B] via-[#18164A] to-[#130F3D]',
          'transition-[width] duration-300 ease-in-out',
          'shadow-none',
          isMobile ? 'shadow-[4px_0_24px_rgba(0,0,0,0.4)]' : '',
          sidebarWidthClass,
        ].join(' ')}
      >
        <div className="h-[2px] flex-shrink-0 bg-gradient-to-r from-violet-600 via-violet-500 to-cyan-400" />

        <div className="flex min-h-[58px] flex-shrink-0 items-center gap-3 overflow-hidden border-b border-violet-500/15 p-3.5">
          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-violet-600 to-violet-500 text-[16px] font-extrabold text-white shadow-[0_0_16px_rgba(109,40,217,0.5)]">
            G
          </div>

          {isExpanded && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="whitespace-nowrap font-[Outfit,sans-serif] text-[14px] font-bold leading-[1.2] text-[#EDE9FE]">
                CorpGMS
              </div>
              <div className="whitespace-nowrap text-[10px] text-violet-300/60">
                Guest Management
              </div>
            </div>
          )}

          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="ml-auto rounded-[6px] border-0 bg-transparent px-[6px] py-1 text-[12px] text-violet-300/50 transition-colors duration-200 hover:bg-violet-500/20 hover:text-violet-300"
              type="button"
            >
              {collapsed ? '→' : '←'}
            </button>
          )}

          {isMobile && (
            <button
              onClick={onMobileClose}
              className="ml-auto rounded-[6px] border-0 bg-transparent px-2 py-1 text-[18px] leading-none text-violet-300/50"
              type="button"
            >
              ×
            </button>
          )}
        </div>

        <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
          {allowed.map((item) => {
            const active = activePage === item.path;
            const isNotif = item.badge && unreadCount > 0;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavClick(item.path)}
                title={collapsed && !isMobile ? item.label : undefined}
                className={[
                  'sidebar-nav-btn mb-[2px] flex w-full items-center gap-2 rounded-[8px] border-0 px-[11px] py-[9px] text-left font-inherit',
                  'relative overflow-hidden transition-all duration-150',
                  active ? 'nav-active-btn' : 'border-l-2 border-l-transparent bg-transparent text-violet-300/55',
                ].join(' ')}
              >
                <span className="relative flex w-[20px] flex-shrink-0 justify-center text-[15px]">
                  {item.icon}
                  {isNotif && !isExpanded && (
                    <span className="absolute -right-[4px] -top-[4px] h-2 w-2 rounded-full border border-[#1E1B4B] bg-red-600" />
                  )}
                </span>

                {isExpanded && (
                  <span
                    className={[
                      'flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px]',
                      active ? 'font-semibold text-[#C4B5FD]' : 'font-normal',
                    ].join(' ')}
                  >
                    {item.label}
                  </span>
                )}

                {isExpanded && isNotif && (
                  <span className="min-w-[18px] rounded-full bg-red-600 px-1.5 py-[2px] text-center text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {user && (
          <div className="flex-shrink-0 border-t border-violet-500/15 p-2">
            <div className="flex items-center gap-[9px] overflow-hidden rounded-[8px] border border-violet-500/20 bg-violet-600/10 px-[10px] py-[9px]">
              <div
                className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[8px] border text-[10px] font-bold"
                style={{
                  background: `${roleColors[user.role]}20`,
                  borderColor: `${roleColors[user.role]}40`,
                  color: roleColors[user.role],
                  fontFamily: 'Outfit, sans-serif',
                }}
              >
                {user.avatar}
              </div>

              {isExpanded && (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-semibold text-[#EDE9FE]">
                      {user.name}
                    </div>
                    <div className="text-[10px]" style={{ color: roleColors[user.role] }}>
                      {roleLabels[user.role]}
                    </div>
                  </div>

                  <button
                    onClick={logout}
                    title="Log Out"
                    type="button"
                    className="rounded-[5px] border-0 bg-transparent p-[3px] text-[13px] text-violet-300/50 transition-all duration-150 hover:bg-red-600/15 hover:text-red-500"
                  >
                    ⏏
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      <style>{`
        .sidebar-nav-btn:hover:not(.nav-active-btn) {
          background: rgba(109,40,217,0.12) !important;
          color: #C4B5FD !important;
        }
        .nav-active-btn {
          background: linear-gradient(90deg, rgba(109,40,217,0.25), rgba(109,40,217,0.12)) !important;
          color: #C4B5FD !important;
          border-left: 2px solid #8B5CF6 !important;
        }
        .sidebar-collapse-btn:hover {
          background: rgba(109,40,217,0.2) !important;
          color: #A78BFA !important;
        }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.4); }
      `}</style>
    </>
  );
}