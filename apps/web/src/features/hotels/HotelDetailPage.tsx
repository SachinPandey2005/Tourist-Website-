import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowLeft,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Card } from '../../components/ui/Card.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { hotelApi } from '../../lib/api/hotels.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency } from '../../lib/utils.js';

export function HotelDetailPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useApi(
    () => hotelApi.getBySlugOrId(idOrSlug || ''),
    { immediate: Boolean(idOrSlug) }
  );

  const fallbackHotel = {
    id: 'hotel-demo-1',
    destinationId: 'dest-1',
    name: 'The Ritz-Carlton Kyoto Kamogawa',
    slug: 'ritz-carlton-kyoto',
    description:
      'Perched quietly on the banks of the historic Kamogawa river, The Ritz-Carlton Kyoto seamlessly weaves the rich cultural tapestry of Japan’s ancient capital with modern luxury. Featuring authentic Zen rock courtyards, a subterranean spa with granite hot water baths, and bespoke dining crafted by culinary masters, every moment provides unmatched sanctuary and tranquility.',
    address: 'Kamogawa Nijo-Ohashi Hotori, Nakagyo-ku, Kyoto 604-0902',
    starRating: 5,
    pricePerNight: '820.00',
    amenities: [
      'Kamogawa River Panorama',
      'Michelin-starred Tempura & Sushi',
      'Subterranean Granite Spa & Onsen',
      'Complimentary Cultural Bicycle Tours',
      '24-Hour Dedicated Butler Service',
      'Ultra High-Speed Fiber WiFi',
      'Bespoke Kyoto Tea Tasting Lounge',
      'Private Limousine Airport Transfers',
    ],
    imageUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const hotel = data || fallbackHotel;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-96 w-full bg-slate-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <ErrorState
          title="Could Not Load Hotel Information"
          message={error.message || 'Unable to retrieve hotel details from the network.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="w-full pb-20 space-y-12">
      {/* Top Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Accommodations</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Share2 className="w-4 h-4" />}
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            Share Accommodation
          </Button>
        </div>
      </div>

      {/* Hero Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[420px] sm:h-[480px]">
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="warning">{hotel.starRating} Stars Luxury</Badge>
                <Badge variant="brand">Verified Partner Property</Badge>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                {hotel.name}
              </h1>

              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{hotel.address}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 space-y-1 shrink-0">
              <span className="text-xs text-slate-400 block">Nightly Rate</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-white">
                  {formatCurrency(hotel.pricePerNight)}
                </span>
                <span className="text-xs text-slate-400">/ room</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details & Reservation Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Overview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">About this Property</h2>
            <p className="text-slate-300 leading-relaxed text-base">
              {hotel.description}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Verified Hotel Amenities & Services
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {hotel.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reservation Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6 sticky top-24">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs uppercase font-bold text-teal-400 tracking-wider block">
                Direct Booking
              </span>
              <h3 className="font-extrabold text-xl text-slate-100 mt-1">
                {hotel.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Best price guarantee • Complimentary room upgrade when available
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Nightly Rate</span>
                <span className="font-bold text-slate-100">{formatCurrency(hotel.pricePerNight)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Taxes & Fees</span>
                <span className="font-semibold text-slate-300">Included</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Cancellation</span>
                <span className="font-semibold text-teal-300">Free until 48h prior</span>
              </div>
            </div>

            <Link to={`/booking/confirmation?hotelId=${hotel.id}&name=${encodeURIComponent(hotel.name)}`}>
              <Button variant="primary" size="lg" className="w-full">
                Reserve Stay
              </Button>
            </Link>

            <div className="pt-4 border-t border-slate-800 space-y-2.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>VoyageVista SafeStay Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Verified 5-Star Cleanliness & Security</span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
