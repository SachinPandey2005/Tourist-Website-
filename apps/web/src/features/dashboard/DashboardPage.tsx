import { Link } from 'react-router-dom';
import { Calendar, Heart, Award, ArrowUpRight, Clock, ShieldCheck, Compass } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

export function DashboardPage() {
  const stats = [
    { label: 'Active Reservations', value: '1', change: 'Departing in 20 days', icon: Calendar, color: 'text-teal-400' },
    { label: 'Saved Expeditions', value: '4', change: '2 departures discounted', icon: Heart, color: 'text-amber-400' },
    { label: 'Voyage Club Points', value: '1,450', change: 'Tier: Explorer', icon: Award, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="brand" className="mb-2">TRAVELER PORTAL</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Welcome, Jane Doe
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your expeditions, access boarding vouchers, and track escrow reservations.
          </p>
        </div>

        <Link to="/tours">
          <Button variant="primary" size="sm" rightIcon={<Compass className="w-4 h-4" />}>
            Book New Expedition
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  {stat.label}
                </span>
                <span className="text-2xl font-extrabold text-slate-100">{stat.value}</span>
                <span className="text-[11px] text-slate-500 block">{stat.change}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Upcoming Trip Card */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Upcoming Journey</h2>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="h-48 md:h-full relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80"
                alt="Kyoto expedition"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <Badge variant="success">CONFIRMED DEPARTURE</Badge>
              </div>
            </div>

            <div className="p-6 md:col-span-2 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>Nov 10, 2026 – Nov 17, 2026 (7 Days)</span>
                </div>
                <h3 className="text-xl font-bold text-slate-100">
                  Kyoto Zen & Sacred Temples Expedition
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                  Reservation Reference: <span className="font-mono text-slate-200">VV-2026-KYO-8912</span>. Includes private tea master ceremony, Arashiyama ryokan stay, and UIAGM cultural guide.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Escrow secured by VoyageVista SafeTravel</span>
                </div>
                <Button variant="outline" size="sm" rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}>
                  View Voucher
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
