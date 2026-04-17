import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Landing from './pages/Landing/index';
import Login from './pages/Login';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';

import Dashboard from './pages/Dashboard';
import GuestLog from './pages/GuestLog/index';
import WalkIn from './pages/WalkIn/index';
import Appointments from './pages/Appointments/index';
import Rooms from './pages/Rooms/index';
import Staff from './pages/Staff/index';
import Services from './pages/Services/index';
import Offices from './pages/Offices/index';
import Reports from './pages/Reports/index';
import Notifications from './pages/Notifications/index';
import Settings from './pages/setting/Settings';
import Subscription from './pages//Subscription/index';
import Admin from './pages/Admin/index';
import RolesPermissions from './pages/rolepermission/RolePermission';

import { useAuth } from './context/AuthContext';

const PAGE_TO_PATH = {
  dashboard: '/',
  'guest-log': '/guest-logs',
  walkin: '/walkin',
  appointments: '/appointments',
  rooms: '/rooms',
  staff: '/staff',
  services: '/services',
  offices: '/offices',
  notifications: '/notifications',
  reports: '/reports',
  settings: '/settings',
  subscription: '/subscription',
  admin: '/admin',
  'roles-permissions': '/roles-permissions',
};

const PATH_TO_PAGE = {
  '/': 'dashboard',
  '/guest-logs': 'guest-log',
  '/walkin': 'walkin',
  '/appointments': 'appointments',
  '/rooms': 'rooms',
  '/staff': 'staff',
  '/services': 'services',
  '/offices': 'offices',
  '/notifications': 'notifications',
  '/reports': 'reports',
  '/settings': 'settings',
  '/subscription': 'subscription',
  '/admin': 'admin',
  '/roles-permissions': 'roles-permissions',
};

function NotFoundPage({ onGoHome }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">The page you requested does not exist.</p>
      <button onClick={onGoHome} className="mt-5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">Go to Dashboard</button>
    </div>
  );
}

export default function App() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [view, setView] = useState('landing');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const activePage = PATH_TO_PAGE[location.pathname] || 'dashboard';

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setView(user ? 'app' : 'landing');
  }, [user]);

  const handlePageChange = (page) => {
    const nextPath = PAGE_TO_PATH[page];
    if (!nextPath) return;
    navigate(nextPath);
    if (isMobile) setMobileOpen(false);
  };

  const handleLoginSuccess = (role) => {
    login(role);
    setView('app');
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    setView('landing');
    navigate('/');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard user={user} setActivePage={handlePageChange} />;
      case 'guest-log': return <GuestLog user={user} setActivePage={handlePageChange} />;
      case 'walkin': return <WalkIn user={user} setActivePage={handlePageChange} />;
      case 'appointments': return <Appointments user={user} setActivePage={handlePageChange} />;
      case 'rooms': return <Rooms user={user} setActivePage={handlePageChange} />;
      case 'staff': return <Staff user={user} setActivePage={handlePageChange} />;
      case 'services': return <Services user={user} setActivePage={handlePageChange} />;
      case 'offices': return <Offices user={user} setActivePage={handlePageChange} />;
      case 'notifications': return <Notifications user={user} setActivePage={handlePageChange} />;
      case 'reports': return <Reports user={user} setActivePage={handlePageChange} />;
      case 'settings': return <Settings user={user} setActivePage={handlePageChange} />;
      case 'subscription': return <Subscription user={user} setActivePage={handlePageChange} />;
      case 'admin': return <Admin user={user} setActivePage={handlePageChange} />;
      case 'roles-permissions': return <RolesPermissions tenantId={user?.tenantId || 'org_1'} />;
      default: return <NotFoundPage onGoHome={() => navigate('/')} />;
    }
  };

  if (view === 'landing') return <Landing onEnterApp={() => setView('login')} />;
  if (view === 'login') return <Login onBackToLanding={() => setView('landing')} onLogin={handleLoginSuccess} />;

  const sidebarWidth = isMobile ? 0 : collapsed ? 72 : 260;

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[#F8F7FF]">
      {isMobile && mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-[99] bg-black/50" />}
      <Sidebar activePage={activePage} setActivePage={handlePageChange} collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col transition-all duration-300" style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        <Topbar activePage={activePage} setActivePage={handlePageChange} isMobile={isMobile} onMenuClick={() => setMobileOpen(true)} collapsed={collapsed} setCollapsed={setCollapsed} user={user} onLogout={handleLogout} />
        <main className="flex-1 w-full min-w-0 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{renderPage()}</main>
      </div>
    </div>
  );
}
