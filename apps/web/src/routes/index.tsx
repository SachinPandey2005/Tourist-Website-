import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout.js';
import { AuthLayout } from '../layouts/AuthLayout.js';
import { DashboardLayout } from '../layouts/DashboardLayout.js';

// Route Guards
import { ProtectedRoute } from '../components/common/ProtectedRoute.js';
import { AdminRoute } from '../components/common/AdminRoute.js';

// Public Feature Pages
import { HomePage } from '../features/home/HomePage.js';
import { DestinationsPage } from '../features/destinations/DestinationsPage.js';
import { DestinationDetailPage } from '../features/destinations/DestinationDetailPage.js';
import { ToursPage } from '../features/tours/ToursPage.js';
import { TourDetailPage } from '../features/tours/TourDetailPage.js';
import { HotelsPage } from '../features/hotels/HotelsPage.js';
import { HotelDetailPage } from '../features/hotels/HotelDetailPage.js';
import { ActivitiesPage } from '../features/activities/ActivitiesPage.js';
import { SearchResultsPage } from '../features/search/SearchResultsPage.js';
import { AboutPage } from '../features/about/AboutPage.js';
import { ContactPage } from '../features/contact/ContactPage.js';
import { FaqPage } from '../features/faq/FaqPage.js';
import { BookingConfirmationPage } from '../features/booking/BookingConfirmationPage.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { RegisterPage } from '../features/auth/RegisterPage.js';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage.js';
import { NotFoundPage } from '../features/common/NotFoundPage.js';

// User Dashboard Pages
import { DashboardOverviewPage } from '../features/dashboard/DashboardOverviewPage.js';
import { MyBookingsPage } from '../features/dashboard/MyBookingsPage.js';
import { FavoritesPage } from '../features/dashboard/FavoritesPage.js';
import { ProfileSettingsPage } from '../features/dashboard/ProfileSettingsPage.js';

// Admin Dashboard Pages
import { AdminOverviewPage } from '../features/admin/AdminOverviewPage.js';
import { AdminBookingsPage } from '../features/admin/AdminBookingsPage.js';
import { AdminUsersPage } from '../features/admin/AdminUsersPage.js';
import { AdminPaymentsPage } from '../features/admin/AdminPaymentsPage.js';
import { AdminInventoryPage } from '../features/admin/AdminInventoryPage.js';
import { AdminCouponsPage } from '../features/admin/AdminCouponsPage.js';
import { AdminReviewsPage } from '../features/admin/AdminReviewsPage.js';

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Travel Discovery Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/destinations/:idOrSlug" element={<DestinationDetailPage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/tours/:idOrSlug" element={<TourDetailPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/hotels/:idOrSlug" element={<HotelDetailPage />} />
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/booking/confirmation" element={<BookingConfirmationPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 2. Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* 3. Protected Traveler Portal Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardOverviewPage />} />
          <Route path="/dashboard/bookings" element={<MyBookingsPage />} />
          <Route path="/dashboard/favorites" element={<FavoritesPage />} />
          <Route path="/dashboard/profile" element={<ProfileSettingsPage />} />
        </Route>
      </Route>

      {/* 4. Protected Admin Console Routes */}
      <Route element={<AdminRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/bookings" element={<AdminBookingsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/payments" element={<AdminPaymentsPage />} />
          <Route path="/admin/inventory" element={<AdminInventoryPage />} />
          <Route path="/admin/coupons" element={<AdminCouponsPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
