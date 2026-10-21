import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Users,
  CalendarCheck,
  Compass,
  MapPin,
  Building,
  Star,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { adminApi } from '../../lib/api/admin.js';
import type { AdminOverviewStatsDto } from '@tourist/shared';

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminOverviewStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await adminApi.getOverviewStats();
      setStats(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load administration metrics.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="warning" className="mb-2">
            SYSTEM ADMINISTRATION
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Platform Operations & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time telemetry aggregated directly from PostgreSQL database records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/bookings">
            <Button variant="primary" size="sm" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
              Open Booking Desk
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          <LoadingSkeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Could not load platform statistics"
          message={errorMessage}
          onRetry={fetchStats}
        />
      ) : stats ? (
        <div className="space-y-8">
          {/* Primary High-Level Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Gross Revenue
                </span>
                <span className="text-2xl font-extrabold text-teal-300">
                  ${stats.grossRevenue}
                </span>
                <span className="text-[11px] text-teal-400/80 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Succeeded card & escrow transactions</span>
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Bookings
                </span>
                <span className="text-2xl font-extrabold text-slate-100">
                  {stats.totalBookings}
                </span>
                <span className="text-[11px] text-emerald-400 block">
                  {stats.confirmedBookings} Confirmed • {stats.cancelledBookings} Cancelled
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Registered Travelers
                </span>
                <span className="text-2xl font-extrabold text-slate-100">
                  {stats.totalUsers}
                </span>
                <span className="text-[11px] text-slate-400 block">Active platform profiles</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </Card>

            <Card className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Active Expeditions
                </span>
                <span className="text-2xl font-extrabold text-amber-300">
                  {stats.activeTours}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Across {stats.totalDestinations} Destinations
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
            </Card>
          </div>

          {/* Catalog Metrics Secondary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Destinations</span>
                <span className="text-lg font-bold text-slate-100">
                  {stats.totalDestinations} Published Locations
                </span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Hotels & Lodges</span>
                <span className="text-lg font-bold text-slate-100">
                  {stats.totalHotels} Accommodations
                </span>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Traveler Reviews</span>
                <span className="text-lg font-bold text-slate-100">
                  {stats.totalReviews} Verified Submissions
                </span>
              </div>
            </Card>
          </div>

          {/* Recent Bookings Live Ledger */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-100">Recent Transactions</h2>
                <p className="text-xs text-slate-400">
                  Latest customer bookings submitted across the catalog
                </p>
              </div>

              <Link
                to="/admin/bookings"
                className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <span>View Full Desk</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats.recentBookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                No recent booking records found.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Traveler</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Booking Status</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {stats.recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-teal-300">
                          {b.bookingReference}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-200">{b.userName}</p>
                          <p className="text-[11px] text-slate-500">{b.userEmail}</p>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-100">
                          ${b.totalAmount}
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              b.status === 'CONFIRMED'
                                ? 'success'
                                : b.status === 'CANCELLED'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {b.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
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
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(b.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
