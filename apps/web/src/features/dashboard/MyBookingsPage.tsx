import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Eye,
  XCircle,
  CheckCircle2,
  Clock,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.js';
import { Pagination } from '../../components/ui/Pagination.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { bookingsApi, UserBookingRecord } from '../../lib/api/bookings.js';
import { reviewApi } from '../../lib/api/reviews.js';
import { BookingStatus } from '@tourist/shared';

type BookingTab = 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingTab>('ALL');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(6);
  const [bookings, setBookings] = useState<UserBookingRecord[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [selectedBooking, setSelectedBooking] = useState<UserBookingRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Cancellation States
  const [bookingToCancel, setBookingToCancel] = useState<UserBookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Review States
  const [reviewItem, setReviewItem] = useState<{
    bookingId: string;
    tourPackageId?: string;
    destinationId?: string;
    title: string;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      let statusParam: BookingStatus | undefined;
      if (activeTab === 'COMPLETED') statusParam = 'COMPLETED';
      else if (activeTab === 'CANCELLED') statusParam = 'CANCELLED';

      const res = await bookingsApi.getMyBookings({
        page,
        pageSize,
        status: statusParam,
      });

      let items = res.items || [];
      if (activeTab === 'UPCOMING') {
        items = items.filter(
          (b) => b.status === 'CONFIRMED' || b.status === 'PENDING'
        );
      }

      setBookings(items);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to load bookings.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle Cancellation
  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    try {
      setIsCancelling(true);
      await bookingsApi.cancelBooking(bookingToCancel.id, cancelReason || 'User requested cancellation');
      setBookingToCancel(null);
      setCancelReason('');
      await fetchBookings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed.';
      alert(`Error cancelling booking: ${msg}`);
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewItem) return;
    try {
      setIsSubmittingReview(true);
      setReviewError(null);
      await reviewApi.create({
        tourPackageId: reviewItem.tourPackageId,
        destinationId: reviewItem.destinationId,
        rating: reviewRating,
        title: reviewTitle || undefined,
        comment: reviewComment,
      });
      setReviewSuccess(true);
      setTimeout(() => {
        setReviewItem(null);
        setReviewSuccess(false);
        setReviewComment('');
        setReviewTitle('');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish review.';
      setReviewError(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="brand" className="mb-2">
            RESERVATIONS & EXPEDITIONS
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">My Bookings</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            View booking status, download vouchers, cancel reservations, and review past journeys.
          </p>
        </div>

        <Link to="/tours">
          <Button variant="primary" size="sm" rightIcon={<Compass className="w-4 h-4" />}>
            New Reservation
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800/80 gap-2 overflow-x-auto pb-1">
        {(['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as BookingTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'border-teal-400 text-teal-300 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            {tab === 'ALL' && 'All Expeditions'}
            {tab === 'UPCOMING' && 'Upcoming / Confirmed'}
            {tab === 'COMPLETED' && 'Completed Journeys'}
            {tab === 'CANCELLED' && 'Cancelled'}
          </button>
        ))}
      </div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="space-y-4">
          <LoadingSkeleton className="h-44 w-full rounded-2xl" />
          <LoadingSkeleton className="h-44 w-full rounded-2xl" />
          <LoadingSkeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Could not load bookings"
          message={errorMessage}
          onRetry={fetchBookings}
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings match your filter"
          description="You don't have any reservations under this status. Ready for your next adventure?"
          actionLabel="Explore Tour Packages"
          onAction={() => (window.location.href = '/tours')}
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isCancellable =
              booking.status === 'CONFIRMED' || booking.status === 'PENDING';
            const isCompleted = booking.status === 'COMPLETED' || booking.status === 'CONFIRMED';

            return (
              <Card
                key={booking.id}
                className="p-5 sm:p-6 transition-all hover:border-slate-700/80"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-teal-300">
                      {booking.bookingReference}
                    </span>
                    <Badge
                      variant={
                        booking.status === 'CONFIRMED'
                          ? 'success'
                          : booking.status === 'COMPLETED'
                          ? 'brand'
                          : booking.status === 'CANCELLED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {booking.status}
                    </Badge>
                    <Badge
                      variant={
                        booking.payments[0]?.status === 'SUCCEEDED'
                          ? 'success'
                          : booking.payments[0]?.status === 'REFUNDED'
                          ? 'neutral'
                          : 'warning'
                      }
                    >
                      Payment: {booking.payments[0]?.status || 'PENDING'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Reserved on{' '}
                      {new Date(booking.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Items in Booking */}
                <div className="py-4 space-y-3">
                  {booking.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                          <img
                            src={
                              item.tourPackage?.featuredImage ||
                              item.hotel?.imageUrl ||
                              item.activity?.imageUrl ||
                              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=300&q=80'
                            }
                            alt={item.itemTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-200 text-sm">{item.itemTitle}</p>
                          <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                            {item.startDate && (
                              <span>
                                {new Date(item.startDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            )}
                            <span>•</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:text-right">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Item Total</span>
                          <span className="font-bold text-slate-100 text-sm">
                            ${item.totalPrice} {booking.currency}
                          </span>
                        </div>

                        {/* Review Eligible Completed Tour */}
                        {isCompleted && item.tourPackage?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-400 hover:text-amber-300"
                            leftIcon={<Star className="w-3.5 h-3.5" />}
                            onClick={() =>
                              setReviewItem({
                                bookingId: booking.id,
                                tourPackageId: item.tourPackage!.id,
                                title: item.itemTitle,
                              })
                            }
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer summary & actions */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    Grand Total:{' '}
                    <strong className="text-slate-100 text-base font-extrabold ml-1">
                      ${booking.totalAmount} {booking.currency}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsDetailsOpen(true);
                      }}
                    >
                      Details & Invoice
                    </Button>

                    {isCancellable && (
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                        onClick={() => setBookingToCancel(booking)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {totalPages > 1 && (
            <div className="pt-4 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Booking Details: ${selectedBooking.bookingReference}`}
          maxWidth="lg"
        >
          <div className="space-y-6 text-xs text-slate-300">
            {/* Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-slate-500 block">Status</span>
                <span className="font-bold text-slate-100">{selectedBooking.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Currency</span>
                <span className="font-bold text-slate-100">{selectedBooking.currency}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Method</span>
                <span className="font-bold text-slate-100">
                  {selectedBooking.payments[0]?.method || 'Escrow'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Ref</span>
                <span className="font-mono text-teal-400">
                  {selectedBooking.payments[0]?.paymentReference || 'N/A'}
                </span>
              </div>
            </div>

            {/* Itemized breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-100">Itemized Breakdown</h4>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50">
                {selectedBooking.items.map((item) => (
                  <div key={item.id} className="p-3.5 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-200">{item.itemTitle}</p>
                      <p className="text-slate-400 text-[11px]">
                        ${item.unitPrice} x {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-slate-100">${item.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal</span>
                <span>${selectedBooking.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tax & Fees</span>
                <span>${selectedBooking.taxAmount}</span>
              </div>
              {Number(selectedBooking.discountAmount) > 0 && (
                <div className="flex justify-between text-teal-400">
                  <span>Promotional Discount</span>
                  <span>-${selectedBooking.discountAmount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-extrabold text-slate-100">
                <span>Total Paid / Due</span>
                <span>
                  ${selectedBooking.totalAmount} {selectedBooking.currency}
                </span>
              </div>
            </div>

            {selectedBooking.specialRequests && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">
                  Special Travel Requests:
                </span>
                <p className="text-slate-300 italic">{selectedBooking.specialRequests}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancellation Confirmation Dialog */}
      {bookingToCancel && (
        <ConfirmationDialog
          isOpen={Boolean(bookingToCancel)}
          onClose={() => setBookingToCancel(null)}
          onConfirm={handleConfirmCancel}
          title="Confirm Reservation Cancellation"
          description={`Are you sure you want to cancel booking ${bookingToCancel.bookingReference}? Your reserved schedule capacity will be restored to the travel catalog.`}
          confirmText="Yes, Cancel Reservation"
          isConfirming={isCancelling}
          variant="danger"
        />
      )}

      {/* Review Submission Modal */}
      {reviewItem && (
        <Modal
          isOpen={Boolean(reviewItem)}
          onClose={() => {
            setReviewItem(null);
            setReviewError(null);
            setReviewSuccess(false);
          }}
          title={`Review Journey: ${reviewItem.title}`}
          maxWidth="md"
        >
          {reviewSuccess ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
              <h4 className="text-base font-bold text-slate-100">Review Published!</h4>
              <p className="text-xs text-slate-400">
                Thank you for contributing your verified travel feedback to the VoyageVista community.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {reviewError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {reviewError}
                </div>
              )}

              {/* Star Rating Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`p-1.5 rounded-lg transition-transform hover:scale-110 ${
                        star <= reviewRating ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-300 ml-2">
                    {reviewRating} of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unforgettable cultural experience"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Detailed Comments
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your tour guides, accommodations, scenic views, and overall impressions..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewItem(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingReview}
                >
                  Submit Verified Review
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
