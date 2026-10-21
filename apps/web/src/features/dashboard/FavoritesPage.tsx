import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Trash2, ArrowRight, Compass } from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { favoritesApi } from '../../lib/api/favorites.js';
import type { FavoriteDto } from '@tourist/shared';

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deletion confirmation state
  const [favoriteToDelete, setFavoriteToDelete] = useState<FavoriteDto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchFavorites = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await favoritesApi.getMyFavorites();
      setFavorites(data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load saved favorites.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleConfirmDelete = async () => {
    if (!favoriteToDelete) return;
    try {
      setIsDeleting(true);
      await favoritesApi.removeFavorite(favoriteToDelete.id);
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteToDelete.id));
      setFavoriteToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove favorite.';
      alert(`Error removing favorite: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="brand" className="mb-2">
            WISHLIST & SAVED PLACES
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Saved Expeditions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Keep track of destinations and travel packages you intend to reserve in the future.
          </p>
        </div>

        <Link to="/destinations">
          <Button variant="outline" size="sm" rightIcon={<Compass className="w-4 h-4" />}>
            Explore More Places
          </Button>
        </Link>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-72 w-full rounded-2xl" />
          <LoadingSkeleton className="h-72 w-full rounded-2xl" />
          <LoadingSkeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Could not load wishlist"
          message={errorMessage}
          onRetry={fetchFavorites}
        />
      ) : favorites.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          description="Save destinations or tours while exploring to compare packages and book when you're ready."
          actionLabel="Browse Featured Destinations"
          onAction={() => (window.location.href = '/destinations')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const isTour = Boolean(fav.tourPackage);
            const title = fav.tourPackage?.title || fav.destination?.title || 'Saved Item';
            const imageUrl =
              fav.tourPackage?.featuredImage ||
              fav.destination?.imageUrl ||
              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
            const linkHref = isTour
              ? `/tours/${fav.tourPackage?.slug || fav.tourPackage?.id}`
              : `/destinations/${fav.destination?.slug || fav.destination?.id}`;

            return (
              <Card
                key={fav.id}
                className="overflow-hidden flex flex-col justify-between group hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="h-44 relative overflow-hidden bg-slate-900">
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge variant={isTour ? 'brand' : 'neutral'}>
                        {isTour ? 'TOUR EXPEDITION' : 'DESTINATION'}
                      </Badge>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFavoriteToDelete(fav)}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-slate-950/70 backdrop-blur-md text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      {fav.destination?.location && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="truncate">{fav.destination.location}</span>
                        </div>
                      )}
                      {fav.destination?.rating && (
                        <div className="flex items-center gap-1 text-amber-400 shrink-0 ml-auto">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{fav.destination.rating}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-100 text-base leading-snug line-clamp-2">
                      {title}
                    </h3>

                    {fav.tourPackage && (
                      <div className="pt-2 flex items-baseline justify-between text-xs">
                        <span className="text-slate-400">Starting from</span>
                        <span className="text-teal-400 font-extrabold text-sm">
                          ${fav.tourPackage.discountPrice || fav.tourPackage.basePrice}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action */}
                <div className="p-4 pt-0">
                  <Link to={linkHref}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      View Expedition
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      {favoriteToDelete && (
        <ConfirmationDialog
          isOpen={Boolean(favoriteToDelete)}
          onClose={() => setFavoriteToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Remove from Saved Wishlist"
          description={`Are you sure you want to remove "${
            favoriteToDelete.tourPackage?.title || favoriteToDelete.destination?.title
          }" from your wishlist?`}
          confirmText="Yes, Remove"
          isConfirming={isDeleting}
          variant="danger"
        />
      )}
    </div>
  );
}
