import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar.js';
import { Footer } from '../components/common/Footer.js';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Background Glow Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[45%] right-[25%] w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[150px]" />
      </div>

      <Navbar />

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
