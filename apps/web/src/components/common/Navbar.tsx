import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Compass, Menu, X, User } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { cn } from '../../lib/utils.js';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Destinations', to: '/destinations' },
    { label: 'Tours', to: '/tours' },
    { label: 'Hotels', to: '/hotels' },
    { label: 'Activities', to: '/activities' },
    { label: 'Dashboard', to: '/dashboard' },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-brand-400 rounded-xl"
          aria-label="VoyageVista Home"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1px] shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
              <Compass className="w-5 h-5 text-teal-400 animate-pulse-subtle" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                VoyageVista
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              Curated World Expeditions
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-400',
                  isActive
                    ? 'text-teal-300 bg-teal-500/10 border border-teal-500/20 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" leftIcon={<User className="w-4 h-4" />}>
              Sign In
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Explore Now
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand-400"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-6 space-y-4 animate-slide-down">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" size="md" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="md" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
