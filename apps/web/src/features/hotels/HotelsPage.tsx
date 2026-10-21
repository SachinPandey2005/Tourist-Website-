import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Building, Star, MapPin, Search, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { Pagination } from '../../components/ui/Pagination.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { hotelApi } from '../../lib/api/hotels.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency } from '../../lib/utils.js';

export function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const starRating = searchParams.get('starRating') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [localSearch, setLocalSearch] = useState(search);

  const { data, isLoading, error, refetch } = useApi(
    () =>
      hotelApi.list({
        search: search || undefined,
        starRating: starRating ? parseInt(starRating, 10) : undefined,
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

  const fallbackHotels = [
    {
      id: 'hotel-demo-1',
      destinationId: 'dest-1',
      name: 'The Ritz-Carlton Kyoto Kamogawa',
      slug: 'ritz-carlton-kyoto',
      description:
        'Nestled along the banks of the tranquil Kamogawa river, this sanctuary synthesizes traditional Meiji-era ryokan aesthetics with bespoke modern luxury.',
      address: 'Kamogawa Nijo-Ohashi Hotori, Nakagyo-ku, Kyoto',
      starRating: 5,
      pricePerNight: '820.00',
      amenities: ['River View', 'Luxury Spa', 'Michelin Star Dining', 'Private Onsen', 'High-Speed WiFi'],
      imageUrl:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'hotel-demo-2',
      destinationId: 'dest-2',
      name: 'The Omnia Alpine Lodge & Wellness',
      slug: 'the-omnia-zermatt',
      description:
        'Perched atop a 45-meter cliff overlooking the Matterhorn, The Omnia offers contemporary lodge architecture, open fireplaces, and infinity spa waters.',
      address: 'Auf dem Fels, 3920 Zermatt, Switzerland',
      starRating: 5,
      pricePerNight: '950.00',
      amenities: ['Matterhorn View', 'Indoor/Outdoor Pool', 'Finnish Sauna', 'Ski Concierge', 'Cocktail Lounge'],
      imageUrl:
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'hotel-demo-3',
      destinationId: 'dest-3',
      name: 'Canaves Oia Suites & Caldera Spa',
      slug: 'canaves-oia-suites',
      description:
        'Chiseled directly into the famous volcanic cliffs of Santorini, offering private infinity plunge pools and panoramic Aegean caldera sunset views.',
      address: 'Main Street, Oia 847 02, Santorini, Greece',
      starRating: 5,
      pricePerNight: '740.00',
      amenities: ['Infinity Pool', 'Caldera Panorama', 'Private Butler', 'Champagne Breakfast', 'Helipad'],
      imageUrl:
        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'hotel-demo-4',
      destinationId: 'dest-4',
      name: 'Singita Sasakwa Serengeti Lodge',
      slug: 'singita-sasakwa-lodge',
      description:
        'Edwardian manor elegance atop Sasakwa Hill overlooking the endless savannas during the Great Migration.',
      address: 'Grumeti Game Reserve, Serengeti, Tanzania',
      starRating: 5,
      pricePerNight: '1450.00',
      amenities: ['Private Game Drives', 'Infinity Pool', 'Wine Cellar', 'Equestrian Center', 'Spa'],
      imageUrl:
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const items = data?.items && data.items.length > 0 ? data.items : fallbackHotels;
  const pagination = data?.pagination || {
    page: 1,
    pageSize: 6,
    totalItems: fallbackHotels.length,
    totalPages: 1,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="brand">ACCOMMODATION PORTFOLIO</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
          Luxury Hotels & Boutique Lodges
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Handpicked five-star retreats, historic estates, and cliffside eco-lodges with guaranteed amenities.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 flex gap-2">
          <Input
            placeholder="Search hotel or location..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-semibold mr-1">Star Rating:</span>
          {['', '5', '4', '3'].map((star) => (
            <button
              key={star}
              onClick={() => updateFilters({ starRating: star || null, page: '1' })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                starRating === star
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {star ? `${star} Stars` : 'All Ratings'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error && items.length === 0 ? (
        <ErrorState
          title="Could Not Load Accommodations"
          message={error.message}
          onRetry={refetch}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Building className="w-8 h-8" />}
          title="No Accommodations Found"
          description="Try broadening your search criteria or resetting star rating filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setLocalSearch('');
            setSearchParams(new URLSearchParams());
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((hotel) => (
            <Card key={hotel.id} className="overflow-hidden group flex flex-col justify-between">
              <div>
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={hotel.imageUrl}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs font-bold text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{hotel.starRating} Stars</span>
                  </div>
                </div>

                <CardContent className="pt-5 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-100 text-base group-hover:text-amber-300 transition-colors line-clamp-1">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">{hotel.address}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {hotel.description}
                  </p>

                  {/* Amenities Preview */}
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-800/80 text-[11px] text-slate-300 font-medium border border-slate-700/50"
                        >
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 3 && (
                        <span className="text-[11px] text-slate-500 self-center">
                          +{hotel.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </div>

              <div className="p-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Nightly Rate</span>
                  <span className="font-extrabold text-white text-base">
                    {formatCurrency(hotel.pricePerNight)}
                  </span>
                </div>

                <Link to={`/hotels/${hotel.slug}`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View Details
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
