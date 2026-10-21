import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Eye,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.js';
import { Pagination } from '../../components/ui/Pagination.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { adminApi, AdminBookingItem } from '../../lib/api/admin.js';
import { bookingsApi, UserBookingRecord } from '../../lib/api/bookings.js';
import { BookingStatus } from '@tourist/shared';

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Status Change Dialog
  const [targetBooking, setTargetBooking] = useState<AdminBookingItem | null>(null);
  const [nextStatus, setNextStatus] = useState<BookingStatus>('CONFIRMED');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Booking Details Modal
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<UserBookingRecord | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getAdminBookings({
        page,
        pageSize,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setBookings(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve bookings list.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleConfirmStatusChange = async () => {
    if (!targetBooking) return;
    try {
      setIsUpdatingStatus(true);
      await adminApi.updateBookingStatus(targetBooking.id, nextStatus);
      setTargetBooking(null);
      await fetchBookings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update booking status.';
      alert(`Error updating status: ${msg}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenDetails = async (bookingId: string) => {
    try {
      const fullBooking = await bookingsApi.getBookingDetails(bookingId);
      setSelectedBookingDetails(fullBooking);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load booking details.';
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Badge variant="warning" className="mb-2">
          ADMIN DESK
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
          Booking Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review reservations across all customer accounts, change operational status, and inspect items.
        </p>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search reference, traveler name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as BookingStatus | '');
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Content */}
      {isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Could not load bookings"
          message={errorMessage}
          onRetry={fetchBookings}
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description="Try broadening your search query or removing the status filter."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Traveler</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-300">
                      {b.bookingReference}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200">{b.userName || 'Anonymous'}</p>
                      <p className="text-[11px] text-slate-500">{b.userEmail}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{b.itemCount} item(s)</td>
                    <td className="py-3 px-4 font-bold text-slate-100">${b.totalAmount}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          b.paymentStatus === 'SUCCEEDED'
                            ? 'success'
                            : b.paymentStatus === 'REFUNDED'
                            ? 'neutral'
                            : 'warning'
                        }
                      >
                        {b.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          b.status === 'CONFIRMED'
                            ? 'success'
                            : b.status === 'COMPLETED'
                            ? 'brand'
                            : b.status === 'CANCELLED'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(b.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetails(b.id)}
                          title="Inspect complete invoice and items"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <select
                          value={b.status}
                          onChange={(e) => {
                            setTargetBooking(b);
                            setNextStatus(e.target.value as BookingStatus);
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        >
                          <option value="CONFIRMED">Set Confirmed</option>
                          <option value="COMPLETED">Set Completed</option>
                          <option value="CANCELLED">Set Cancelled</option>
                          <option value="PENDING">Set Pending</option>
                        </select>
                      </div>
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

      {/* Confirmation Dialog for Status Change */}
      {targetBooking && (
        <ConfirmationDialog
          isOpen={Boolean(targetBooking)}
          onClose={() => setTargetBooking(null)}
          onConfirm={handleConfirmStatusChange}
          title="Confirm Booking Status Modification"
          description={`Are you sure you want to change the status of booking ${targetBooking.bookingReference} from ${targetBooking.status} to ${nextStatus}? This mutation is audited in the backend.`}
          confirmText={`Set to ${nextStatus}`}
          isConfirming={isUpdatingStatus}
          variant={nextStatus === 'CANCELLED' ? 'danger' : 'primary'}
        />
      )}

      {/* Booking Details Modal */}
      {selectedBookingDetails && (
        <Modal
          isOpen={Boolean(selectedBookingDetails)}
          onClose={() => setSelectedBookingDetails(null)}
          title={`Booking Details: ${selectedBookingDetails.bookingReference}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-slate-500 block">Customer</span>
                <span className="font-bold text-slate-100">
                  {selectedBookingDetails.user?.name || 'N/A'}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  {selectedBookingDetails.user?.email}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Amount</span>
                <span className="font-bold text-teal-300 text-sm">
                  ${selectedBookingDetails.totalAmount} {selectedBookingDetails.currency}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Created Timestamp</span>
                <span>{new Date(selectedBookingDetails.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-200">Reserved Items</h4>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-900/50">
                {selectedBookingDetails.items.map((item) => (
                  <div key={item.id} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-200">{item.itemTitle}</p>
                      <p className="text-slate-500 text-[11px]">
                        ${item.unitPrice} x {item.quantity}
                      </p>
                    </div>
                    <span className="font-bold text-slate-100">${item.totalPrice}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedBookingDetails.specialRequests && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-500 font-semibold block mb-1">
                  Traveler Special Requests:
                </span>
                <p className="italic text-slate-300">{selectedBookingDetails.specialRequests}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
