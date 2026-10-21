import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext.js';
import { ProtectedRoute } from '../../../components/common/ProtectedRoute.js';
import { AdminRoute } from '../../../components/common/AdminRoute.js';
import { DashboardOverviewPage } from '../DashboardOverviewPage.js';
import { MyBookingsPage } from '../MyBookingsPage.js';
import { FavoritesPage } from '../FavoritesPage.js';
import { AdminOverviewPage } from '../../admin/AdminOverviewPage.js';
import { authApi } from '../../../lib/api/auth.js';
import { bookingsApi } from '../../../lib/api/bookings.js';
import { favoritesApi } from '../../../lib/api/favorites.js';
import { adminApi } from '../../../lib/api/admin.js';
import { UserRole } from '@tourist/shared';

describe('Phase 8 Frontend: Route Protection & Dashboard Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  const mockTouristUser = {
    id: 'user-1',
    name: 'Jane Traveler',
    email: 'jane@example.com',
    role: 'TOURIST' as UserRole,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockAdminUser = {
    id: 'admin-1',
    name: 'Admin Chief',
    email: 'admin@voyagevista.com',
    role: 'ADMIN' as UserRole,
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('redirects unauthenticated visitor to /login when accessing protected dashboard', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue(new Error('Unauthorized'));

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div>LOGIN_PAGE_RENDERED</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<div>DASHBOARD_RENDERED</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('LOGIN_PAGE_RENDERED')).toBeInTheDocument();
  });

  it('renders 403 Forbidden Access Denied for authenticated non-admin accessing /admin', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockTouristUser);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<div>TRAVELER_DASHBOARD</div>} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<div>ADMIN_CONSOLE_RENDERED</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Access Denied \(403 Forbidden\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Traveler profile without system administration clearance/i)).toBeInTheDocument();
  });

  it('grants access to admin route for user with ADMIN role', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockAdminUser);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AuthProvider>
            <Routes>
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<div>ADMIN_CONSOLE_RENDERED</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText('ADMIN_CONSOLE_RENDERED')).toBeInTheDocument();
  });

  it('renders DashboardOverviewPage with customer metrics and greeting', async () => {
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue(mockTouristUser);
    vi.spyOn(bookingsApi, 'getMyBookings').mockResolvedValue({
      items: [
        {
          id: 'b1',
          bookingReference: 'VV-2026-001',
          userId: 'user-1',
          status: 'CONFIRMED',
          subtotal: '1200.00',
          discountAmount: '0.00',
          taxAmount: '120.00',
          totalAmount: '1320.00',
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: [
            {
              id: 'item-1',
              itemTitle: 'Kyoto Zen Temples',
              unitPrice: '1200.00',
              quantity: 1,
              totalPrice: '1200.00',
              startDate: '2026-11-01T00:00:00Z',
              tourPackage: {
                id: 't1',
                title: 'Kyoto Zen Temples',
                slug: 'kyoto-zen-temples',
                featuredImage: 'https://example.com/kyoto.jpg',
              },
            },
          ],
          payments: [{ id: 'p1', paymentReference: 'PAY-1', amount: '1320.00', currency: 'USD', status: 'SUCCEEDED', method: 'CARD', createdAt: new Date().toISOString() }],
        },
      ],
      pagination: { page: 1, pageSize: 6, totalItems: 1, totalPages: 1 },
    });
    vi.spyOn(favoritesApi, 'getMyFavorites').mockResolvedValue([]);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <DashboardOverviewPage />
          </AuthProvider>
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Welcome back, Jane Traveler/i)).toBeInTheDocument();
    expect(screen.getByText('VV-2026-001')).toBeInTheDocument();
    expect(screen.getByText('Kyoto Zen Temples')).toBeInTheDocument();
  });

  it('renders MyBookingsPage with booking cards and cancellation eligibility', async () => {
    vi.spyOn(bookingsApi, 'getMyBookings').mockResolvedValue({
      items: [
        {
          id: 'b1',
          bookingReference: 'VV-2026-CONFIRMED',
          userId: 'user-1',
          status: 'CONFIRMED',
          subtotal: '800.00',
          discountAmount: '0.00',
          taxAmount: '80.00',
          totalAmount: '880.00',
          currency: 'USD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: [
            {
              id: 'item-1',
              itemTitle: 'Alpine Ski Expedition',
              unitPrice: '800.00',
              quantity: 1,
              totalPrice: '800.00',
            },
          ],
          payments: [{ id: 'p1', paymentReference: 'PAY-ALPINE', amount: '880.00', currency: 'USD', status: 'SUCCEEDED', method: 'STRIPE', createdAt: new Date().toISOString() }],
        },
      ],
      pagination: { page: 1, pageSize: 6, totalItems: 1, totalPages: 1 },
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard/bookings']}>
          <MyBookingsPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('VV-2026-CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText('Alpine Ski Expedition')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
  });

  it('renders FavoritesPage with saved destination cards', async () => {
    vi.spyOn(favoritesApi, 'getMyFavorites').mockResolvedValue([
      {
        id: 'fav-1',
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        destination: {
          id: 'd1',
          title: 'Santorini Sunset Caldera',
          slug: 'santorini-sunset-caldera',
          imageUrl: 'https://example.com/santorini.jpg',
          category: 'BEACH',
          location: 'Cyclades, Greece',
          rating: 4.95,
        },
        tourPackage: null,
      },
    ]);

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard/favorites']}>
          <FavoritesPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('Santorini Sunset Caldera')).toBeInTheDocument();
    expect(screen.getByText('Cyclades, Greece')).toBeInTheDocument();
    expect(screen.getByText('4.95')).toBeInTheDocument();
  });

  it('renders AdminOverviewPage with platform live statistics', async () => {
    vi.spyOn(adminApi, 'getOverviewStats').mockResolvedValue({
      totalUsers: 1420,
      totalBookings: 890,
      confirmedBookings: 810,
      cancelledBookings: 80,
      activeTours: 32,
      totalDestinations: 18,
      totalReviews: 450,
      totalHotels: 65,
      grossRevenue: '482500.00',
      currency: 'USD',
      recentBookings: [
        {
          id: 'b-rec-1',
          bookingReference: 'VV-REC-01',
          userName: 'Alex Smith',
          userEmail: 'alex@example.com',
          totalAmount: '2400.00',
          status: 'CONFIRMED',
          paymentStatus: 'SUCCEEDED',
          createdAt: new Date().toISOString(),
        },
      ],
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminOverviewPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText('$482500.00')).toBeInTheDocument();
    expect(screen.getByText('1420')).toBeInTheDocument();
    expect(screen.getByText('VV-REC-01')).toBeInTheDocument();
    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
  });
});
