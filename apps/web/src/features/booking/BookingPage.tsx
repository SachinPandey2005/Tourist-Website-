import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Lock,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Input } from '../../components/ui/Input.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { useAuth } from '../../context/AuthContext.js';
import { bookingsApi } from '../../lib/api/bookings.js';
import { tourApi } from '../../lib/api/tours.js';
import { hotelApi } from '../../lib/api/hotels.js';
import { activityApi } from '../../lib/api/activities.js';
import { formatCurrency, formatDate } from '../../lib/utils.js';
import type { BookingQuoteResult, TourScheduleDto } from '@tourist/shared';

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const tourId = searchParams.get('tourId');
  const scheduleIdParam = searchParams.get('scheduleId');
  const hotelId = searchParams.get('hotelId');
  const activityId = searchParams.get('activityId');

  // Product Data
  const [product, setProduct] = useState<any>(null);
  const [schedules, setSchedules] = useState<TourScheduleDto[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(scheduleIdParam || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(
    searchParams.get('startDate') || new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    searchParams.get('endDate') || new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10)
  );
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Coupon
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');

  // Server Quote & Availability States
  const [quote, setQuote] = useState<BookingQuoteResult | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState<boolean>(false);

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(true);

  // Generate unique idempotency key once per page session
  const idempotencyKey = useMemo(() => `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, []);

  // Fetch product details
  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        setPageLoading(true);
        if (tourId) {
          const res = await tourApi.getBySlugOrId(tourId);
          if (isMounted && res) {
            setProduct(res);
            if (res.schedules && res.schedules.length > 0) {
              setSchedules(res.schedules);
              const firstSched = res.schedules[0];
              if (firstSched && (!selectedScheduleId || !res.schedules.some((s: any) => s.id === selectedScheduleId))) {
                setSelectedScheduleId(firstSched.id);
              }
            }
          }
        } else if (hotelId) {
          const res = await hotelApi.getBySlugOrId(hotelId);
          if (isMounted) setProduct(res);
        } else if (activityId) {
          const res = await activityApi.getBySlugOrId(activityId);
          if (isMounted) setProduct(res);
        }
      } catch (err: unknown) {
        console.error('Failed to load item for booking:', err);
      } finally {
        if (isMounted) setPageLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [tourId, hotelId, activityId]);

  // Construct item payload for quote & availability
  const currentItemPayload = useMemo(() => {
    if (tourId) {
      return {
        tourPackageId: tourId,
        tourScheduleId: selectedScheduleId || undefined,
        quantity,
      };
    } else if (hotelId) {
      return {
        hotelId,
        quantity,
        startDate,
        endDate,
      };
    } else if (activityId) {
      return {
        activityId,
        quantity,
        startDate,
      };
    }
    return null;
  }, [tourId, selectedScheduleId, hotelId, activityId, quantity, startDate, endDate]);

  // Check Availability with backend
  const checkInventory = useCallback(async () => {
    if (!currentItemPayload) return;
    try {
      setIsCheckingAvailability(true);
      const res = await bookingsApi.checkAvailability({
        items: [currentItemPayload],
      });
      setIsAvailable(res.isAvailable);
      if (res.items && res.items.length > 0 && res.items[0]) {
        setAvailabilityMessage(res.items[0].message);
      }
    } catch (err: unknown) {
      setIsAvailable(false);
      const msg = err instanceof Error ? err.message : 'Unable to verify availability.';
      setAvailabilityMessage(msg);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [currentItemPayload]);

  // Fetch Server Quote
  const fetchQuote = useCallback(async () => {
    if (!currentItemPayload) return;
    try {
      setIsQuoteLoading(true);
      setQuoteError(null);
      const res = await bookingsApi.getQuote({
        items: [currentItemPayload],
        couponCode: appliedCoupon || undefined,
      });
      setQuote(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to calculate server quote.';
      setQuoteError(msg);
    } finally {
      setIsQuoteLoading(false);
    }
  }, [currentItemPayload, appliedCoupon]);

  // Trigger availability and quote on changes
  useEffect(() => {
    if (currentItemPayload) {
      checkInventory();
      fetchQuote();
    }
  }, [currentItemPayload, checkInventory, fetchQuote]);

  // Handle Coupon Apply
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setAppliedCoupon(couponCode.trim().toUpperCase());
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon('');
  };

  // Handle Booking Creation
  const handleCreateBooking = async () => {
    if (!currentItemPayload) return;

    if (!isAuthenticated) {
      // Prompt traveler to sign in first
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const booking = await bookingsApi.createBooking(
        {
          items: [currentItemPayload],
          couponCode: appliedCoupon || undefined,
          specialRequests: specialRequests || undefined,
          idempotencyKey,
        },
        idempotencyKey
      );

      // Navigate to confirmation page with new booking reference
      navigate(`/booking/confirmation?bookingId=${booking.id}`, {
        state: { newBooking: booking },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to process booking.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <LoadingSkeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <LoadingSkeleton className="h-96 lg:col-span-2 rounded-2xl" />
          <LoadingSkeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!product && !pageLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <ErrorState
          title="Travel Product Not Found"
          message="We could not find the selected destination or travel expedition. Please browse our catalog."
          onRetry={() => navigate('/tours')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 hover:text-teal-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </button>
        <span>/</span>
        <span className="text-slate-200 font-semibold">Reserve Experience</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <Badge variant="brand" className="mb-2">
            PHASE 9 END-TO-END RESERVATION ENGINE
          </Badge>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">
            Complete Your Travel Reservation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Server-verified rates, real-time schedule seat locks, and transparent payment integration.
          </p>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Lock className="w-4 h-4 text-teal-400" />
          <span>Server-Authoritative Pricing Protection</span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Product Selection & Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selected Product Banner */}
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src={product.featuredImage || product.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'}
                alt={product.title || product.name}
                className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-slate-700/80 shadow-md"
              />
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
                  {tourId ? 'Tour Package Expedition' : hotelId ? 'Luxury Accommodation' : 'Curated Excursion'}
                </span>
                <h2 className="text-xl font-bold text-slate-100">{product.title || product.name}</h2>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {product.description}
                </p>
              </div>
            </div>
          </Card>

          {/* Schedule / Date Selection */}
          <Card className="p-6 space-y-5">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400" />
              <span>Travel Dates & Schedules</span>
            </h3>

            {/* Tour Schedule Radio List */}
            {tourId && schedules.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Select Available Departure Window:
                </span>
                <div className="space-y-2.5">
                  {schedules.map((sch) => {
                    const isSelected = selectedScheduleId === sch.id;
                    const remaining = sch.totalCapacity - sch.bookedCapacity;
                    const isSoldOut = remaining <= 0 || sch.status === 'SOLD_OUT';

                    return (
                      <div
                        key={sch.id}
                        onClick={() => !isSoldOut && setSelectedScheduleId(sch.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500/60 shadow-md shadow-teal-500/10'
                            : isSoldOut
                            ? 'opacity-50 cursor-not-allowed bg-slate-900/40 border-slate-800'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                            <span>{formatDate(sch.startDate)}</span>
                            <span className="text-slate-500">→</span>
                            <span>{formatDate(sch.endDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Badge variant={isSoldOut ? 'danger' : sch.status === 'AVAILABLE' ? 'success' : 'warning'}>
                              {isSoldOut ? 'SOLD OUT' : sch.status}
                            </Badge>
                            <span>{Math.max(0, remaining)} of {sch.totalCapacity} spots remaining</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-base font-extrabold text-teal-300">
                            {formatCurrency(sch.price)}
                          </span>
                          <input
                            type="radio"
                            name="schedule"
                            disabled={isSoldOut}
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
            )}

            {/* Hotel Check-in / Check-out inputs */}
            {hotelId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Check-in Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Check-out Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Activity Date input */}
            {activityId && (
              <div className="max-w-xs">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Activity Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            )}
          </Card>

          {/* Travelers / Quantity Selector */}
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" />
              <span>{hotelId ? 'Number of Rooms' : 'Travelers / Guests'}</span>
            </h3>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <span className="text-sm font-bold text-slate-100 block">
                  {hotelId ? 'Standard Suites' : 'Party Members'}
                </span>
                <span className="text-xs text-slate-400">
                  {hotelId ? 'Occupancy up to 2 guests per suite' : 'All ages welcome under expedition guidelines'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="w-9 h-9 p-0 text-base"
                >
                  -
                </Button>
                <span className="w-8 text-center font-bold text-base text-slate-100">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={quantity >= 20}
                  onClick={() => setQuantity((prev) => prev + 1)}
                  className="w-9 h-9 p-0 text-base"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Live Backend Inventory Status Badge */}
            <div className="pt-2">
              {isCheckingAvailability ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying live schedule capacity...</span>
                </div>
              ) : isAvailable ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{availabilityMessage || 'Inventory and schedule spots confirmed available.'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{availabilityMessage || 'Selected inventory is currently unavailable.'}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Special Requests */}
          <Card className="p-6 space-y-3">
            <h3 className="text-base font-bold text-slate-100">
              Special Requests or Dietary Requirements (Optional)
            </h3>
            <p className="text-xs text-slate-400">
              Let us know if you require vegetarian meals, airport transfers, or specific equipment.
            </p>
            <textarea
              rows={3}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="e.g. Vegetarian meal for 1 traveler, airport pickup in Kathmandu..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
            />
          </Card>
        </div>

        {/* Right Column: Server Price Breakdown & Action */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6 sticky top-24">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs uppercase font-bold text-teal-400 tracking-wider block">
                Summary & Quote
              </span>
              <h3 className="font-extrabold text-lg text-slate-100 mt-1">
                Server-Calculated Quote
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Protected against client browser price tampering
              </p>
            </div>

            {/* Coupon Application Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Promotional Coupon Code</span>
              </label>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>{appliedCoupon} APPLIED</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-xs text-slate-400 hover:text-rose-400 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <Input
                    placeholder="e.g. ADVENTURE20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="text-xs uppercase font-mono"
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    Apply
                  </Button>
                </form>
              )}
            </div>

            {/* Price Calculations */}
            {isQuoteLoading ? (
              <div className="space-y-2.5 py-4">
                <LoadingSkeleton className="h-4 w-full" />
                <LoadingSkeleton className="h-4 w-3/4" />
                <LoadingSkeleton className="h-6 w-full" />
              </div>
            ) : quoteError ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {quoteError}
              </div>
            ) : quote ? (
              <div className="space-y-3 text-xs border-t border-slate-800 pt-4">
                <div className="flex justify-between items-center text-slate-300">
                  <span>
                    Subtotal ({quantity} {hotelId ? 'room' : 'traveler'}{quantity > 1 ? 's' : ''})
                  </span>
                  <span className="font-semibold text-slate-100">
                    {formatCurrency(quote.subtotal)}
                  </span>
                </div>

                {Number(quote.discountAmount) > 0 && (
                  <div className="flex justify-between items-center text-emerald-400 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{formatCurrency(quote.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-400">
                  <span>Taxes & Tourism Fees ({quote.taxRatePercentage}%)</span>
                  <span>{formatCurrency(quote.taxAmount)}</span>
                </div>

                <div className="border-t border-slate-800/80 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Total Payable</span>
                    <span className="text-[11px] text-teal-400 font-medium">Pending Phase 10 Payment</span>
                  </div>
                  <span className="text-2xl font-extrabold text-teal-300">
                    {formatCurrency(quote.totalAmount)}
                  </span>
                </div>
              </div>
            ) : null}

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Auth Gate / Submit Button */}
            {!isAuthenticated ? (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() =>
                    navigate(
                      `/login?redirect=${encodeURIComponent(
                        window.location.pathname + window.location.search
                      )}`
                    )
                  }
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In to Reserve
                </Button>
                <p className="text-[11px] text-center text-slate-400">
                  An authenticated traveler profile is required to secure inventory reservations.
                </p>
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!isAvailable || isCheckingAvailability || isQuoteLoading || isSubmitting}
                isLoading={isSubmitting}
                onClick={handleCreateBooking}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isSubmitting ? 'Securing Inventory...' : 'Confirm & Create Reservation'}
              </Button>
            )}

            {/* Policies Guarantee */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Inventory seat hold secured under PENDING status</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Free cancellation eligible up to 24h before departure</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
