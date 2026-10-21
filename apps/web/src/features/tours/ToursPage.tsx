import { Link } from 'react-router-dom';
import { Clock, Users, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card, CardContent } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { tourApi } from '../../lib/api/tours.js';
import { useApi } from '../../hooks/useApi.js';
import { formatCurrency } from '../../lib/utils.js';

export function ToursPage() {
  const { data, isLoading, error, refetch } = useApi(() => tourApi.list({ pageSize: 6 }));

  const fallbackTours = [
    {
      id: 'tour-1',
      title: 'Kyoto Zen Temples & Sacred Shrines Expedition',
      slug: 'kyoto-zen-and-temple-trail',
      durationDays: 7,
      basePrice: '1850.00',
      discountPrice: '1699.00',
      difficulty: 'EASY',
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
      difficulty: 'CHALLENGING',
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
      basePrice: '1290.00',
      discountPrice: '1150.00',
      difficulty: 'EASY',
      maxGroupSize: 10,
      rating: 4.89,
      reviewCount: 52,
      featuredImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      description: 'Private catamaran sailing across volcanic springs, vineyard wine tastings, and cliffside dining.',
    },
  ];

  const tours = data?.items && data.items.length > 0 ? data.items : fallbackTours;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <Badge variant="brand">EXPEDITIONS & PACKAGES</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100">
          Guided Tour Packages
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Complete packages with licensed guides, boutique lodges, gear, and guaranteed small group sizes.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!isLoading && error && (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.map((tour) => (
            <Card key={tour.id} hoverable className="flex flex-col group">
              <div className="relative h-56 overflow-hidden rounded-t-2xl">
                <img
                  src={tour.featuredImage}
                  alt={tour.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant={tour.difficulty === 'EASY' ? 'success' : tour.difficulty === 'MODERATE' ? 'brand' : 'warning'}>
                    {tour.difficulty}
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs font-semibold text-white drop-shadow">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-teal-400" />
                    <span>{tour.durationDays} Days</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Max {tour.maxGroupSize}</span>
                  </div>
                </div>
              </div>

              <CardContent className="flex-1 flex flex-col justify-between pt-5 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-300 transition-colors line-clamp-2">
                    {tour.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {tour.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">From</span>
                    <span className="text-base font-extrabold text-teal-300">
                      {formatCurrency(tour.discountPrice || tour.basePrice)}
                    </span>
                  </div>

                  <Link to={`/tours/${tour.slug}`}>
                    <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Tour
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
