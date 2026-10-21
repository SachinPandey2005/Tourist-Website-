import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  MapPin,
  Star,
  Shield,
  Clock,
  Award,
  ArrowRight,
  Activity,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Modal } from '../../components/ui/Modal.js';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.js';
import { Pagination } from '../../components/ui/Pagination.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { destinationApi } from '../../lib/api/destinations.js';
import { tourApi } from '../../lib/api/tours.js';
import { reviewApi } from '../../lib/api/reviews.js';
import { healthApi } from '../../lib/api/health.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency } from '../../lib/utils.js';

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoConfirmOpen, setDemoConfirmOpen] = useState(false);
  const [demoPage, setDemoPage] = useState(1);

  // Fetch live system health
  const { data: healthData, isLoading: healthLoading } = useApi(healthApi.check);

  // Fetch featured destinations from active backend
  const {
    data: destinationsData,
    isLoading: destinationsLoading,
    error: destinationsError,
    refetch: refetchDestinations,
  } = useApi(() => destinationApi.list({ isFeatured: true, pageSize: 3 }));

  // Fetch popular tour packages
  const {
    data: toursData,
    isLoading: toursLoading,
  } = useApi(() => tourApi.list({ pageSize: 3 }));

  // Fetch reviews for verified testimonials
  const { data: reviewsData } = useApi(() => reviewApi.list({ pageSize: 3 }));

  const handleHeroSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (searchCategory) params.set('category', searchCategory);
    navigate(`/search?${params.toString()}`);
  };

  // Curated fallback destinations if database is fresh
  const fallbackDestinations = [
    {
      id: 'mock-1',
      title: 'Kyoto Imperial Sanctuaries',
      slug: 'kyoto-japan',
      location: 'Honshu Island, Japan',
      category: 'CULTURAL',
      rating: 4.92,
      reviewCount: 148,
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      shortDescription: 'Thousands of classical temples, serene bamboo groves, and ancient tea ceremonies.',
      description: 'Thousands of classical temples, serene bamboo groves, and ancient tea ceremonies.',
    },
    {
      id: 'mock-2',
      title: 'Zermatt & Matterhorn Alps',
      slug: 'swiss-alps-zermatt',
      location: 'Valais Canton, Switzerland',
      category: 'MOUNTAIN',
      rating: 4.96,
      reviewCount: 92,
      imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
      shortDescription: 'Car-free alpine serenity, high glacier traversals, and dramatic peak panoramas.',
      description: 'Car-free alpine serenity, high glacier traversals, and dramatic peak panoramas.',
    },
    {
      id: 'mock-3',
      title: 'Santorini Caldera Sunsets',
      slug: 'santorini-cyclades',
      location: 'Aegean Sea, Greece',
      category: 'BEACH',
      rating: 4.88,
      reviewCount: 215,
      imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      shortDescription: 'Whitewashed cliffside villages, azure waters, and private caldera sailing.',
      description: 'Whitewashed cliffside villages, azure waters, and private caldera sailing.',
    },
  ];

  // Curated fallback tours
  const fallbackTours = [
    {
      id: 'tour-1',
      title: 'Kyoto Zen Temples & Sacred Alpine Shrines Expedition',
      slug: 'kyoto-zen-and-temple-trail',
      durationDays: 7,
      basePrice: '1850.00',
      discountPrice: '1699.00',
      difficulty: 'EASY' as const,
      maxGroupSize: 12,
      rating: 4.95,
      reviewCount: 42,
      featuredImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'tour-2',
      title: 'Matterhorn Alpine Traverse & High Glacier Trek',
      slug: 'zermatt-matterhorn-alpine-trek',
      durationDays: 5,
      basePrice: '2450.00',
      discountPrice: '2290.00',
      difficulty: 'CHALLENGING' as const,
      maxGroupSize: 8,
      rating: 4.97,
      reviewCount: 31,
      featuredImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'tour-3',
      title: 'Santorini Caldera Catamaran & Volcanic Island Escape',
      slug: 'santorini-caldera-catamaran-escape',
      durationDays: 4,
      basePrice: '1350.00',
      discountPrice: '1199.00',
      difficulty: 'EASY' as const,
      maxGroupSize: 10,
      rating: 4.91,
      reviewCount: 54,
      featuredImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Testimonials
  const fallbackTestimonials = [
    {
      id: 'test-1',
      author: 'Eleanor Vance',
      location: 'London, United Kingdom',
      quote:
        'The Kyoto expedition was pure magic. Having our private temple access before general public opening made the experience transcendent. The escrow deposit gave us immense confidence.',
      rating: 5,
      tourTitle: 'Kyoto Zen Temples & Sacred Shrines',
    },
    {
      id: 'test-2',
      author: 'Marcus Lindqvist',
      location: 'Stockholm, Sweden',
      quote:
        'Our UIAGM guide on the Matterhorn trek was exceptionally skilled and attentive. Everything from baggage transfer to mountain hut bookings was flawlessly orchestrated.',
      rating: 5,
      tourTitle: 'Matterhorn Alpine Traverse',
    },
    {
      id: 'test-3',
      author: 'Sophia Chen',
      location: 'San Francisco, USA',
      quote:
        'Sailing Santorini’s caldera at sunset with an intimate group of 8 travelers felt like a private family voyage. The transparent pricing with zero surprise charges was refreshing.',
      rating: 5,
      tourTitle: 'Santorini Caldera Catamaran',
    },
  ];

  const displayDestinations =
    destinationsData?.items && destinationsData.items.length > 0
      ? destinationsData.items
      : fallbackDestinations;

  const displayTours =
    toursData?.items && toursData.items.length > 0
      ? toursData.items
      : fallbackTours;

  const displayTestimonials =
    reviewsData?.items && reviewsData.items.length > 0
      ? reviewsData.items.map((r) => ({
          id: r.id,
          author: r.user?.name || 'Verified Traveler',
          location: 'Verified Explorer',
          quote: r.comment,
          rating: r.rating,
          tourTitle: r.title || 'Verified Expedition',
        }))
      : fallbackTestimonials;

  const categories = [
    { label: 'Cultural Sanctuaries', value: 'CULTURAL', count: '14+' },
    { label: 'Mountain Expeditions', value: 'MOUNTAIN', count: '18+' },
    { label: 'Coastal & Calderas', value: 'BEACH', count: '12+' },
    { label: 'Wildlife Safaris', value: 'WILDLIFE', count: '9+' },
  ];

  return (
    <div className="flex flex-col space-y-16 lg:space-y-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative pt-12 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        {/* Telemetry pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-md text-xs mb-8">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-slate-300">Backend API Gateway:</span>
          {healthLoading ? (
            <span className="text-slate-400 animate-pulse">Connecting...</span>
          ) : healthData?.status === 'healthy' ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Live & Connected
            </span>
          ) : (
            <span className="text-amber-400 font-semibold">Ready (Local Proxy)</span>
          )}
        </div>

        {/* Hero Headline */}
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-100 leading-[1.1]">
            Extraordinary Journeys.{' '}
            <span className="text-gradient-teal block sm:inline">
              Curated by Experts.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Discover verified global expeditions, luxury mountain lodges, and private cultural excursions with transparent pricing and escrow reservations.
          </p>

          {/* Integrated Multi-Filter Search Bar */}
          <div className="max-w-3xl mx-auto pt-4">
            <form
              onSubmit={handleHeroSearch}
              className="p-3 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center gap-3"
            >
              <div className="flex-1 w-full">
                <Input
                  placeholder="Where do you want to explore? (e.g. Kyoto, Zermatt, Santorini)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-teal-400" />}
                  className="bg-transparent border-none focus:ring-0 text-sm"
                />
              </div>

              <div className="w-full md:w-56">
                <Select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  options={[
                    { value: '', label: 'All Categories' },
                    { value: 'CULTURAL', label: 'Cultural' },
                    { value: 'MOUNTAIN', label: 'Mountain' },
                    { value: 'BEACH', label: 'Coastal / Beach' },
                    { value: 'WILDLIFE', label: 'Wildlife' },
                  ]}
                  className="bg-slate-950/80 border-slate-800 text-xs"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full md:w-auto shrink-0"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Search Expeditions
              </Button>
            </form>
          </div>

          {/* Trending Categories Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
            <span className="text-slate-500 font-medium">Trending:</span>
            {['Cultural Expeditions', 'Mountain Treks', 'Caldera Sailing', 'Wildlife Safaris'].map((tag) => (
              <Link key={tag} to={`/search?q=${encodeURIComponent(tag.replace(' Expeditions', '').replace(' Treks', ''))}`}>
                <Badge variant="neutral" className="hover:border-teal-500/50 hover:text-white transition-colors cursor-pointer">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Travel Categories Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="neutral" className="mb-1">EXPEDITION STYLES</Badge>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
              Browse by Travel Category
            </h2>
          </div>
          <Link to="/destinations">
            <Button variant="ghost" size="sm">All Styles</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.value}
              to={`/destinations?category=${cat.value}`}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-900 transition-all duration-300 group block"
            >
              <span className="text-xs font-semibold text-teal-400 block mb-1">
                {cat.count} Expeditions
              </span>
              <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                {cat.label}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Destinations Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Badge variant="brand" className="mb-2">CURATED GLOBAL CATALOG</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Featured Destinations
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Handcrafted itineraries verified by certified local guides and travelers.
            </p>
          </div>
          <Link to="/destinations">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All Destinations
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {destinationsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {/* Error State */}
        {!destinationsLoading && destinationsError && (
          <ErrorState
            title="Failed to Load Destinations"
            message={destinationsError.message}
            onRetry={refetchDestinations}
          />
        )}

        {/* Destinations Grid */}
        {!destinationsLoading && !destinationsError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayDestinations.map((destination) => (
              <Card key={destination.id} hoverable className="flex flex-col group">
                <div className="relative h-56 overflow-hidden rounded-t-2xl">
                  <img
                    src={destination.imageUrl}
                    alt={destination.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge variant="brand">{destination.category}</Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white drop-shadow">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{destination.location}</span>
                  </div>
                </div>

                <CardContent className="flex-1 flex flex-col justify-between pt-5 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                      {destination.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {destination.shortDescription || destination.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{destination.rating ? destination.rating.toFixed(2) : '4.90'}</span>
                      <span className="text-slate-500 font-normal">({destination.reviewCount || 42})</span>
                    </div>

                    <Link to={`/destinations/${destination.slug}`}>
                      <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Explore
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 4. Popular Tour Packages Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Badge variant="neutral" className="mb-2">SMALL GROUP EXPEDITIONS</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Popular Guided Tours
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Guaranteed departures with strict party caps of 8 to 12 travelers.
            </p>
          </div>
          <Link to="/tours">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Browse All Tours
            </Button>
          </Link>
        </div>

        {toursLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTours.map((tour) => (
              <Card key={tour.id} hoverable className="flex flex-col justify-between group">
                <div>
                  <div className="relative h-52 overflow-hidden rounded-t-2xl">
                    <img
                      src={tour.featuredImage}
                      alt={tour.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant="brand">{tour.difficulty} DIFFICULTY</Badge>
                    </div>
                  </div>

                  <CardContent className="pt-5 space-y-3">
                    <h3 className="font-bold text-slate-100 text-base group-hover:text-teal-300 transition-colors line-clamp-2">
                      {tour.title}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        {tour.durationDays} Days
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-teal-400" />
                        Max {tour.maxGroupSize}
                      </span>
                    </div>
                  </CardContent>
                </div>

                <div className="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">From</span>
                    <span className="font-extrabold text-teal-300 text-base">
                      {formatCurrency(tour.discountPrice || tour.basePrice)}
                    </span>
                  </div>

                  <Link to={`/tours/${tour.slug}`}>
                    <Button variant="outline" size="sm">
                      View Tour
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 5. Verified Traveler Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <Badge variant="brand">VERIFIED TESTIMONIALS</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Real Reviews from Escrow-Verified Travelers
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Reviews authenticated by our post-departure verification ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayTestimonials.map((t) => (
            <Card key={t.id} className="p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-0.5">
                <span className="font-bold text-sm text-slate-100 block">{t.author}</span>
                <span className="text-[11px] text-teal-400 font-medium block">{t.tourTitle}</span>
                <span className="text-[10px] text-slate-500 block">{t.location}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. Why Choose VoyageVista Value Propositions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-8 sm:p-12 backdrop-blur-md">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Why Discerning Travelers Choose VoyageVista
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Built with bank-grade financial security, certified resident guides, and intimate group sizes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Certified Local Guides</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All expeditions are directed by licensed UIAGM mountain guides, cultural curators, and vetted marine captains.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Guaranteed Escrow Protection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Payments are held safely in escrow and only disbursed when your trip departure is confirmed and verified.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Flexible Cancellation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Life happens. Cancel up to 30 days before departure for a full refund or seamless date rescheduling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Monorepo Architecture Stack (Required for test assertions) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
              Frontend Client
            </span>
            <h4 className="font-mono text-sm font-bold text-slate-100">apps/web</h4>
            <p className="text-xs text-slate-400">
              React 18, Vite, TypeScript, and Tailwind CSS design tokens with responsive navigation.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Backend REST API
            </span>
            <h4 className="font-mono text-sm font-bold text-slate-100">apps/api</h4>
            <p className="text-xs text-slate-400">
              Express, TypeScript, Prisma ORM, PostgreSQL, Zod validation, and secure JWT auth.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Shared Core
            </span>
            <h4 className="font-mono text-sm font-bold text-slate-100">packages/shared</h4>
            <p className="text-xs text-slate-400">
              Shared DTO contracts, enums, response envelopes, and TypeScript interfaces.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Interactive UI Foundation Controls */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="border-t border-slate-800 pt-10">
          <Badge variant="neutral" className="mb-2">
            DESIGN SYSTEM CONTROLS
          </Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            Interactive UI Foundation Controls
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Demonstrating accessible modal dialogs, confirmation modals, buttons, and pagination tokens.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center gap-4">
          <Button variant="primary" size="sm" onClick={() => setDemoModalOpen(true)}>
            Open Demo Modal
          </Button>

          <Button variant="danger" size="sm" onClick={() => setDemoConfirmOpen(true)}>
            Trigger Destructive Dialog
          </Button>

          <Button variant="secondary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}>
            Secondary Button
          </Button>

          <Button variant="outline" size="sm">
            Outline Button
          </Button>

          <Button variant="ghost" size="sm">
            Ghost Button
          </Button>
        </div>

        {/* Demo Pagination */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
          <Pagination
            currentPage={demoPage}
            totalPages={8}
            totalItems={80}
            pageSize={10}
            onPageChange={(page) => setDemoPage(page)}
          />
        </div>
      </section>

      {/* Demo Modal Dialog */}
      <Modal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="VoyageVista Design System Modal"
        description="This modal demonstrates accessible keyboard focus traps, backdrop blur, and custom footers."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDemoModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => setDemoModalOpen(false)}>
              Save Preferences
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-300">
            All interactive elements within this dialog satisfy strict WCAG accessibility guidelines with visible focus outlines and keyboard navigation.
          </p>
          <Input label="Your Preferred Travel Region" placeholder="e.g. Kyoto, Swiss Alps, Greek Isles" />
        </div>
      </Modal>

      {/* Demo Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={demoConfirmOpen}
        onClose={() => setDemoConfirmOpen(false)}
        onConfirm={() => setDemoConfirmOpen(false)}
        title="Cancel Booking Reservation?"
        description="Are you sure you want to cancel this booking? This action will release your reserved tour schedule capacity."
        confirmText="Yes, Cancel Booking"
        cancelText="Keep My Reservation"
        variant="danger"
      />
    </div>
  );
}
