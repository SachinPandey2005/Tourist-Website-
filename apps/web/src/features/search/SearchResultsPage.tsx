import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Clock,
  Building,
  Compass,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { searchApi } from '../../lib/api/search.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency } from '../../lib/utils.js';

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const activeTab = searchParams.get('tab') || 'all';

  const [localQuery, setLocalQuery] = useState(q);

  const { data, isLoading, error, refetch } = useApi(
    () => searchApi.universalSearch({ q }),
    { immediate: true }
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = new URLSearchParams(searchParams);
    if (localQuery) {
      updated.set('q', localQuery);
    } else {
      updated.delete('q');
    }
    setSearchParams(updated);
  };

  const setTab = (tab: string) => {
    const updated = new URLSearchParams(searchParams);
    if (tab === 'all') {
      updated.delete('tab');
    } else {
      updated.set('tab', tab);
    }
    setSearchParams(updated);
  };

  const destinations = data?.destinations ?? [];
  const tours = data?.tours ?? [];
  const hotels = data?.hotels ?? [];
  const activities = data?.activities ?? [];
  const totalMatches = data?.totalMatches ?? (destinations.length + tours.length + hotels.length + activities.length);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header & Search Bar */}
      <div className="space-y-4">
        <Badge variant="brand">UNIVERSAL CATALOG SEARCH</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
          {q ? `Search Results for "${q}"` : 'Explore All Travel Products'}
        </h1>
        <p className="text-sm text-slate-400">
          Find matching destinations, guided expeditions, boutique hotels, and local activities.
        </p>

        <form onSubmit={handleSearchSubmit} className="max-w-xl flex gap-3 pt-2">
          <Input
            placeholder="Search destination, country, tour, or hotel..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>
      </div>

      {/* Category Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'all', label: 'All Results', count: totalMatches },
          { id: 'destinations', label: 'Destinations', count: destinations.length },
          { id: 'tours', label: 'Tours', count: tours.length },
          { id: 'hotels', label: 'Hotels', count: hotels.length },
          { id: 'activities', label: 'Activities', count: activities.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState
          title="Search Request Failed"
          message={error.message}
          onRetry={refetch}
        />
      ) : totalMatches === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="No Matching Travel Products Found"
          description={`We couldn't find any results matching "${q}". Try checking your spelling or searching for broader terms like "Japan", "Mountain", or "Safari".`}
          actionLabel="Clear Search"
          onAction={() => {
            setLocalQuery('');
            setSearchParams(new URLSearchParams());
          }}
        />
      ) : (
        <div className="space-y-12">
          {/* 1. Destinations Section */}
          {(activeTab === 'all' || activeTab === 'destinations') && destinations.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-teal-400" />
                  Matching Destinations ({destinations.length})
                </h2>
                <Link to="/destinations">
                  <Button variant="ghost" size="sm">Explore All</Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {destinations.map((dest) => (
                  <Card key={dest.id} className="overflow-hidden group flex flex-col justify-between">
                    <div>
                      <div className="h-44 relative overflow-hidden">
                        <img
                          src={dest.imageUrl}
                          alt={dest.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="brand">{dest.category}</Badge>
                        </div>
                      </div>
                      <CardContent className="pt-4 space-y-2">
                        <h3 className="font-bold text-slate-100 text-base group-hover:text-teal-300 transition-colors line-clamp-1">
                          {dest.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {dest.shortDescription || dest.description}
                        </p>
                      </CardContent>
                    </div>

                    <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{dest.country}</span>
                      <Link to={`/destinations/${dest.slug}`}>
                        <Button variant="outline" size="sm">
                          Explore
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 2. Tours Section */}
          {(activeTab === 'all' || activeTab === 'tours') && tours.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-teal-400" />
                  Matching Tour Packages ({tours.length})
                </h2>
                <Link to="/tours">
                  <Button variant="ghost" size="sm">View All Tours</Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tours.map((tour) => (
                  <Card key={tour.id} className="overflow-hidden group flex flex-col justify-between">
                    <div>
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
                      <CardContent className="pt-4 space-y-2">
                        <h3 className="font-bold text-slate-100 text-base group-hover:text-teal-300 transition-colors line-clamp-1">
                          {tour.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-400">Starting From</span>
                          <span className="font-extrabold text-teal-300 text-sm">
                            {formatCurrency(tour.discountPrice || tour.basePrice)}
                          </span>
                        </div>
                      </CardContent>
                    </div>

                    <div className="p-4 pt-2 border-t border-slate-800/80">
                      <Link to={`/tours/${tour.slug}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Tour Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 3. Hotels Section */}
          {(activeTab === 'all' || activeTab === 'hotels') && hotels.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber-400" />
                  Matching Accommodations ({hotels.length})
                </h2>
                <Link to="/hotels">
                  <Button variant="ghost" size="sm">View All Hotels</Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel) => (
                  <Card key={hotel.id} className="overflow-hidden group flex flex-col justify-between">
                    <div>
                      <div className="h-44 relative overflow-hidden">
                        <img
                          src={hotel.imageUrl}
                          alt={hotel.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="warning">{hotel.starRating} Stars</Badge>
                        </div>
                      </div>
                      <CardContent className="pt-4 space-y-2">
                        <h3 className="font-bold text-slate-100 text-base group-hover:text-amber-300 transition-colors line-clamp-1">
                          {hotel.name}
                        </h3>
                        <p className="text-xs text-slate-400 truncate">{hotel.address}</p>
                      </CardContent>
                    </div>

                    <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {formatCurrency(hotel.pricePerNight)}
                      </span>
                      <Link to={`/hotels/${hotel.slug}`}>
                        <Button variant="outline" size="sm">
                          View Hotel
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 4. Activities Section */}
          {(activeTab === 'all' || activeTab === 'activities') && activities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-400" />
                  Matching Local Activities ({activities.length})
                </h2>
                <Link to="/activities">
                  <Button variant="ghost" size="sm">View All Activities</Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map((act) => (
                  <Card key={act.id} className="overflow-hidden group flex flex-col justify-between">
                    <div>
                      <div className="h-44 relative overflow-hidden">
                        <img
                          src={act.imageUrl}
                          alt={act.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="brand">{act.durationHours} Hours</Badge>
                        </div>
                      </div>
                      <CardContent className="pt-4 space-y-2">
                        <h3 className="font-bold text-slate-100 text-base group-hover:text-teal-300 transition-colors line-clamp-1">
                          {act.name}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2">{act.description}</p>
                      </CardContent>
                    </div>

                    <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="font-bold text-teal-300 text-sm">
                        {formatCurrency(act.price)}
                      </span>
                      <Link to="/activities">
                        <Button variant="outline" size="sm">
                          Reserve
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
