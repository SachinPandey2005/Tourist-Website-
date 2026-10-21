import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout.js';
import { AuthLayout } from '../layouts/AuthLayout.js';
import { DashboardLayout } from '../layouts/DashboardLayout.js';

import { HomePage } from '../features/home/HomePage.js';
import { DestinationsPage } from '../features/destinations/DestinationsPage.js';
import { ToursPage } from '../features/tours/ToursPage.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { RegisterPage } from '../features/auth/RegisterPage.js';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage.js';
import { DashboardPage } from '../features/dashboard/DashboardPage.js';
import { NotFoundPage } from '../features/common/NotFoundPage.js';

export function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Discovery Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/destinations/:idOrSlug" element={<DestinationsPage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/tours/:idOrSlug" element={<ToursPage />} />
        <Route path="/hotels" element={<DestinationsPage />} />
        <Route path="/activities" element={<DestinationsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 2. Authentication Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* 3. Traveler & Admin Portal Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/bookings" element={<DashboardPage />} />
        <Route path="/dashboard/favorites" element={<DashboardPage />} />
        <Route path="/dashboard/profile" element={<DashboardPage />} />
        <Route path="/admin" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
