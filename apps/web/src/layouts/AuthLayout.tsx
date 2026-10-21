import { Outlet, Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[25%] w-[650px] h-[650px] bg-teal-500/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Back Navigation */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg p-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Homepage</span>
        </Link>

        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1px]">
            <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
              <Compass className="w-4 h-4 text-teal-400" />
            </div>
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            VoyageVista
          </span>
        </Link>
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/80 relative z-10 animate-slide-up">
        <Outlet />
      </div>

      {/* Legal Footer Note */}
      <p className="mt-8 text-center text-xs text-slate-500 max-w-sm">
        Protected by enterprise-grade TLS encryption and strict session tokens.
      </p>
    </div>
  );
}
