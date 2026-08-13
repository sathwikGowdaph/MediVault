import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity, LayoutGrid, UserCircle2, FileText, ShieldAlert,
  Users, BellRing, LogOut, ShieldCheck, Settings, QrCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const desktopNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/dashboard/records', label: 'Medical Records', icon: FileText },
  { href: '/dashboard/family', label: 'Family', icon: Users },
  { href: '/dashboard/emergency', label: 'Emergency QR', icon: QrCode },
  { href: '/dashboard/profile', label: 'Settings', icon: Settings },
];

const mobileNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid, exact: true },
  { href: '/dashboard/records', label: 'Records', icon: FileText },
  { href: '/dashboard/family', label: 'Family', icon: Users },
  { href: '/dashboard/emergency', label: 'Emergency QR', icon: ShieldAlert },
  { href: '/dashboard/profile', label: 'Settings', icon: UserCircle2 },
];

const pageTitles = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/profile': 'Account Settings & Emergency Profile',
  '/dashboard/records': 'Medical Records Vault',
  '/dashboard/emergency': 'Emergency Readiness & QR Code',
  '/dashboard/family': 'Family Medical Vault',
  '/dashboard/reminders': 'Medication & Care Reminders',
  '/dashboard/admin': 'System Administration'
};

function UserInitials({ name }) {
  const initials = name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || '?';
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-teal-500 text-sm font-bold text-white shadow-sm ring-2 ring-white">
      {initials}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans selection:bg-brand-500 selection:text-white">
      {/* Desktop Slim Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur-xl p-5 shadow-sm lg:flex">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1 border-b border-slate-100 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-500 text-white shadow-md shadow-brand-500/20">
            <Activity size={22} />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight text-base">MediVault</div>
            <div className="text-[11px] font-medium text-brand-600 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping inline-block" /> Secure Medical Vault
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="mt-6 flex-1 space-y-1.5">
          {desktopNavLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.href}
                to={link.href}
                end={link.exact}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`
                }
              >
                <Icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}

          {user?.role === 'admin' && (
            <NavLink
              to="/dashboard/admin"
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              <ShieldCheck size={20} className="shrink-0" />
              <span>Admin Panel</span>
            </NavLink>
          )}
        </nav>

        {/* User Card & Logout at Bottom */}
        <div className="mt-auto border-t border-slate-100 pt-4 space-y-2">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50/80 p-2.5 border border-slate-200/60">
            <UserInitials name={user?.name} />
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-bold text-slate-900">{user?.name || 'User'}</div>
              <div className="truncate text-[11px] font-medium text-slate-500 capitalize">{user?.email || 'patient'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-64 transition-all duration-300">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white lg:hidden">
                <Activity size={18} />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight sm:text-lg">{currentTitle}</h1>
              </div>
            </div>

            {/* Top Right User Badge */}
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-xs font-bold text-slate-900">{user?.name || 'User'}</div>
                <div className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider">{user?.role || 'patient'}</div>
              </div>
              <UserInitials name={user?.name} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation Bar */}
      <nav aria-label="Mobile Navigation" className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-around rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-2 shadow-slate-900/10 lg:hidden">
        {mobileNavLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.exact}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-105 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Icon size={20} className="mb-0.5" />
              <span className="text-[10px] leading-none">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

