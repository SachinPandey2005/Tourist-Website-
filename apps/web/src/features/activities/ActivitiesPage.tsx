import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Compass, Search, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Pagination } from '../../components/ui/Pagination.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { activityApi } from '../../lib/api/activities.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency } from '../../lib/utils.js';

export function ActivitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [localSearch, setLocalSearch] = useState(search);

  const { data, isLoading, error, refetch } = useApi(
    () =>
      activityApi.list({
        search: search || undefined,
        category: category || undefined,
        page,
        pageSize: 6,
      }),
    { immediate: true }
  );

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
    updateFilters({ search: localSearch, page: '1' });
  };

  const fallbackActivities = [
    {
      id: 'act-demo-1',
      destinationId: 'dest-1',
      name: 'Private Gion Tea Ceremony with Grand Master',
      slug: 'gion-tea-ceremony',
      description:
        'Experience the profound serenity of chado (the way of tea) inside a 300-year-old preserved teahouse in Kyoto’s Gion quarter.',
      durationHours: 3,
      price: '180.00',
      imageUrl:
        'https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&w=800&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'act-demo-2',
      destinationId: 'dest-2',
      name: 'Matterhorn Glacier Sunrise Skiing & Heli-Drop',
      slug: 'matterhorn-glacier-ski',
      description:
        'Fly by helicopter to pristine high-alpine powder fields with a certified UIAGM mountain guide, catching the first golden rays on the Matterhorn.',
      durationHours: 6,
      price: '650.00',
      imageUrl:
        'https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=800&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'act-demo-3',
      destinationId: 'dest-3',
      name: 'Santorini Sunset Private Catamaran Cruise',
      slug: 'santorini-catamaran-cruise',
      description:
        'Sail through the volcanic caldera with private stops at the Red Beach and sulfur hot springs, accompanied by Greek mezze and local volcanic wine.',
      durationHours: 5,
      price: '340.00',
      imageUrl:
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'act-demo-4',
      destinationId: 'dest-4',
      name: 'Serengeti Dawn Hot Air Balloon Safari',
      slug: 'serengeti-balloon-safari',
      description:
        'Glide silently above the waking savanna herds at dawn, followed by a celebratory champagne bush breakfast in the wild.',
      durationHours: 4,
      price: '590.00',
      imageUrl:
        'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const items = data?.items && data.items.length > 0 ? data.items : fallbackActivities;
  const pagination = data?.pagination || {
    page: 1,
    pageSize: 6,
    totalItems: fallbackActivities.length,
    totalPages: 1,
  };

  const categories = [
    { label: 'All Experiences', value: '' },
    { label: 'Cultural', value: 'CULTURAL' },
    { label: 'Mountain', value: 'MOUNTAIN' },
    { label: 'Beach', value: 'BEACH' },
    { label: 'Wildlife', value: 'WILDLIFE' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="brand">LOCAL EXPERIENCES</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
          Curated Activities & Excursions
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Immerse in unique culinary, cultural, wildlife, and outdoor adventures with expert resident specialists.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex gap-2">
          <Input
            placeholder="Search activities..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => updateFilters({ category: cat.value || null, page: '1' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                category === cat.value
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat.label}
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
          title="Could Not Load Activities"
          message={error.message}
          onRetry={refetch}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8" />}
          title="No Activities Found"
          description="Try broadening your search or switching categories."
          actionLabel="Clear Filters"
          onAction={() => {
            setLocalSearch('');
            setSearchParams(new URLSearchParams());
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((act) => (
            <Card key={act.id} className="overflow-hidden group flex flex-col justify-between">
              <div>
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={act.imageUrl}
                    alt={act.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="brand">{act.durationHours} Hours</Badge>
                  </div>
                </div>

                <CardContent className="pt-5 space-y-3">
                  <h3 className="font-bold text-slate-100 text-base group-hover:text-teal-300 transition-colors line-clamp-1">
                    {act.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>
                </CardContent>
              </div>

              <div className="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">From</span>
                  <span className="font-extrabold text-teal-300 text-base">
                    {formatCurrency(act.price)}
                  </span>
                </div>

                <Link to={`/book?activityId=${act.id}`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Reserve
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
            onPageChange={(p) => updateFilters({ page: p.toString() })}
          />
        </div>
      )}
    </div>
  );
}
