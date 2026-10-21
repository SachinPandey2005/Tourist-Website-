import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { ShieldAlert, Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button.js';

export const AdminRoute: React.FC = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center space-y-4 font-sans text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1px] animate-pulse">
          <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
            <Compass className="w-6 h-6 text-teal-400 animate-spin" />
          </div>
        </div>
        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Verifying administrative privileges...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Access Denied (403 Forbidden)</h1>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          The administrative console requires elevated security permissions. Your account is
          currently designated as a Traveler profile without system administration clearance.
        </p>
        <Link to="/dashboard">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Traveler Portal
          </Button>
        </Link>
      </div>
    );
  }

  return <Outlet />;
};
