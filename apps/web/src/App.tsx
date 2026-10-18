import { useState, useEffect } from 'react';
import { 
  Compass, 
  Server, 
  Layers, 
  CheckCircle2, 
  RefreshCw, 
  Globe, 
  ArrowUpRight, 
  ShieldCheck, 
  Terminal,
  Activity
} from 'lucide-react';
import type { HealthCheckResponse } from '@tourist/shared';

export default function App() {
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchHealth = async () => {
    setHealthStatus('loading');
    setErrorMessage(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/health`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      const data: HealthCheckResponse = await response.json();
      setHealthData(data);
      setHealthStatus('success');
    } catch (err: unknown) {
      setHealthStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to reach API server');
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Background Glow Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[20%] w-[550px] h-[550px] bg-teal-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[10%] right-[15%] w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090D16]/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1px] shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-[#090D16] rounded-xl flex items-center justify-center">
                <Compass className="w-5 h-5 text-teal-400 animate-pulse-subtle" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-teal-300 bg-clip-text text-transparent">
                VoyageVista
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-800/80 text-teal-300">
                Phase 1 Core
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div 
              id="api-status-badge"
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                healthStatus === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 shadow-sm shadow-emerald-900/30'
                  : healthStatus === 'loading'
                  ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                healthStatus === 'success' 
                  ? 'bg-emerald-400 animate-ping' 
                  : healthStatus === 'loading' 
                  ? 'bg-amber-400' 
                  : 'bg-slate-500'
              }`} />
              <span>
                {healthStatus === 'success' ? 'API Online' : healthStatus === 'loading' ? 'Checking API...' : 'API Standby'}
              </span>
            </div>

            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            >
              Repository <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-medium text-slate-300 mb-8 shadow-inner">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Full-Stack Architecture Initialized &amp; Verified</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] text-white">
          The Architectural Gateway to{' '}
          <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-amber-300 bg-clip-text text-transparent">
            Extraordinary Journeys
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Welcome to <strong className="text-white">VoyageVista</strong>. Phase 1 foundation is fully configured with strict TypeScript, Express backend, Vite React frontend, Tailwind CSS, PostgreSQL, and Prisma ORM.
        </p>

        {/* Action Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            id="ping-health-btn"
            onClick={fetchHealth}
            disabled={healthStatus === 'loading'}
            className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold text-sm transition-all shadow-lg shadow-teal-900/40 hover:shadow-teal-800/60 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${healthStatus === 'loading' ? 'animate-spin' : ''}`} />
            <span>Verify Live Health Endpoint</span>
          </button>

          <a
            href="#architecture-cards"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Explore Modules</span>
          </a>
        </div>

        {/* Live Health Response Terminal / Card */}
        <div className="w-full max-w-3xl mt-12 text-left">
          <div className="bg-[#0e1526]/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Terminal className="w-4 h-4 text-teal-400" />
                <span>GET /api/health</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Live Response Payload</span>
            </div>

            {healthStatus === 'loading' && (
              <div className="py-6 flex items-center justify-center gap-3 text-slate-400 font-mono text-sm">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                <span>Pinging Express API backend at /api/health...</span>
              </div>
            )}

            {healthStatus === 'success' && healthData && (
              <pre className="font-mono text-xs sm:text-sm text-teal-300 bg-[#070b14] p-4 rounded-xl overflow-x-auto border border-slate-800/60">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            )}

            {healthStatus === 'error' && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 font-mono text-xs">
                <p className="font-semibold text-red-200">Backend Connection Status: Offline / Standby</p>
                <p className="mt-1 text-slate-400">Details: {errorMessage}</p>
                <p className="mt-2 text-slate-500 text-[11px]">
                  Tip: Run <code className="text-teal-300">npm run dev</code> from root to concurrently run API (port 5000) and Web (port 5173).
                </p>
              </div>
            )}

            {healthStatus === 'idle' && (
              <div className="py-4 text-center text-slate-500 text-xs font-mono">
                Click &quot;Verify Live Health Endpoint&quot; to test connection.
              </div>
            )}
          </div>
        </div>

        {/* Monorepo Architecture Overview Cards */}
        <section id="architecture-cards" className="w-full mt-20">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            Monorepo Architecture
          </h2>
          <p className="text-sm text-slate-400 mb-8">
            Clean decoupled workspaces designed for scale, type safety, and modular extension.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Web App Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-left hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-5 text-teal-400">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">apps/web</h3>
              <p className="text-xs font-mono text-teal-400 mb-3">React 18 + Vite + Tailwind</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Modern client-side single page app featuring fast HMR, strict TypeScript, responsive layouts, and Tailwind CSS design tokens.
              </p>
            </div>

            {/* API Service Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-left hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5 text-cyan-400">
                <Server className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">apps/api</h3>
              <p className="text-xs font-mono text-cyan-400 mb-3">Node.js + Express + Prisma</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                RESTful backend service built on Express with PostgreSQL schema and Prisma ORM client generator, health checks, and CORS security.
              </p>
            </div>

            {/* Shared Package Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-left hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">packages/shared</h3>
              <p className="text-xs font-mono text-amber-400 mb-3">TypeScript Contract Library</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Single source of truth for API response contracts, health schemas, pagination interfaces, and core domain models.
              </p>
            </div>
          </div>
        </section>

        {/* Phase 1 Verification Checklist */}
        <section className="w-full max-w-3xl mt-16 text-left">
          <div className="bg-gradient-to-b from-slate-900/70 to-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-teal-400" />
              <h2 className="text-base font-semibold text-white">Phase 1 Foundation Readiness</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                'Monorepo root scripts & npm workspaces',
                'Strict base TypeScript configuration',
                'Vite + React 18 + Tailwind CSS v3 configured',
                'Express API with GET /api/health',
                'Prisma PostgreSQL schema defined',
                'Comprehensive .gitignore & .env.example files',
                'Automated Vitest test suites for API & Web',
                'Architecture & setup documentation created'
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-[#070b14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-400" />
            <span className="text-slate-400 font-medium">VoyageVista Tourist Website Platform</span>
            <span>&bull; Phase 1</span>
          </div>
          <div>
            <span>PostgreSQL &bull; Prisma &bull; Express &bull; React &bull; Tailwind &bull; Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
