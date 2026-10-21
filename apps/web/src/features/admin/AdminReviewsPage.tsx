import { useState, useEffect, useCallback } from 'react';
import { Star, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.js';
import { Pagination } from '../../components/ui/Pagination.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { reviewApi } from '../../lib/api/reviews.js';
import type { ReviewDto } from '@tourist/shared';

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deletion Dialog State
  const [reviewToDelete, setReviewToDelete] = useState<ReviewDto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await reviewApi.list({
        page,
        pageSize,
        rating: ratingFilter,
      });
      setReviews(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve reviews.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    try {
      setIsDeleting(true);
      await reviewApi.delete(reviewToDelete.id);
      setReviewToDelete(null);
      await fetchReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete review.';
      alert(`Deletion error: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="warning" className="mb-2">
            COMMUNITY & RATINGS
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Review Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit traveler reviews, inspect verified booking badges, and moderate inappropriate feedback.
          </p>
        </div>

        <select
          value={ratingFilter ?? ''}
          onChange={(e) => {
            const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
            setRatingFilter(val);
            setPage(1);
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Could not load reviews"
          message={errorMessage}
          onRetry={fetchReviews}
        />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews found"
          description="There are currently no reviews matching this rating filter."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Review Content</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {r.user?.name || 'Anonymous Traveler'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{r.rating}.0</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      {r.title && <p className="font-bold text-slate-100">{r.title}</p>}
                      <p className="text-slate-400 text-[11px] line-clamp-2">{r.comment}</p>
                    </td>
                    <td className="py-3 px-4">
                      {r.isVerifiedBooking ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-teal-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified Booking</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Public Submission</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setReviewToDelete(r)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </Card>
      )}

      {/* Confirmation Dialog */}
      {reviewToDelete && (
        <ConfirmationDialog
          isOpen={Boolean(reviewToDelete)}
          onClose={() => setReviewToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Review"
          description={`Are you sure you want to moderate and permanently delete this review by ${
            reviewToDelete.user?.name || 'traveler'
          }? The aggregate rating of the item will be automatically recalculated.`}
          confirmText="Delete Review"
          isConfirming={isDeleting}
          variant="danger"
        />
      )}
    </div>
  );
}
