import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  LayoutDashboard,
  CalendarCheck,
  Heart,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Users,
  CreditCard,
  Layers,
  Tag,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../lib/utils.js';
import { useAuth } from '../context/AuthContext.js';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const travelerNavItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'My Bookings', to: '/dashboard/bookings', icon: CalendarCheck },
    { label: 'Saved Expeditions', to: '/dashboard/favorites', icon: Heart },
    { label: 'Profile Settings', to: '/dashboard/profile', icon: User },
  ];

  const adminNavItems = [
    { label: 'Platform Stats', to: '/admin', icon: Shield },
    { label: 'Booking Desk', to: '/admin/bookings', icon: CalendarCheck },
    { label: 'User Directory', to: '/admin/users', icon: Users },
    { label: 'Payments & Refunds', to: '/admin/payments', icon: CreditCard },
    { label: 'Catalog Inventory', to: '/admin/inventory', icon: Layers },
    { label: 'Coupons & Promos', to: '/admin/coupons', icon: Tag },
    { label: 'Review Moderation', to: '/admin/reviews', icon: Star },
  ];

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'VV';

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex font-sans">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-300 md:static md:translate-x-0 shrink-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-slate-800/80">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1px]">
              <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                <Compass className="w-4 h-4 text-teal-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                VoyageVista
              </span>
              <span className="text-[10px] text-teal-400 font-semibold tracking-wider uppercase mt-1 block">
                {isAdmin ? 'Management Console' : 'Traveler Portal'}
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {/* Traveler Navigation */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Traveler Workspace
            </div>
            <div className="space-y-1">
              {travelerNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/dashboard'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold shadow-sm shadow-teal-500/5'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Admin Navigation (Shown only if authenticated user is ADMIN) */}
          {isAdmin && (
            <div className="pt-2 border-t border-slate-900">
              <div className="px-3 mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <span>Admin Console</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 text-[9px] border border-amber-400/20">
                  STAFF
                </span>
              </div>
              <div className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin'}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold shadow-sm shadow-amber-500/5'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          {user && (
            <div className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 font-bold text-xs shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <Link
            to="/"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <span>Public Website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-18 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span className="text-slate-300">{isAdmin ? 'Admin Console' : 'Traveler Portal'}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{user?.role || 'TOURIST'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Admin Clearance
              </span>
            )}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md">
              {userInitials}
            </div>
          </div>
        </header>

        {/* Dashboard Page View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
