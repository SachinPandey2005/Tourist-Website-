import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  Clock,
  ShieldCheck,
  Calendar,
  Users,
  AlertCircle,
  XCircle,
  CreditCard,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { bookingsApi, UserBookingRecord } from '../../lib/api/bookings.js';
import { PaymentModal } from './PaymentModal.js';
import { ProcessPaymentResult } from '@tourist/shared';
import { formatCurrency, formatDate } from '../../lib/utils.js';

export function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const bookingId = searchParams.get('bookingId');
  const initialBooking = (location.state as { newBooking?: UserBookingRecord })?.newBooking;

  const [booking, setBooking] = useState<UserBookingRecord | null>(initialBooking || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialBooking && Boolean(bookingId));
  const [error, setError] = useState<string | null>(null);

  // Payment States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Cancellation States
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  useEffect(() => {
    if (bookingId && !initialBooking) {
      setIsLoading(true);
      bookingsApi
        .getBookingDetails(bookingId)
        .then((res) => {
          setBooking(res);
          setError(null);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Could not fetch booking details.';
          setError(msg);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [bookingId, initialBooking]);

  const handlePaymentSuccess = (result: ProcessPaymentResult) => {
    if (booking) {
      setBooking((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: result.bookingStatus,
          payments: [
            {
              id: result.paymentId,
              paymentReference: result.paymentReference,
              amount: prev.totalAmount,
              currency: prev.currency,
              status: result.status,
              method: 'CREDIT_CARD',
              paidAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            },
            ...prev.payments,
          ],
        };
      });
      bookingsApi
        .getBookingDetails(booking.id)
        .then((fresh) => {
          setBooking(fresh);
        })
        .catch(() => {});
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    try {
      setIsCancelling(true);
      const updated = await bookingsApi.cancelBooking(
        booking.id,
        cancelReason || 'Traveler cancelled via confirmation view'
      );
      setBooking(updated);
      setIsCancelDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel booking.';
      alert(`Error cancelling: ${msg}`);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <LoadingSkeleton className="h-16 w-3/4 mx-auto rounded-2xl" />
        <LoadingSkeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  // Fallback if no booking ID was provided (legacy staging mock)
  if (!booking && !error) {
    const title =
      searchParams.get('title') ||
      searchParams.get('name') ||
      'Custom Expeditions & Guided Experience';
    const reservationCode = `VV-${Math.floor(100000 + Math.random() * 900000)}`;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto shadow-lg shadow-teal-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <Badge variant="brand">PHASE 9 RESERVATION READY</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
            Reservation Staged
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Your travel item is ready to be confirmed with server-side inventory verification.
          </p>
        </div>

        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block">
                Travel Expedition
              </span>
              <h2 className="text-xl font-bold text-slate-100">{title}</h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 block">Staged Reference</span>
              <span className="font-mono text-base font-bold text-amber-400">{reservationCode}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <Link to="/tours">
              <Button variant="outline" size="md">
                Browse Tours
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="primary" size="md">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Reservation Record Not Found</h1>
        <p className="text-sm text-slate-400">
          {error || 'Unable to locate this reservation. Please check your traveler dashboard.'}
        </p>
        <Link to="/dashboard/bookings">
          <Button variant="primary" size="md" className="mt-4">
            View My Bookings
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = booking.status === 'PENDING';
  const isCancelled = booking.status === 'CANCELLED';
  const paymentStatus = booking.payments[0]?.status || 'PENDING';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-xl ${
            isCancelled
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-rose-500/10'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
          }`}
        >
          {isCancelled ? <XCircle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>

        <Badge variant={isCancelled ? 'danger' : isPending ? 'warning' : 'success'}>
          {isCancelled
            ? 'BOOKING CANCELLED'
            : isPending
            ? 'PENDING RESERVATION CREATED'
            : 'CONFIRMED & SETTLED'}
        </Badge>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
          {isCancelled
            ? 'Reservation Cancelled'
            : isPending
            ? 'Inventory Hold Successfully Created'
            : 'Booking Confirmed & Boarding Voucher Ready!'}
        </h1>

        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          {isCancelled
            ? 'Your booking has been cancelled and any reserved seats have been released back to availability.'
            : isPending
            ? 'Your booking has been created on the server with locked inventory. Awaiting Phase 10 payment processing and settlement.'
            : 'Your payment was authorized and settled successfully. Your travel package has been secured.'}
        </p>
      </div>

      {/* Main Details Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        {/* Reference & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Booking Reference
            </span>
            <span className="font-mono text-2xl font-extrabold text-teal-300">
              {booking.bookingReference}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">BOOKING STATUS</span>
              <span
                className={`text-xs font-bold ${
                  isCancelled ? 'text-rose-400' : isPending ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {booking.status}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">PAYMENT STATUS</span>
              <span
                className={`text-xs font-bold ${
                  paymentStatus === 'SUCCEEDED'
                    ? 'text-emerald-400'
                    : paymentStatus === 'REFUNDED'
                    ? 'text-slate-400'
                    : 'text-amber-400'
                }`}
              >
                {paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Phase 10 Interactive Settlement Callout */}
        {isPending && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-slate-900 to-teal-500/5 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-teal-500/5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                <CreditCard className="w-4 h-4 text-teal-400" />
                <span>Payment Settlement Required</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                Your inventory is locked. Settle the balance of <strong className="text-teal-300">${booking.totalAmount} {booking.currency}</strong> to confirm your travel voucher and receive boarding confirmation.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsPaymentModalOpen(true)}
              className="shadow-lg shadow-teal-500/20 whitespace-nowrap"
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              Pay Now (${booking.totalAmount} {booking.currency})
            </Button>
          </div>
        )}

        {/* Cancellation Notice if cancelled */}
        {isCancelled && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1 text-xs">
            <span className="font-bold text-rose-300 block">Cancellation Verified</span>
            <p className="text-slate-300">
              {booking.cancellationReason
                ? `Reason: ${booking.cancellationReason}`
                : 'Booking was cancelled per traveler request.'}
            </p>
            {booking.cancelledAt && (
              <span className="text-[11px] text-slate-400 block">
                Cancelled on: {formatDate(booking.cancelledAt)}
              </span>
            )}
          </div>
        )}

        {/* Reserved Items Snapshot */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Reserved Itinerary Items
          </h3>

          <div className="space-y-3">
            {booking.items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-100 text-sm">{item.itemTitle}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                      Qty: {item.quantity}
                    </span>
                    {item.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-400" />
                        {formatDate(item.startDate)}
                        {item.endDate && ` → ${formatDate(item.endDate)}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </span>
                  <span className="text-base font-extrabold text-teal-300">
                    {formatCurrency(item.totalPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Server Price Calculation Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2.5 text-xs">
          <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2">
            Server Financial Snapshot
          </h4>
          <div className="flex justify-between text-slate-300">
            <span>Subtotal</span>
            <span>{formatCurrency(booking.subtotal)}</span>
          </div>
          {Number(booking.discountAmount) > 0 && (
            <div className="flex justify-between text-emerald-400 font-semibold">
              <span>Promotion Discount</span>
              <span>-{formatCurrency(booking.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Taxes & Fees (10%)</span>
            <span>{formatCurrency(booking.taxAmount)}</span>
          </div>
          <div className="border-t border-slate-800 pt-2.5 flex justify-between items-baseline font-bold">
            <span className="text-sm text-slate-100">Total Snapshot Amount</span>
            <span className="text-xl text-teal-300 font-extrabold">
              {formatCurrency(booking.totalAmount)}
            </span>
          </div>
        </div>

        {/* Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Immutable Price Snapshot</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Your booked rate is locked and immune to future catalog price changes.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Explicit Cancellation Rule</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Eligible for full release and cancellation prior to scheduled departure.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div>
            {!isCancelled && booking.isCancellable !== false && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsCancelDialogOpen(true)}
                className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300"
              >
                Cancel This Reservation
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isPending && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsPaymentModalOpen(true)}
                className="w-full sm:w-auto shadow-lg shadow-teal-500/20"
                leftIcon={<CreditCard className="w-4 h-4" />}
              >
                Settle Payment
              </Button>
            )}
            <Link to="/tours" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                Explore More
              </Button>
            </Link>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/dashboard/bookings')}
              className="w-full sm:w-auto"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              My Bookings
            </Button>
          </div>
        </div>
      </Card>

      {/* Cancellation Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelBooking}
        title="Cancel This Travel Reservation?"
        description={
          <div className="space-y-3 text-xs text-slate-300">
            <p>
              Are you sure you want to cancel this booking? Any reserved schedule spots will be released back to other travelers. This action cannot be undone.
            </p>
            <div>
              <label className="text-xs text-slate-300 block mb-1">
                Reason for cancellation (optional):
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, change of plans..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>
          </div>
        }
        confirmText={isCancelling ? 'Cancelling...' : 'Yes, Cancel Reservation'}
        cancelText="Keep Reservation"
        isConfirming={isCancelling}
        variant="danger"
      />

      {/* Payment Settlement Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        booking={booking}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
