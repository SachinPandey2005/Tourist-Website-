import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  Star,
  MapPin,
  ArrowLeft,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Sparkles,
  Award,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Card } from '../../components/ui/Card.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { tourApi } from '../../lib/api/tours.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency, formatDate } from '../../lib/utils.js';
import type { TourScheduleDto } from '@tourist/shared';

export function TourDetailPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  const { data, isLoading, error, refetch } = useApi(
    () => tourApi.getBySlugOrId(idOrSlug || ''),
    { immediate: Boolean(idOrSlug) }
  );

  const fallbackTour = {
    id: 'tour-fallback-1',
    title: 'Kyoto Zen Temples & Sacred Alpine Shrines Expedition',
    slug: 'kyoto-zen-and-temple-trail',
    durationDays: 7,
    durationNights: 6,
    basePrice: '1850.00',
    discountPrice: '1699.00',
    difficulty: 'EASY' as const,
    maxGroupSize: 12,
    rating: 4.96,
    reviewCount: 48,
    featuredImage:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80',
    ],
    highlights: [
      'Private dawn entrance to Fushimi Inari shrine before public gates open',
      'Tea ceremony hosted by a 14th-generation tea master in historic Gion',
      'Exclusive overnight temple stay (Shukubo) with morning shojin-ryori vegan feast',
      'Guided bamboo forest meditative hike in Arashiyama at sunrise',
      'Luxury luggage transfer between traditional ryokan accommodations',
    ],
    description:
      'Traverse the spiritual cradle of ancient Japan with an intimate party of like-minded travelers. Led by an expert cultural historian, this 7-day curated voyage explores secluded mountain shrines, tranquil moss gardens, and centuries-old artisan workshops in Kyoto, Uji, and Nara. Stay in handpicked historic ryokans with soothing private onsen hot springs.',
    destination: {
      id: 'dest-1',
      title: 'Kyoto, Japan',
      slug: 'kyoto-japan',
    },
    schedules: [
      {
        id: 'sch-1',
        tourPackageId: 'tour-fallback-1',
        startDate: '2026-11-10T00:00:00.000Z',
        endDate: '2026-11-17T00:00:00.000Z',
        price: '1699.00',
        totalCapacity: 12,
        bookedCapacity: 8,
        status: 'AVAILABLE' as const,
      },
      {
        id: 'sch-2',
        tourPackageId: 'tour-fallback-1',
        startDate: '2026-12-05T00:00:00.000Z',
        endDate: '2026-12-12T00:00:00.000Z',
        price: '1699.00',
        totalCapacity: 12,
        bookedCapacity: 11,
        status: 'AVAILABLE' as const,
      },
      {
        id: 'sch-3',
        tourPackageId: 'tour-fallback-1',
        startDate: '2027-01-15T00:00:00.000Z',
        endDate: '2027-01-22T00:00:00.000Z',
        price: '1750.00',
        totalCapacity: 12,
        bookedCapacity: 4,
        status: 'AVAILABLE' as const,
      },
    ] as TourScheduleDto[],
  };

  const tour = data || fallbackTour;
  const schedules = (tour.schedules && tour.schedules.length > 0) ? tour.schedules : fallbackTour.schedules;
  const activeSchedule = schedules.find((s) => s.id === selectedScheduleId) || schedules[0];

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
          title="Could Not Load Tour Package"
          message={error.message || 'Unable to retrieve tour itinerary from the network.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="w-full pb-20 space-y-12">
      {/* Top Breadcrumb Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tours</span>
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
            Share Tour
          </Button>
        </div>
      </div>

      {/* Hero Tour Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[420px] sm:h-[480px]">
          <img
            src={tour.featuredImage}
            alt={tour.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Banner Overlays */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="brand">{tour.difficulty} DIFFICULTY</Badge>
                {tour.destination && (
                  <Badge variant="neutral">
                    <MapPin className="w-3 h-3 mr-1 inline" />
                    {tour.destination.title}
                  </Badge>
                )}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{tour.rating ? tour.rating.toFixed(2) : '4.95'}</span>
                  <span className="text-slate-400 font-normal">({tour.reviewCount || 36} reviews)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                {tour.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-400" />
                  {tour.durationDays} Days / {tour.durationNights || tour.durationDays - 1} Nights
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal-400" />
                  Max {tour.maxGroupSize} Travelers
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 space-y-2 shrink-0">
              <span className="text-xs text-slate-400 block">Starting From</span>
              <div className="flex items-baseline gap-2">
                {tour.discountPrice && (
                  <span className="text-slate-500 line-through text-sm">
                    {formatCurrency(tour.basePrice)}
                  </span>
                )}
                <span className="text-2xl sm:text-3xl font-extrabold text-teal-300">
                  {formatCurrency(tour.discountPrice || tour.basePrice)}
                </span>
                <span className="text-xs text-slate-400">/ person</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Reservation Sidebar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Overview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">Expedition Overview</h2>
            <p className="text-slate-300 leading-relaxed text-base">
              {tour.description}
            </p>
          </div>

          {/* Highlights */}
          {tour.highlights && tour.highlights.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Curated Highlights & Inclusions
              </h3>
              <div className="space-y-3">
                {tour.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Departure Schedules Selection */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              Available Departure Schedules
            </h3>
            <p className="text-xs text-slate-400">
              Select your preferred departure window. All scheduled departures are backed by our escrow guarantee.
            </p>

            <div className="space-y-3">
              {schedules.map((sch) => {
                const isSelected = (selectedScheduleId || schedules[0]?.id) === sch.id;
                const remaining = sch.totalCapacity - sch.bookedCapacity;

                return (
                  <div
                    key={sch.id}
                    onClick={() => setSelectedScheduleId(sch.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/50 shadow-md shadow-teal-500/10'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                        <span>{formatDate(sch.startDate)}</span>
                        <span className="text-slate-500">→</span>
                        <span>{formatDate(sch.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <Badge variant={sch.status === 'AVAILABLE' ? 'success' : 'warning'}>
                          {sch.status}
                        </Badge>
                        <span>{remaining} of {sch.totalCapacity} spots remaining</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Total Rate</span>
                        <span className="text-lg font-extrabold text-teal-300">
                          {formatCurrency(sch.price)}
                        </span>
                      </div>
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => setSelectedScheduleId(sch.id)}
                        className="w-4 h-4 text-teal-500 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Booking Action Sidebar */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6 sticky top-24">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs uppercase font-bold text-teal-400 tracking-wider block">
                Selected Schedule
              </span>
              <h3 className="font-extrabold text-lg text-slate-100 mt-1">
                {activeSchedule ? `${formatDate(activeSchedule.startDate)} - ${formatDate(activeSchedule.endDate)}` : 'Select a date'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Fixed guarantee • Small party of {tour.maxGroupSize}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Per Traveler Rate</span>
                <span className="font-bold text-slate-100">
                  {formatCurrency(activeSchedule?.price || tour.discountPrice || tour.basePrice)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Deposit Required (Escrow)</span>
                <span className="font-semibold text-teal-300">20% Upon Booking</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Cancellation Policy</span>
                <span className="font-semibold text-slate-300">Free up to 30 days prior</span>
              </div>
            </div>

            <Link
              to={`/book?tourId=${tour.id}&scheduleId=${activeSchedule?.id || ''}`}
            >
              <Button variant="primary" size="lg" className="w-full">
                Proceed to Reservation
              </Button>
            </Link>

            <div className="pt-4 border-t border-slate-800 space-y-2.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Protected by VoyageVista Escrow SafeGuarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Certified local mountain & cultural guides</span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
