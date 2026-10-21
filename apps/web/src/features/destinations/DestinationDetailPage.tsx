import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  ArrowLeft,
  Compass,
  Clock,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { destinationApi } from '../../lib/api/destinations.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency } from '../../lib/utils.js';

interface LinkedTour {
  id: string;
  title: string;
  slug: string;
  basePrice: string | number;
  discountPrice?: string | number | null;
  durationDays: number;
  rating: number;
  reviewCount: number;
  featuredImage: string;
}

interface LinkedHotel {
  id: string;
  name: string;
  slug: string;
  starRating: number;
  pricePerNight: string | number;
  imageUrl: string;
  address: string;
}

interface LinkedActivity {
  id: string;
  name: string;
  slug: string;
  durationHours: number;
  price: string | number;
  imageUrl: string;
}

export function DestinationDetailPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useApi(
    () => destinationApi.getBySlugOrId(idOrSlug || ''),
    { immediate: Boolean(idOrSlug) }
  );

  // High quality fallback destination for demonstrations if database is not seeded
  const fallbackDestination = {
    id: 'dest-demo',
    title: 'Kyoto Imperial Sanctuaries & Ancient Cedars',
    slug: 'kyoto-japan',
    location: 'Honshu Island, Kansai Region',
    country: 'Japan',
    city: 'Kyoto',
    category: 'CULTURAL',
    rating: 4.94,
    reviewCount: 168,
    imageUrl:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      'Immerse in the timeless heart of Japan. Kyoto boasts over 2,000 Buddhist temples and Shinto shrines, centuries-old Zen rock gardens, and bamboo groves whispering secrets of the Heian court. From private tea ceremonies in Gion to early morning meditations atop Mount Hiei, every step offers profound reverence and refined hospitality.',
    shortDescription:
      'Ancient imperial capital featuring UNESCO World Heritage temples, serene bamboo forests, and authentic Zen meditation sanctuaries.',
    tours: [
      {
        id: 'tour-1',
        title: 'Kyoto Zen Temples & Sacred Shrines Expedition',
        slug: 'kyoto-zen-and-temple-trail',
        basePrice: '1850.00',
        discountPrice: '1699.00',
        durationDays: 7,
        rating: 4.95,
        reviewCount: 42,
        featuredImage:
          'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      },
    ],
    hotels: [
      {
        id: 'hotel-1',
        name: 'The Ritz-Carlton Kyoto Kamogawa',
        slug: 'ritz-carlton-kyoto',
        starRating: 5,
        pricePerNight: '820.00',
        imageUrl:
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        address: 'Kamogawa Nijo-Ohashi Hotori, Nakagyo-ku, Kyoto',
      },
    ],
    activities: [
      {
        id: 'act-1',
        name: 'Private Gion Tea Ceremony with Grand Master',
        slug: 'gion-tea-ceremony',
        durationHours: 3,
        price: '180.00',
        imageUrl:
          'https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=800&q=80',
      },
    ],
  };

  const destination = data || fallbackDestination;
  const tours = (data?.tours as unknown as LinkedTour[]) || fallbackDestination.tours;
  const hotels = (data?.hotels as unknown as LinkedHotel[]) || fallbackDestination.hotels;
  const activities = (data?.activities as unknown as LinkedActivity[]) || fallbackDestination.activities;

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
          title="Could Not Load Destination"
          message={error.message || 'Unable to retrieve destination information from the network.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="w-full pb-20 space-y-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-brand-400 rounded-lg p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Catalog</span>
          </button>

          <div className="flex items-center gap-3">
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
              Share
            </Button>
            <Link to={`/tours?destination=${destination.slug || destination.id}`}>
              <Button variant="primary" size="sm" rightIcon={<Compass className="w-4 h-4" />}>
                Find Tours
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Visual Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl h-[420px] sm:h-[480px]">
          <img
            src={destination.imageUrl}
            alt={destination.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Bottom Banner Content */}
          <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 right-6 sm:right-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge variant="brand">{destination.category || 'DESTINATION'}</Badge>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{destination.rating ? destination.rating.toFixed(2) : '4.92'}</span>
                  <span className="text-slate-400 font-normal">({destination.reviewCount || 120} verified reviews)</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                {destination.title}
              </h1>

              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
                <span>{destination.location || `${destination.city || ''}, ${destination.country}`}</span>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <Link to="/booking/confirmation" state={{ title: destination.title }}>
                <Button variant="primary" size="lg" className="w-full">
                  Book Custom Itinerary
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Narrative & Details */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">About this Destination</h2>
            <p className="text-slate-300 leading-relaxed text-base">
              {destination.description}
            </p>
          </div>

          {/* Destination Highlights Checklist */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Traveler Highlights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Verified UNESCO World Heritage locations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>English-speaking licensed local guides</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>100% Escrow deposit protection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Private luxury vehicle transfers included</span>
              </div>
            </div>
          </div>

          {/* Linked Tours in this destination */}
          {tours && tours.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Available Guided Tours</h3>
                  <p className="text-xs text-slate-400">Curated expeditions departing from or exploring {destination.title}</p>
                </div>
                <Link to={`/tours?destination=${destination.slug || destination.id}`}>
                  <Button variant="ghost" size="sm">View All Tours</Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {tours.map((tour) => (
                  <Card key={tour.id} className="overflow-hidden group">
                    <div className="h-44 relative overflow-hidden">
                      <img
                        src={tour.featuredImage}
                        alt={tour.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="brand">{tour.durationDays} Days</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-bold text-slate-100 text-sm line-clamp-1 group-hover:text-teal-300 transition-colors">
                        {tour.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">From</span>
                        <div className="flex items-baseline gap-1.5">
                          {tour.discountPrice && (
                            <span className="text-slate-500 line-through text-[11px]">
                              {formatCurrency(tour.basePrice)}
                            </span>
                          )}
                          <span className="font-extrabold text-teal-300 text-sm">
                            {formatCurrency(tour.discountPrice || tour.basePrice)}
                          </span>
                        </div>
                      </div>
                      <Link to={`/tours/${tour.slug}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Tour Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Linked Hotels */}
          {hotels && hotels.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Where to Stay</h3>
                  <p className="text-xs text-slate-400">Luxury accommodations & boutique sanctuaries</p>
                </div>
                <Link to="/hotels">
                  <Button variant="ghost" size="sm">Browse Hotels</Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {hotels.map((hotel) => (
                  <Card key={hotel.id} className="overflow-hidden group">
                    <div className="h-40 relative overflow-hidden">
                      <img
                        src={hotel.imageUrl}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="warning">{hotel.starRating} Stars</Badge>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-bold text-slate-100 text-sm line-clamp-1 group-hover:text-amber-300 transition-colors">
                        {hotel.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1">{hotel.address}</p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Per night</span>
                        <span className="font-extrabold text-white text-sm">
                          {formatCurrency(hotel.pricePerNight)}
                        </span>
                      </div>
                      <Link to={`/hotels/${hotel.slug}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Hotel
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Linked Activities */}
          {activities && activities.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-100">Experiences & Local Activities</h3>
                  <p className="text-xs text-slate-400">Short cultural, culinary, and outdoor excursions</p>
                </div>
                <Link to="/activities">
                  <Button variant="ghost" size="sm">All Activities</Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {activities.map((act) => (
                  <Card key={act.id} className="p-4 flex gap-4 items-center">
                    <img
                      src={act.imageUrl}
                      alt={act.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-100 truncate">{act.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-400" />
                          {act.durationHours} hrs
                        </span>
                        <span className="font-bold text-teal-300">
                          {formatCurrency(act.price)}
                        </span>
                      </div>
                      <Link to="/activities">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          Book Activity
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary Card */}
        <div className="space-y-6">
          <Card className="p-6 space-y-6 sticky top-24">
            <h3 className="font-bold text-lg text-slate-100 border-b border-slate-800 pb-3">
              Destination Information
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Country</span>
                <span className="font-semibold text-slate-200">{destination.country}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Primary Category</span>
                <span className="font-semibold text-teal-300">{destination.category}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Travel Rating</span>
                <span className="font-semibold text-amber-400">
                  {destination.rating ? destination.rating.toFixed(2) : '4.94'} / 5.0
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Best Season</span>
                <span className="font-semibold text-slate-200">Spring & Autumn</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Visa Requirements</span>
                <span className="font-semibold text-slate-200">Standard Tourist E-Visa</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link to="/contact">
                <Button variant="primary" size="md" className="w-full">
                  Speak to Destination Specialist
                </Button>
              </Link>
              <Link to="/faq">
                <Button variant="outline" size="md" className="w-full">
                  Frequently Asked Questions
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
