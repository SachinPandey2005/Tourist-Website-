import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import {
  UserRole,
  BookingStatus,
  PaymentStatus,
  DiscountType,
  ScheduleStatus,
  Prisma,
} from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { generateToken } from '../src/utils/jwt.js';

describe('Phase 8: User & Admin Dashboards & Authorization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const adminUser = {
    id: '10000000-0000-4000-a000-000000000001',
    email: 'admin@voyagevista.com',
    name: 'Admin Executive',
    role: UserRole.ADMIN,
    tokenVersion: 0,
    passwordHash: 'hashed_password',
    phoneNumber: '+15550001',
    avatarUrl: null,
    isEmailVerified: true,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const userA = {
    id: '20000000-0000-4000-a000-000000000002',
    email: 'user.a@voyagevista.com',
    name: 'Alice Traveler',
    role: UserRole.TOURIST,
    tokenVersion: 0,
    passwordHash: 'hashed_password',
    phoneNumber: '+15550002',
    avatarUrl: null,
    isEmailVerified: true,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const userB = {
    id: '30000000-0000-4000-a000-000000000003',
    email: 'user.b@voyagevista.com',
    name: 'Bob Explorer',
    role: UserRole.TOURIST,
    tokenVersion: 0,
    passwordHash: 'hashed_password',
    phoneNumber: '+15550003',
    avatarUrl: null,
    isEmailVerified: true,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const adminToken = generateToken({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    tokenVersion: 0,
  });

  const userAToken = generateToken({
    sub: userA.id,
    email: userA.email,
    role: userA.role,
    tokenVersion: 0,
  });

  const userBToken = generateToken({
    sub: userB.id,
    email: userB.email,
    role: userB.role,
    tokenVersion: 0,
  });

  const mockBookingA = {
    id: '40000000-0000-4000-a000-000000000004',
    bookingReference: 'VV-BK-2026-0001',
    userId: userA.id,
    status: BookingStatus.CONFIRMED,
    subtotal: new Prisma.Decimal('1200.00'),
    discountAmount: new Prisma.Decimal('0.00'),
    taxAmount: new Prisma.Decimal('120.00'),
    totalAmount: new Prisma.Decimal('1320.00'),
    currency: 'USD',
    specialRequests: 'Vegetarian meal requested',
    createdAt: new Date('2026-02-01T10:00:00Z'),
    updatedAt: new Date('2026-02-01T10:00:00Z'),
    user: userA,
    items: [],
    payments: [
      {
        id: '60000000-0000-4000-a000-000000000006',
        paymentReference: 'PAY-REF-001',
        amount: new Prisma.Decimal('1320.00'),
        currency: 'USD',
        status: PaymentStatus.SUCCEEDED,
        method: 'STRIPE_CARD',
        paidAt: new Date('2026-02-01T10:05:00Z'),
        createdAt: new Date('2026-02-01T10:00:00Z'),
      },
    ],
  };

  const mockFavoriteA = {
    id: '50000000-0000-4000-a000-000000000005',
    userId: userA.id,
    destinationId: '70000000-0000-4000-a000-000000000007',
    tourPackageId: null,
    createdAt: new Date('2026-02-01T10:00:00Z'),
    destination: {
      id: '70000000-0000-4000-a000-000000000007',
      title: 'Kyoto Cultural Heritage',
      slug: 'kyoto-cultural-heritage',
      imageUrl: 'https://images.unsplash.com/kyoto.jpg',
      category: 'CULTURAL',
      location: 'Japan',
      rating: 4.9,
    },
    tourPackage: null,
  };

  describe('1. Protected Routes & Authentication Enforcement', () => {
    it('returns 401 Unauthorized when accessing /api/bookings without a token', async () => {
      const res = await request(app).get('/api/bookings');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 Unauthorized when accessing /api/favorites without a token', async () => {
      const res = await request(app).get('/api/favorites');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 Unauthorized when accessing /api/admin/stats without a token', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Role-Based Access Control (RBAC)', () => {
    it('rejects TOURIST user accessing /api/admin/stats with 403 Forbidden', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userA as never);

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('rejects TOURIST user mutating booking status via /api/admin/bookings/:id/status with 403 Forbidden', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userA as never);

      const res = await request(app)
        .patch(`/api/admin/bookings/${mockBookingA.id}/status`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ status: BookingStatus.COMPLETED });

      expect(res.status).toBe(403);
    });

    it('allows ADMIN user to retrieve platform statistics with 200 OK', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(adminUser as never);
      vi.spyOn(prisma.user, 'count').mockResolvedValue(150);
      vi.spyOn(prisma.booking, 'count').mockResolvedValue(85);
      vi.spyOn(prisma.tourPackage, 'count').mockResolvedValue(24);
      vi.spyOn(prisma.destination, 'count').mockResolvedValue(16);
      vi.spyOn(prisma.review, 'count').mockResolvedValue(310);
      vi.spyOn(prisma.hotel, 'count').mockResolvedValue(40);
      vi.spyOn(prisma.payment, 'aggregate').mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('124500.00') },
      } as never);
      vi.spyOn(prisma.booking, 'findMany').mockResolvedValue([mockBookingA] as never);

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUsers).toBe(150);
      expect(res.body.data.grossRevenue).toBe('124500.00');
    });
  });

  describe('3. Resource Ownership & Private Record Protection', () => {
    it('prevents User B from viewing User A’s private booking with 403 Forbidden', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userB as never);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(mockBookingA as never);

      const res = await request(app)
        .get(`/api/bookings/${mockBookingA.id}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('authorization to view this booking');
    });

    it('allows User A to view their own booking with 200 OK', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userA as never);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(mockBookingA as never);

      const res = await request(app)
        .get(`/api/bookings/${mockBookingA.id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingReference).toBe('VV-BK-2026-0001');
    });

    it('prevents User B from deleting User A’s saved favorite with 403 Forbidden', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userB as never);
      vi.spyOn(prisma.favorite, 'findUnique').mockResolvedValue(mockFavoriteA as never);

      const res = await request(app)
        .delete(`/api/favorites/${mockFavoriteA.id}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('cannot delete another user’s saved favorite');
    });

    it('allows User A to delete their own saved favorite with 200 OK', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userA as never);
      vi.spyOn(prisma.favorite, 'findUnique').mockResolvedValue(mockFavoriteA as never);
      vi.spyOn(prisma.favorite, 'delete').mockResolvedValue(mockFavoriteA as never);

      const res = await request(app)
        .delete(`/api/favorites/${mockFavoriteA.id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Booking Cancellation & Capacity Restoration', () => {
    it('allows booking owner to cancel eligible booking and restores schedule capacity', async () => {
      const scheduleMock = {
        id: '90000000-0000-4000-a000-000000000009',
        startDate: new Date('2026-09-01T09:00:00Z'),
        endDate: new Date('2026-09-06T18:00:00Z'),
        bookedCapacity: 5,
        totalCapacity: 10,
        status: ScheduleStatus.AVAILABLE,
      };

      const bookingWithSchedule = {
        ...mockBookingA,
        status: BookingStatus.CONFIRMED,
        items: [
          {
            id: 'item-1',
            tourScheduleId: scheduleMock.id,
            quantity: 2,
            tourSchedule: scheduleMock,
          },
        ],
      };

      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(userA as never);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(bookingWithSchedule as never);
      vi.spyOn(prisma.tourSchedule, 'findUnique').mockResolvedValue(scheduleMock as never);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        return callback(prisma);
      });
      vi.spyOn(prisma.tourSchedule, 'update').mockResolvedValue({} as never);
      vi.spyOn(prisma.payment, 'updateMany').mockResolvedValue({ count: 1 } as never);
      vi.spyOn(prisma.booking, 'update').mockResolvedValue({
        ...bookingWithSchedule,
        status: BookingStatus.CANCELLED,
      } as never);

      const res = await request(app)
        .post(`/api/bookings/${mockBookingA.id}/cancel`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ reason: 'Schedule conflict' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(BookingStatus.CANCELLED);
    });
  });

  describe('5. Admin Management Actions', () => {
    it('allows ADMIN to update a user role', async () => {
      vi.spyOn(prisma.user, 'findUnique')
        .mockResolvedValueOnce(adminUser as never)
        .mockResolvedValueOnce(userA as never);
      vi.spyOn(prisma.user, 'update').mockResolvedValue({
        ...userA,
        role: UserRole.ADMIN,
      } as never);

      const res = await request(app)
        .patch(`/api/admin/users/${userA.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.ADMIN });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe(UserRole.ADMIN);
    });

    it('allows ADMIN to issue a refund on payment', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(adminUser as never);
      vi.spyOn(prisma.payment, 'findUnique').mockResolvedValue({
        id: '60000000-0000-4000-a000-000000000006',
        paymentReference: 'PAY-REF-001',
        status: PaymentStatus.SUCCEEDED,
      } as never);
      vi.spyOn(prisma.payment, 'update').mockResolvedValue({
        id: '60000000-0000-4000-a000-000000000006',
        paymentReference: 'PAY-REF-001',
        status: PaymentStatus.REFUNDED,
      } as never);

      const res = await request(app)
        .post('/api/admin/payments/60000000-0000-4000-a000-000000000006/refund')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PaymentStatus.REFUNDED);
    });

    it('allows ADMIN to create promotional coupon', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(adminUser as never);
      vi.spyOn(prisma.coupon, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.coupon, 'create').mockResolvedValue({
        id: 'c1',
        code: 'SUMMER2026',
        discountType: DiscountType.PERCENTAGE,
        discountValue: new Prisma.Decimal('15.00'),
        isActive: true,
      } as never);

      const res = await request(app)
        .post('/api/admin/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'SUMMER2026',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 15,
          startDate: '2026-06-01T00:00:00.000Z',
          endDate: '2026-08-31T23:59:59.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('SUMMER2026');
    });
  });
});
