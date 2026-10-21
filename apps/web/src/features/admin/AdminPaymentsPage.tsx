import { useState, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.js';
import { Pagination } from '../../components/ui/Pagination.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { adminApi, AdminPaymentItem } from '../../lib/api/admin.js';
import { PaymentStatus } from '@tourist/shared';

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refund Dialog State
  const [paymentToRefund, setPaymentToRefund] = useState<AdminPaymentItem | null>(null);
  const [isRefunding, setIsRefunding] = useState<boolean>(false);

  const fetchPayments = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const res = await adminApi.getAdminPayments({
        page,
        pageSize,
        status: statusFilter || undefined,
      });
      setPayments(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve payment records.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleConfirmRefund = async () => {
    if (!paymentToRefund) return;
    try {
      setIsRefunding(true);
      await adminApi.refundPayment(paymentToRefund.id);
      setPaymentToRefund(null);
      await fetchPayments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Refund operation failed.';
      alert(`Refund error: ${msg}`);
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="warning" className="mb-2">
            FINANCIAL AUDIT
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Payment & Refund Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete transaction ledger with escrow settlements, card processors, and refund tracking.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as PaymentStatus | '');
            setPage(1);
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        >
          <option value="">All Payment Statuses</option>
          <option value="SUCCEEDED">Succeeded</option>
          <option value="REFUNDED">Refunded</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Could not load payment records"
          message={errorMessage}
          onRetry={fetchPayments}
        />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payment records found"
          description="There are currently no transactions matching this status filter."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Traveler</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Processed Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => {
                  const isRefundable = p.status === 'SUCCEEDED';
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-300">
                        {p.paymentReference}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {p.bookingReference || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-200">{p.userName || 'Anonymous'}</p>
                        <p className="text-[11px] text-slate-500">{p.userEmail}</p>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-100">
                        ${p.amount} {p.currency}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{p.method}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            p.status === 'SUCCEEDED'
                              ? 'success'
                              : p.status === 'REFUNDED'
                              ? 'neutral'
                              : p.status === 'FAILED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {p.paidAt
                          ? new Date(p.paidAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : new Date(p.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isRefundable ? (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                            onClick={() => setPaymentToRefund(p)}
                          >
                            Issue Refund
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No action</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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

      {/* Confirmation Dialog for Refund */}
      {paymentToRefund && (
        <ConfirmationDialog
          isOpen={Boolean(paymentToRefund)}
          onClose={() => setPaymentToRefund(null)}
          onConfirm={handleConfirmRefund}
          title="Confirm Financial Refund"
          description={`Are you sure you want to issue a refund for ${paymentToRefund.paymentReference} totaling $${paymentToRefund.amount} ${paymentToRefund.currency}? This will update the transaction ledger to REFUNDED.`}
          confirmText="Confirm & Issue Refund"
          isConfirming={isRefunding}
          variant="danger"
        />
      )}
    </div>
  );
}
