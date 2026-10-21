import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Clock, Users, ArrowRight, Compass, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Pagination } from '../../components/ui/Pagination.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { tourApi } from '../../lib/api/tours.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency } from '../../lib/utils.js';

export function ToursPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const difficulty = searchParams.get('difficulty') || '';
  const destinationId = searchParams.get('destination') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const { data, isLoading, error, refetch, execute } = useApi(
    () =>
      tourApi.list({
        search: search || undefined,
        difficulty: difficulty || undefined,
        destinationId: destinationId || undefined,
        page,
        pageSize: 6,
      }),
    { immediate: true }
  );

  useEffect(() => {
    execute();
  }, [search, difficulty, destinationId, page, execute]);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') {
        updated.delete(key);
      } else {
        updated.set(key, val);
      }
    });
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: localSearch.trim() || null, page: '1' });
  };

  const fallbackTours = [
    {
      id: 'tour-1',
      title: 'Kyoto Zen Temples & Sacred Shrines Expedition',
      slug: 'kyoto-zen-and-temple-trail',
      durationDays: 7,
      basePrice: '1850.00',
      discountPrice: '1699.00',
      difficulty: 'EASY' as const,
      maxGroupSize: 12,
      rating: 4.94,
      reviewCount: 36,
      featuredImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      description: 'Private access to Zen meditation gardens, Fushimi Inari shrine corridors, and Gion tea rituals.',
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
      reviewCount: 28,
      featuredImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
      description: 'UIAGM certified alpine guide traversals along the Five Lakes Walk and high Gornergrat ridge.',
    },
    {
      id: 'tour-3',
      title: 'Santorini Caldera & Sunset Catamaran Escape',
      slug: 'santorini-caldera-catamaran-escape',
      durationDays: 4,
      basePrice: '1350.00',
      discountPrice: '1199.00',
      difficulty: 'EASY' as const,
      maxGroupSize: 10,
      rating: 4.91,
      reviewCount: 54,
      featuredImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      description: 'Private sailing excursions across volcanic thermal springs, Red Beach coves, and cliffside sunsets.',
    },
    {
      id: 'tour-4',
      title: 'Serengeti Great Migration Luxury Eco-Safari',
      slug: 'serengeti-great-migration-safari',
      durationDays: 8,
      basePrice: '3850.00',
      discountPrice: '3490.00',
      difficulty: 'MODERATE' as const,
      maxGroupSize: 6,
      rating: 4.98,
      reviewCount: 19,
      featuredImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
      description: 'Follow the dramatic Mara river crossings with dedicated naturalist guides and solar eco-tents.',
    },
  ];

  const items = data?.items && data.items.length > 0 ? data.items : fallbackTours;
  const pagination = data?.pagination || {
    page: 1,
    pageSize: 6,
    totalItems: fallbackTours.length,
    totalPages: 1,
  };

  const difficultyOptions = [
    { label: 'All Levels', value: '' },
    { label: 'Easy', value: 'EASY' },
    { label: 'Moderate', value: 'MODERATE' },
    { label: 'Challenging', value: 'CHALLENGING' },
    { label: 'Expert', value: 'EXPERT' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <Badge variant="brand">SMALL-PARTY EXPEDITIONS</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
          Guided Tour Packages
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Curated small group departures with fixed dates, transparent escrow payments, and certified mountain/cultural guides.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex gap-2">
          <Input
            placeholder="Search tours..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-semibold mr-1">Difficulty:</span>
          {difficultyOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateFilters({ difficulty: opt.value || null, page: '1' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                difficulty === opt.value
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error && items.length === 0 ? (
        <ErrorState
          title="Could Not Load Tour Packages"
          message={error.message}
          onRetry={refetch}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8" />}
          title="No Tour Packages Found"
          description="Try broadening your difficulty level or search keywords."
          actionLabel="Clear Filters"
          onAction={() => {
            setLocalSearch('');
            setSearchParams(new URLSearchParams());
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((tour) => (
            <Card key={tour.id} hoverable className="overflow-hidden group flex flex-col justify-between">
              <div>
                <div className="h-52 relative overflow-hidden">
                  <img
                    src={tour.featuredImage}
                    alt={tour.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
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
                      Max {tour.maxGroupSize} Guests
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {tour.description}
                  </p>
                </CardContent>
              </div>

              <div className="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Starting From</span>
                  <div className="flex items-baseline gap-1.5">
                    {tour.discountPrice && (
                      <span className="text-slate-500 line-through text-[11px]">
                        {formatCurrency(tour.basePrice)}
                      </span>
                    )}
                    <span className="font-extrabold text-teal-300 text-base">
                      {formatCurrency(tour.discountPrice || tour.basePrice)}
                    </span>
                  </div>
                </div>

                <Link to={`/tours/${tour.slug}`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Explore Tour
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={(newPage) => updateFilters({ page: newPage.toString() })}
          />
        </div>
      )}
    </div>
  );
}
