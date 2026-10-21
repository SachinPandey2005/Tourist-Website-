import { useState, useEffect, useCallback, FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { Input } from '../../components/ui/Input.js';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { adminApi } from '../../lib/api/admin.js';
import type { CouponDto, DiscountType } from '@tourist/shared';

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<string>('15');
  const [minBookingAmount, setMinBookingAmount] = useState<string>('');
  const [maxUses, setMaxUses] = useState<string>('');
  const startDate = '2026-06-01T00:00:00.000Z';
  const endDate = '2026-12-31T23:59:59.000Z';
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete State
  const [couponToDelete, setCouponToDelete] = useState<CouponDto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getAdminCoupons();
      setCoupons(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve promotional coupons.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreateCoupon = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setCreateError(null);
      await adminApi.createCoupon({
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        discountType,
        discountValue: parseFloat(discountValue),
        minBookingAmount: minBookingAmount ? parseFloat(minBookingAmount) : undefined,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
        startDate,
        endDate,
      });
      setIsCreateOpen(false);
      setCode('');
      setDescription('');
      await fetchCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create coupon.';
      setCreateError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!couponToDelete) return;
    try {
      setIsDeleting(true);
      await adminApi.deleteCoupon(couponToDelete.id);
      setCouponToDelete(null);
      await fetchCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete coupon.';
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
            PROMOTIONS & DISCOUNT RULES
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Promotional Coupons
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure promotional discount codes, usage constraints, and expiration schedules.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Create Promo Code
        </Button>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Could not load coupons"
          message={errorMessage}
          onRetry={fetchCoupons}
        />
      ) : coupons.length === 0 ? (
        <EmptyState
          title="No promotional coupons found"
          description="Create your first campaign discount code for travelers."
          actionLabel="Create Coupon"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Min Reservation</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">
                      <div>
                        <span>{c.code}</span>
                        {c.description && (
                          <p className="text-[11px] text-slate-500 font-sans font-normal truncate max-w-xs">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100">
                      {c.discountType === 'PERCENTAGE'
                        ? `${c.discountValue}% OFF`
                        : `$${c.discountValue} FLAT`}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {c.minBookingAmount ? `$${c.minBookingAmount}` : 'None'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : 'uses'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(c.startDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      –{' '}
                      {new Date(c.endDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={c.isActive ? 'success' : 'neutral'}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setCouponToDelete(c)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Coupon Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateError(null);
        }}
        title="Create Promotional Coupon"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {createError}
            </div>
          )}

          <Input
            label="Coupon Code"
            type="text"
            placeholder="e.g. SUMMER2026"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
          />

          <Input
            label="Campaign Description"
            type="text"
            placeholder="e.g. 15% off summer travel expeditions"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
              </select>
            </div>

            <Input
              label="Discount Value"
              type="number"
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min Booking ($) (Optional)"
              type="number"
              step="0.01"
              placeholder="e.g. 500"
              value={minBookingAmount}
              onChange={(e) => setMinBookingAmount(e.target.value)}
            />

            <Input
              label="Max Total Uses (Optional)"
              type="number"
              placeholder="e.g. 100"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Create Coupon
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {couponToDelete && (
        <ConfirmationDialog
          isOpen={Boolean(couponToDelete)}
          onClose={() => setCouponToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Promotional Coupon"
          description={`Are you sure you want to permanently delete coupon code "${couponToDelete.code}"? Customers will no longer be able to apply this discount.`}
          confirmText="Permanently Delete"
          isConfirming={isDeleting}
          variant="danger"
        />
      )}
    </div>
  );
}
