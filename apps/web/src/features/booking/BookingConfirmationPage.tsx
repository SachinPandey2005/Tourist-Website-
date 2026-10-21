import { useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';

export function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const title =
    searchParams.get('title') ||
    searchParams.get('name') ||
    (location.state as { title?: string })?.title ||
    'Custom Expeditions & Guided Experience';

  const tourId = searchParams.get('tourId');
  const hotelId = searchParams.get('hotelId');
  const activityId = searchParams.get('activityId');

  const reservationType = tourId
    ? 'Tour Package Expedition'
    : hotelId
    ? 'Luxury Accommodation Stay'
    : activityId
    ? 'Local Excursion / Experience'
    : 'Curated Travel Reservation';

  const reservationCode = `VV-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-8">
      {/* Success Badge & Headline */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto shadow-lg shadow-teal-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <Badge variant="brand">PHASE 7 VERIFICATION STAGE</Badge>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
          Reservation Request Staged
        </h1>

        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Your travel item has been selected and validated through the discovery catalog.
        </p>
      </div>

      {/* Reservation Summary Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block">
              {reservationType}
            </span>
            <h2 className="text-xl font-bold text-slate-100">{title}</h2>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400 block">Staged Reference Code</span>
            <span className="font-mono text-base font-bold text-amber-400">{reservationCode}</span>
          </div>
        </div>

        {/* Phase 8 Road-Map Notice */}
        <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
            <Sparkles className="w-4 h-4" />
            <span>Complete Booking Engine Integration in Phase 8</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            As part of Phase 7 (Public-Facing Travel Pages & Discovery), items can be selected and staged. In Phase 8, the complete booking engine will introduce full cart workflows, Stripe/PayPal escrow payment processing, real-time schedule seat locks, and downloadable PDF boarding vouchers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">Protected Escrow Guarantee</span>
            <p className="text-slate-300">Funds remain 100% protected until verified departure.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">Complimentary Cancellation</span>
            <p className="text-slate-300">100% full refund available up to 30 days prior.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3 justify-end">
          <Link to="/tours">
            <Button variant="outline" size="md" className="w-full sm:w-auto">
              Continue Browsing
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="primary" size="md" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Go to Traveler Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
