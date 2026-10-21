import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Compass } from 'lucide-react';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
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
          Verifying traveler credentials...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
