import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Clock,
  ShieldCheck,
  Compass,
  ArrowRight,
  User,
  CreditCard,
  MapPin,
  CalendarCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { useAuth } from '../../context/AuthContext.js';
import { bookingsApi, UserBookingRecord } from '../../lib/api/bookings.js';
import { favoritesApi } from '../../lib/api/favorites.js';

export function DashboardOverviewPage() {
  const { user } = useAuth();
  const [upcomingBooking, setUpcomingBooking] = useState<UserBookingRecord | null>(null);
  const [bookingCount, setBookingCount] = useState<number>(0);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOverview() {
      try {
        setIsLoading(true);
        const [bookingsRes, favoritesRes] = await Promise.allSettled([
          bookingsApi.getMyBookings({ pageSize: 10 }),
          favoritesApi.getMyFavorites(),
        ]);

        if (!isMounted) return;

        if (bookingsRes.status === 'fulfilled') {
          const bookings = bookingsRes.value.items || [];
          setBookingCount(bookingsRes.value.pagination?.totalItems || bookings.length);
          // Find earliest upcoming confirmed booking
          const upcoming = bookings.find(
            (b) => b.status === 'CONFIRMED' || b.status === 'PENDING'
          );
          setUpcomingBooking(upcoming || bookings[0] || null);
        }

        if (favoritesRes.status === 'fulfilled') {
          setFavoritesCount(favoritesRes.value.length);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOverview();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      label: 'Total Bookings',
      value: isLoading ? '...' : String(bookingCount),
      subtext: 'Across all expeditions',
      icon: CalendarCheck,
      color: 'text-teal-400',
    },
    {
      label: 'Saved Expeditions',
      value: isLoading ? '...' : String(favoritesCount),
      subtext: 'In your wishlist',
      icon: Heart,
      color: 'text-rose-400',
    },
    {
      label: 'Account Status',
      value: user?.isEmailVerified ? 'Verified' : 'Active',
      subtext: user?.role === 'ADMIN' ? 'Administrator' : 'Traveler Tier',
      icon: ShieldCheck,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="brand" className="mb-2">
            TRAVELER DASHBOARD
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Welcome back, {user?.name || 'Explorer'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your journeys, access itinerary documents, and manage your account preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/tours">
            <Button variant="primary" size="sm" rightIcon={<Compass className="w-4 h-4" />}>
              Explore Expeditions
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  {stat.label}
                </span>
                <span className="text-2xl font-extrabold text-slate-100">{stat.value}</span>
                <span className="text-[11px] text-slate-500 block">{stat.subtext}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Upcoming / Active Journey Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Next Upcoming Departure</h2>
          <Link
            to="/dashboard/bookings"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <span>View All Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <Card className="p-6">
            <LoadingSkeleton className="h-32 w-full" />
          </Card>
        ) : upcomingBooking ? (
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="h-48 md:h-full relative overflow-hidden bg-slate-900">
                <img
                  src={
                    upcomingBooking.items[0]?.tourPackage?.featuredImage ||
                    upcomingBooking.items[0]?.hotel?.imageUrl ||
                    upcomingBooking.items[0]?.activity?.imageUrl ||
                    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'
                  }
                  alt="Booking thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge
                    variant={
                      upcomingBooking.status === 'CONFIRMED'
                        ? 'success'
                        : upcomingBooking.status === 'PENDING'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {upcomingBooking.status}
                  </Badge>
                </div>
              </div>

              <div className="p-6 md:col-span-2 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-teal-400 font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>
                      {upcomingBooking.items[0]?.startDate
                        ? new Date(upcomingBooking.items[0].startDate).toLocaleDateString(
                            undefined,
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )
                        : 'Departure Scheduled'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">
                    {upcomingBooking.items[0]?.itemTitle || 'Expedition Package'}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                    Booking Reference:{' '}
                    <span className="font-mono text-teal-300 font-semibold">
                      {upcomingBooking.bookingReference}
                    </span>
                    . Total reservation:{' '}
                    <span className="text-slate-200 font-semibold">
                      ${upcomingBooking.totalAmount} {upcomingBooking.currency}
                    </span>{' '}
                    ({upcomingBooking.items.length} item{upcomingBooking.items.length > 1 ? 's' : ''}).
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>
                      Payment:{' '}
                      <strong className="text-slate-200">
                        {upcomingBooking.payments[0]?.status || 'PENDING'}
                      </strong>
                    </span>
                  </div>

                  <Link to="/dashboard/bookings">
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Manage Reservation
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mx-auto flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">No active bookings found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You haven't reserved an expedition yet. Discover breathtaking destinations and secure
              your next world adventure today.
            </p>
            <div className="pt-2">
              <Link to="/destinations">
                <Button variant="primary" size="sm">
                  Discover Destinations
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>

      {/* Account Snapshot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Profile Overview</h3>
              <p className="text-xs text-slate-400">Personal information on record</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Full Name</span>
              <span className="font-semibold text-slate-200">{user?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Email Address</span>
              <span className="font-semibold text-slate-200">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Phone Number</span>
              <span className="font-semibold text-slate-200">{user?.phoneNumber || 'None added'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Account Role</span>
              <Badge variant="brand">{user?.role || 'TOURIST'}</Badge>
            </div>
          </div>

          <div className="pt-2">
            <Link to="/dashboard/profile">
              <Button variant="outline" size="sm" className="w-full">
                Edit Personal Details
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Saved Wishlist</h3>
              <p className="text-xs text-slate-400">Quickly access curated places</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            You currently have <strong className="text-slate-200">{favoritesCount}</strong> saved
            destinations and expedition packages in your personal travel wishlist.
          </p>

          <div className="pt-4">
            <Link to="/dashboard/favorites">
              <Button variant="outline" size="sm" className="w-full" rightIcon={<MapPin className="w-4 h-4" />}>
                View Saved Wishlist
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
