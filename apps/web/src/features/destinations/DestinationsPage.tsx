import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, ArrowRight, Search } from 'lucide-react';
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
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useApi(
    () =>
      destinationApi.list({
        search: search || undefined,
        category: category || undefined,
        page,
        pageSize: 6,
      }),
    { immediate: true }
  );

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
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search destination or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full sm:w-48 text-xs"
            options={[
              { value: '', label: 'All Categories' },
              { value: 'CULTURAL', label: 'Cultural' },
              { value: 'MOUNTAIN', label: 'Mountain' },
              { value: 'BEACH', label: 'Beach & Marine' },
              { value: 'WILDLIFE', label: 'Wildlife Safari' },
              { value: 'ADVENTURE', label: 'Adventure' },
            ]}
          />
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Apply
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <EmptyState
          title="No Destinations Found"
          description="Try broadening your category or search term."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setCategory('');
                refetch();
              }}
            >
              Reset Filters
            </Button>
          }
        />
      )}

      {/* Catalog Grid */}
      {!isLoading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} hoverable className="flex flex-col group">
              <div className="relative h-56 overflow-hidden rounded-t-2xl">
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

              <CardContent className="flex-1 flex flex-col justify-between pt-5 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.shortDescription || item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{item.rating ? item.rating.toFixed(2) : '4.90'}</span>
                    <span className="text-slate-500 font-normal">({item.reviewCount || 42})</span>
                  </div>

                  <Link to={`/destinations/${item.slug}`}>
                    <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={data?.pagination?.totalPages || 1}
        totalItems={data?.pagination?.totalItems || items.length}
        pageSize={6}
        onPageChange={(p) => setPage(p)}
      />
    </div>
  );
}
