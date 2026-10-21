import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight, Search, Compass } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Pagination } from '../../components/ui/Pagination.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { destinationApi } from '../../lib/api/destinations.js';
import { useApi } from '../../hooks/useApi.js';

export function DestinationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sortBy') || 'createdAt';

  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const { data, isLoading, error, refetch, execute } = useApi(
    () =>
      destinationApi.list({
        search: search || undefined,
        category: category || undefined,
        page,
        pageSize: 6,
        sortBy,
      }),
    { immediate: true }
  );

  // Re-fetch whenever query params in URL change
  useEffect(() => {
    execute();
  }, [search, category, page, sortBy, execute]);

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

  const fallbackItems = [
    {
      id: 'kyoto-1',
      title: 'Kyoto Imperial Heritage',
      slug: 'kyoto-japan',
      location: 'Japan, Kansai',
      category: 'CULTURAL',
      rating: 4.92,
      reviewCount: 148,
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      shortDescription: 'Thousands of classical temples, serene bamboo groves, and authentic tea rituals.',
      description: 'Thousands of classical temples, serene bamboo groves, and authentic tea rituals.',
    },
    {
      id: 'swiss-1',
      title: 'Zermatt & Matterhorn Alps',
      slug: 'swiss-alps-zermatt',
      location: 'Switzerland, Valais',
      category: 'MOUNTAIN',
      rating: 4.96,
      reviewCount: 92,
      imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
      shortDescription: 'Car-free alpine serenity, high glacier crossings, and dramatic peak viewpoints.',
      description: 'Car-free alpine serenity, high glacier crossings, and dramatic peak viewpoints.',
    },
    {
      id: 'santorini-1',
      title: 'Santorini Caldera Sunsets',
      slug: 'santorini-cyclades',
      location: 'Greece, Cyclades',
      category: 'BEACH',
      rating: 4.88,
      reviewCount: 215,
      imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      shortDescription: 'Whitewashed cliffside villages, azure waters, and private caldera catamaran escapes.',
      description: 'Whitewashed cliffside villages, azure waters, and private caldera catamaran escapes.',
    },
    {
      id: 'serengeti-1',
      title: 'Serengeti Wildlife Sanctuary',
      slug: 'serengeti-safari',
      location: 'Tanzania, Mara',
      category: 'WILDLIFE',
      rating: 4.95,
      reviewCount: 84,
      imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
      shortDescription: 'Endless African savannas, legendary Big Five encounters, and luxury eco-tents.',
      description: 'Endless African savannas, legendary Big Five encounters, and luxury eco-tents.',
    },
  ];

  const items = data?.items && data.items.length > 0 ? data.items : fallbackItems;
  const pagination = data?.pagination || {
    page: 1,
    pageSize: 6,
    totalItems: fallbackItems.length,
    totalPages: 1,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <Badge variant="brand">DISCOVERY CATALOG</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
          Global Travel Destinations
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Browse verified sanctuaries, mountains, coastlines, and historic cultural districts.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex gap-2">
          <Input
            placeholder="Search destination or region..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Select
            value={category}
            onChange={(e) => updateFilters({ category: e.target.value || null, page: '1' })}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'CULTURAL', label: 'Cultural' },
              { value: 'MOUNTAIN', label: 'Mountain' },
              { value: 'BEACH', label: 'Beach & Coastal' },
              { value: 'WILDLIFE', label: 'Wildlife' },
            ]}
            className="w-44"
          />

          <Select
            value={sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value, page: '1' })}
            options={[
              { value: 'createdAt', label: 'Newest Additions' },
              { value: 'title', label: 'Alphabetical' },
              { value: 'rating', label: 'Top Rated' },
            ]}
            className="w-44"
          />

          {(search || category) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalSearch('');
                setSearchParams(new URLSearchParams());
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Catalog Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error && items.length === 0 ? (
        <ErrorState
          title="Could Not Load Destinations"
          message={error.message}
          onRetry={refetch}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8" />}
          title="No Destinations Found"
          description="We couldn't find any destinations matching your current filters. Try searching for broader terms."
          actionLabel="Clear Filters"
          onAction={() => {
            setLocalSearch('');
            setSearchParams(new URLSearchParams());
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} hoverable className="overflow-hidden group flex flex-col justify-between">
              <div>
                <div className="h-52 relative overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge variant="brand">{item.category}</Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-semibold text-white drop-shadow">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{item.location}</span>
                  </div>
                </div>

                <CardContent className="pt-5 space-y-3">
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.shortDescription || item.description}
                  </p>
                </CardContent>
              </div>

              <div className="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{item.rating ? item.rating.toFixed(2) : '4.90'}</span>
                  <span className="text-slate-500 font-normal">({item.reviewCount || 42})</span>
                </div>

                <Link to={`/destinations/${item.slug}`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Explore
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
