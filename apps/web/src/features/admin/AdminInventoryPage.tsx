import { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  MapPin,
  Compass,
  Building,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { Badge } from '../../components/ui/Badge.js';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog.js';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorState } from '../../components/ui/ErrorState.js';
import { destinationApi } from '../../lib/api/destinations.js';
import { tourApi } from '../../lib/api/tours.js';
import { hotelApi } from '../../lib/api/hotels.js';
import { activityApi } from '../../lib/api/activities.js';
import type {
  DestinationDto,
  TourPackageDto,
  HotelDto,
  ActivityDto,
} from '@tourist/shared';

type InventoryTab = 'DESTINATIONS' | 'TOURS' | 'HOTELS' | 'ACTIVITIES';

export function AdminInventoryPage() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('DESTINATIONS');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data lists
  const [destinations, setDestinations] = useState<DestinationDto[]>([]);
  const [tours, setTours] = useState<TourPackageDto[]>([]);
  const [hotels, setHotels] = useState<HotelDto[]>([]);
  const [activities, setActivities] = useState<ActivityDto[]>([]);

  // Deletion Dialog State
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    title: string;
    type: InventoryTab;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchTabContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      if (activeTab === 'DESTINATIONS') {
        const res = await destinationApi.list({ pageSize: 50 });
        setDestinations(res.items || []);
      } else if (activeTab === 'TOURS') {
        const res = await tourApi.list({ pageSize: 50 });
        setTours(res.items || []);
      } else if (activeTab === 'HOTELS') {
        const res = await hotelApi.list({ pageSize: 50 });
        setHotels(res.items || []);
      } else if (activeTab === 'ACTIVITIES') {
        const res = await activityApi.list({ pageSize: 50 });
        setActivities(res.items || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve catalog items.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTabContent();
  }, [fetchTabContent]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      if (itemToDelete.type === 'DESTINATIONS') {
        await destinationApi.delete(itemToDelete.id);
      } else if (itemToDelete.type === 'TOURS') {
        await tourApi.delete(itemToDelete.id);
      } else if (itemToDelete.type === 'HOTELS') {
        await hotelApi.delete(itemToDelete.id);
      } else if (itemToDelete.type === 'ACTIVITIES') {
        await activityApi.delete(itemToDelete.id);
      }
      setItemToDelete(null);
      await fetchTabContent();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Deletion failed.';
      alert(`Deletion error: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="warning" className="mb-2">
            CATALOG OPERATIONS
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Catalog & Inventory Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Maintain destinations, tour schedules, hotels, and activities with backend authorization.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'DESTINATIONS', label: 'Destinations', icon: MapPin },
            { id: 'TOURS', label: 'Tour Packages & Schedules', icon: Compass },
            { id: 'HOTELS', label: 'Accommodations', icon: Building },
            { id: 'ACTIVITIES', label: 'Activities & Experiences', icon: Layers },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InventoryTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
          <LoadingSkeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : errorMessage ? (
        <ErrorState
          title="Could not load inventory"
          message={errorMessage}
          onRetry={fetchTabContent}
        />
      ) : activeTab === 'DESTINATIONS' ? (
        destinations.length === 0 ? (
          <EmptyState title="No destinations registered" description="No destination records found." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Country & Region</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Reviews</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {destinations.map((dest) => (
                    <tr key={dest.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-3">
                        <img
                          src={dest.imageUrl}
                          alt={dest.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <span>{dest.title}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="brand">{dest.category}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {dest.city ? `${dest.city}, ` : ''}
                        {dest.country}
                      </td>
                      <td className="py-3 px-4 text-amber-400 font-semibold">{dest.rating} ★</td>
                      <td className="py-3 px-4 text-slate-400">{dest.reviewCount}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/destinations/${dest.slug || dest.id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              setItemToDelete({
                                id: dest.id,
                                title: dest.title,
                                type: 'DESTINATIONS',
                              })
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : activeTab === 'TOURS' ? (
        tours.length === 0 ? (
          <EmptyState title="No tour packages found" description="No tour catalog entries found." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Tour Package</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Base Price</th>
                    <th className="py-3 px-4">Schedules</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-3">
                        <img
                          src={tour.featuredImage}
                          alt={tour.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <div>
                          <p>{tour.title}</p>
                          <p className="text-[11px] text-slate-500 font-normal">
                            Max Group: {tour.maxGroupSize}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {tour.durationDays} Days / {tour.durationNights} Nights
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="neutral">{tour.difficulty}</Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-teal-300">${tour.basePrice}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="font-semibold">{tour.schedules?.length || 0}</span> active
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/tours/${tour.slug || tour.id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              setItemToDelete({
                                id: tour.id,
                                title: tour.title,
                                type: 'TOURS',
                              })
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : activeTab === 'HOTELS' ? (
        hotels.length === 0 ? (
          <EmptyState title="No hotels registered" description="No accommodation entries found." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Hotel Name</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Star Rating</th>
                    <th className="py-3 px-4">Price / Night</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {hotels.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-3">
                        <img
                          src={h.imageUrl}
                          alt={h.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <span>{h.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{h.address}</td>
                      <td className="py-3 px-4 text-amber-400 font-semibold">{h.starRating} ★</td>
                      <td className="py-3 px-4 font-bold text-teal-300">${h.pricePerNight}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setItemToDelete({
                              id: h.id,
                              title: h.name,
                              type: 'HOTELS',
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        activities.length === 0 ? (
          <EmptyState title="No activities found" description="No activity entries found." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/60 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Activity Name</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-3">
                        <img
                          src={act.imageUrl}
                          alt={act.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                        <span>{act.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{act.durationHours} Hours</td>
                      <td className="py-3 px-4 font-bold text-teal-300">${act.price}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setItemToDelete({
                              id: act.id,
                              title: act.name,
                              type: 'ACTIVITIES',
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      )}

      {/* Deletion Confirmation Dialog */}
      {itemToDelete && (
        <ConfirmationDialog
          isOpen={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Confirm Catalog Deletion"
          description={`Are you sure you want to permanently delete "${itemToDelete.title}" from ${itemToDelete.type.toLowerCase()}? This action cannot be undone.`}
          confirmText="Permanently Delete"
          isConfirming={isDeleting}
          variant="danger"
        />
      )}
    </div>
  );
}
