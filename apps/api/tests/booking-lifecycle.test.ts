import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import {
  UserRole,
  BookingStatus,
  PaymentStatus,
  ScheduleStatus,
  DiscountType,
  Prisma,
} from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { generateToken } from '../src/utils/jwt.js';
import { NotificationService } from '../src/services/notification.service.js';

describe('Phase 9: End-to-End Booking & Availability Functionality', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const travelerAlice = {
    id: 'a0000000-0000-4000-a000-000000000001',
    email: 'alice.traveler@voyagevista.com',
    name: 'Alice Traveler',
    role: UserRole.TOURIST,
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

  const travelerBob = {
    id: 'b0000000-0000-4000-a000-000000000002',
    email: 'bob.explorer@voyagevista.com',
    name: 'Bob Explorer',
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

  const aliceToken = generateToken({
    sub: travelerAlice.id,
    email: travelerAlice.email,
    role: travelerAlice.role,
    tokenVersion: 0,
  });

  const bobToken = generateToken({
    sub: travelerBob.id,
    email: travelerBob.email,
    role: travelerBob.role,
    tokenVersion: 0,
  });

  const mockTourPackage = {
    id: 'c0000000-0000-4000-a000-000000000003',
    destinationId: 'd0000000-0000-4000-a000-000000000004',
    title: 'Everest Scenic Alpine Circuit',
    slug: 'everest-scenic-alpine-circuit',
    description: 'Breathtaking 12-day high altitude expedition.',
    highlights: ['Sherpa culture', 'Everest Base Camp view'],
    basePrice: new Prisma.Decimal('1500.00'),
    discountPrice: new Prisma.Decimal('1200.00'),
    durationDays: 12,
    durationNights: 11,
    difficulty: 'CHALLENGING',
    maxGroupSize: 12,
    featuredImage: 'https://images.unsplash.com/everest.jpg',
    galleryImages: [],
    rating: 4.95,
    reviewCount: 42,
    isPublished: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const futureStartDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days in future
  const futureEndDate = new Date(Date.now() + 42 * 24 * 60 * 60 * 1000);

  const mockTourSchedule = {
    id: 'e0000000-0000-4000-a000-000000000005',
    tourPackageId: mockTourPackage.id,
    startDate: futureStartDate,
    endDate: futureEndDate,
    price: new Prisma.Decimal('1200.00'),
    totalCapacity: 10,
    bookedCapacity: 4, // 6 remaining
    status: ScheduleStatus.AVAILABLE,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    tourPackage: mockTourPackage,
  };

  const mockHotel = {
    id: 'f0000000-0000-4000-a000-000000000006',
    destinationId: 'd0000000-0000-4000-a000-000000000004',
    name: 'Himalayan Panorama Grand Lodge',
    slug: 'himalayan-panorama-grand-lodge',
    description: 'Luxury panoramic lodge facing Ama Dablam.',
    address: 'Namche Bazaar Alpine Ridge, Nepal',
    starRating: 5,
    pricePerNight: new Prisma.Decimal('250.00'),
    amenities: ['Heated Suites', 'Spa', 'Oxygen Concierge'],
    imageUrl: 'https://images.unsplash.com/lodge.jpg',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockCoupon = {
    id: '00000000-0000-4000-a000-000000000007',
    code: 'ADVENTURE20',
    description: '20% off high altitude expeditions up to $300',
    discountType: DiscountType.PERCENTAGE,
    discountValue: new Prisma.Decimal('20.00'),
    minBookingAmount: new Prisma.Decimal('500.00'),
    maxDiscountAmount: new Prisma.Decimal('300.00'),
    maxUses: 100,
    usedCount: 5,
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: new Date('2027-12-31T23:59:59Z'),
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  describe('1. Availability Checking & Inventory Validation', () => {
    it('POST /api/bookings/check-availability should return available status with remaining spots', async () => {
      vi.spyOn(prisma.tourSchedule, 'findUnique').mockResolvedValue(mockTourSchedule as any);

      const res = await request(app)
        .post('/api/bookings/check-availability')
        .send({
          items: [
            {
              tourScheduleId: mockTourSchedule.id,
              quantity: 2,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isAvailable).toBe(true);
      expect(res.body.data.items[0]).toMatchObject({
        isAvailable: true,
        availableCapacity: 6,
        requestedQuantity: 2,
        unitPrice: '1200.00',
      });
    });

    it('POST /api/bookings/check-availability should detect when requested seats exceed remaining capacity', async () => {
      vi.spyOn(prisma.tourSchedule, 'findUnique').mockResolvedValue(mockTourSchedule as any);

      const res = await request(app)
        .post('/api/bookings/check-availability')
        .send({
          items: [
            {
              tourScheduleId: mockTourSchedule.id,
              quantity: 8, // Only 6 remaining
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isAvailable).toBe(false);
      expect(res.body.data.items[0].isAvailable).toBe(false);
      expect(res.body.data.items[0].availableCapacity).toBe(6);
      expect(res.body.data.items[0].message).toContain('Insufficient capacity');
    });

    it('POST /api/bookings/check-availability should reject past departure schedules', async () => {
      const pastSchedule = {
        ...mockTourSchedule,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      };
      vi.spyOn(prisma.tourSchedule, 'findUnique').mockResolvedValue(pastSchedule as any);

      const res = await request(app)
        .post('/api/bookings/check-availability')
        .send({
          items: [
            {
              tourScheduleId: mockTourSchedule.id,
              quantity: 1,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isAvailable).toBe(false);
      expect(res.body.data.items[0].message).toContain('Departure date has passed');
    });
  });

  describe('2. Server-Authoritative Price Calculation & Quote', () => {
    it('POST /api/bookings/quote should calculate exact prices on server and ignore client unit prices', async () => {
      vi.spyOn(prisma.tourSchedule, 'findUnique').mockResolvedValue(mockTourSchedule as any);
      vi.spyOn(prisma.coupon, 'findFirst').mockResolvedValue(null);

      // Traveler tries to submit client unit price of $1.00
      const res = await request(app)
        .post('/api/bookings/quote')
        .send({
          items: [
            {
              tourScheduleId: mockTourSchedule.id,
              quantity: 2,
              unitPrice: 1.0, // Should be ignored completely
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Expected: 2 * 1200.00 = 2400.00 subtotal, tax 10% = 240.00, total = 2640.00
      expect(res.body.data.subtotal).toBe('2400.00');
      expect(res.body.data.taxAmount).toBe('240.00');
      expect(res.body.data.totalAmount).toBe('2640.00');
      expect(res.body.data.items[0].unitPrice).toBe('1200.00');
    });

    it('POST /api/bookings/quote should correctly apply capped percentage coupons on server', async () => {
      vi.spyOn(prisma.tourSchedule, 'findUnique').mockResolvedValue(mockTourSchedule as any);
      vi.spyOn(prisma.coupon, 'findFirst').mockResolvedValue(mockCoupon as any);

      const res = await request(app)
        .post('/api/bookings/quote')
        .send({
          items: [
            {
              tourScheduleId: mockTourSchedule.id,
              quantity: 2, // Subtotal = $2400.00
            },
          ],
          couponCode: 'ADVENTURE20',
        });

      expect(res.status).toBe(200);
      // 20% of 2400 is 480, but coupon maxDiscountAmount is 300.00
      expect(res.body.data.discountAmount).toBe('300.00');
      // Subtotal (2400) - discount (300) = 2100 taxable base. Tax (10%) = 210.00. Total = 2310.00
      expect(res.body.data.subtotal).toBe('2400.00');
      expect(res.body.data.taxAmount).toBe('210.00');
      expect(res.body.data.totalAmount).toBe('2310.00');
      expect(res.body.data.coupon).toMatchObject({
        code: 'ADVENTURE20',
        discountApplied: '300.00',
      });
    });

    it('POST /api/bookings/quote should calculate hotel stays based on nights and nightly rate', async () => {
      vi.spyOn(prisma.hotel, 'findUnique').mockResolvedValue(mockHotel as any);

      const checkIn = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      const checkOut = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(); // 3 nights

      const res = await request(app)
        .post('/api/bookings/quote')
        .send({
          items: [
            {
              hotelId: mockHotel.id,
              quantity: 2, // 2 rooms
              startDate: checkIn,
              endDate: checkOut,
            },
          ],
        });

      expect(res.status).toBe(200);
      // 3 nights * $250.00 * 2 rooms = $1500.00 subtotal. Tax 10% = $150.00. Total = $1650.00
      expect(res.body.data.subtotal).toBe('1500.00');
      expect(res.body.data.taxAmount).toBe('150.00');
      expect(res.body.data.totalAmount).toBe('1650.00');
      expect(res.body.data.items[0].nights).toBe(3);
    });
  });

  describe('3. Booking Creation & Concurrency / Inventory Controls', () => {
    it('POST /api/bookings should create a booking in PENDING status with a linked PENDING payment', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(null); // Idempotency check

      const createdBookingRecord = {
        id: '11111111-0000-4000-a000-000000000001',
        bookingReference: 'VV-2026-TEST01',
        userId: travelerAlice.id,
        couponId: null,
        idempotencyKey: 'idemp-key-001',
        status: BookingStatus.PENDING,
        subtotal: new Prisma.Decimal('1200.00'),
        discountAmount: new Prisma.Decimal('0.00'),
        taxAmount: new Prisma.Decimal('120.00'),
        totalAmount: new Prisma.Decimal('1320.00'),
        currency: 'USD',
        specialRequests: 'Window seat preferred',
        cancellationReason: null,
        cancelledAt: null,
        createdAt: new Date('2026-03-01T10:00:00Z'),
        updatedAt: new Date('2026-03-01T10:00:00Z'),
        user: travelerAlice,
        items: [
          {
            id: 'item-1',
            tourPackageId: mockTourPackage.id,
            tourScheduleId: mockTourSchedule.id,
            hotelId: null,
            activityId: null,
            itemTitle: mockTourPackage.title,
            unitPrice: new Prisma.Decimal('1200.00'),
            quantity: 1,
            totalPrice: new Prisma.Decimal('1200.00'),
            startDate: mockTourSchedule.startDate,
            endDate: mockTourSchedule.endDate,
            tourPackage: mockTourPackage,
            tourSchedule: mockTourSchedule,
            hotel: null,
            activity: null,
          },
        ],
        payments: [
          {
            id: 'pay-1',
            paymentReference: 'PAY-TEST01',
            amount: new Prisma.Decimal('1320.00'),
            currency: 'USD',
            status: PaymentStatus.PENDING,
            method: 'CREDIT_CARD',
            paidAt: null,
            createdAt: new Date('2026-03-01T10:00:00Z'),
          },
        ],
      };

      const txMock = {
        tourSchedule: {
          findUnique: vi.fn().mockResolvedValue(mockTourSchedule),
          update: vi.fn().mockResolvedValue({
            ...mockTourSchedule,
            bookedCapacity: 5,
          }),
        },
        booking: {
          create: vi.fn().mockResolvedValue(createdBookingRecord),
        },
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb(txMock);
      });

      const notifySpy = vi.spyOn(NotificationService, 'notifyBookingCreated');

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          items: [
            {
              tourScheduleId: mockTourSchedule.id,
              quantity: 1,
              unitPrice: 0.5, // Tampered client price must be ignored
            },
          ],
          idempotencyKey: 'idemp-key-001',
          specialRequests: 'Window seat preferred',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      // Status must be PENDING (Never mark as CONFIRMED or PAID automatically)
      expect(res.body.data.status).toBe(BookingStatus.PENDING);
      expect(res.body.data.payments[0].status).toBe(PaymentStatus.PENDING);
      expect(res.body.data.totalAmount).toBe('1320.00');

      // Verify schedule was locked in transaction
      expect(txMock.tourSchedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockTourSchedule.id },
          data: expect.objectContaining({
            bookedCapacity: 5,
          }),
        })
      );

      // Verify notification service was invoked
      expect(notifySpy).toHaveBeenCalled();
    });

    it('POST /api/bookings should reject booking when schedule capacity is exceeded (prevent overselling)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(null);

      const txMock = {
        tourSchedule: {
          findUnique: vi.fn().mockResolvedValue({
            ...mockTourSchedule,
            totalCapacity: 10,
            bookedCapacity: 9, // Only 1 spot remaining
          }),
        },
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb(txMock);
      });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          items: [
            {
              tourScheduleId: mockTourSchedule.id,
              quantity: 3, // Requesting 3 spots
            },
          ],
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('INSUFFICIENT_CAPACITY');
    });

    it('POST /api/bookings with existing idempotencyKey should return existing booking without duplicate charges', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);

      const existingBooking = {
        id: 'existing-bk-001',
        bookingReference: 'VV-EXISTING-01',
        userId: travelerAlice.id,
        idempotencyKey: 'retry-unique-key-123',
        status: BookingStatus.PENDING,
        subtotal: new Prisma.Decimal('1200.00'),
        discountAmount: new Prisma.Decimal('0.00'),
        taxAmount: new Prisma.Decimal('120.00'),
        totalAmount: new Prisma.Decimal('1320.00'),
        currency: 'USD',
        createdAt: new Date('2026-03-01T10:00:00Z'),
        updatedAt: new Date('2026-03-01T10:00:00Z'),
        items: [],
        payments: [],
      };

      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(existingBooking as any);
      const txSpy = vi.spyOn(prisma, '$transaction');

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${aliceToken}`)
        .set('Idempotency-Key', 'retry-unique-key-123')
        .send({
          items: [{ tourScheduleId: mockTourSchedule.id, quantity: 1 }],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBe('existing-bk-001');
      // Transaction was not rerun, preventing duplicate capacity reduction
      expect(txSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. Booking Retrieval & Authorization Checks', () => {
    it('GET /api/bookings should retrieve only the authenticated user bookings', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);
      vi.spyOn(prisma.booking, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.booking, 'count').mockResolvedValue(0);

      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${aliceToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: travelerAlice.id }),
        })
      );
    });

    it('GET /api/bookings/:id should deny access if another user attempts to view it (403 Forbidden)', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerBob as any);

      const aliceBooking = {
        id: '22222222-0000-4000-a000-000000000001',
        userId: travelerAlice.id, // Belongs to Alice
        bookingReference: 'VV-ALICE-01',
        status: BookingStatus.PENDING,
        subtotal: new Prisma.Decimal('1200.00'),
        totalAmount: new Prisma.Decimal('1320.00'),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        payments: [],
      };

      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(aliceBooking as any);

      // Bob tries to access Alice's booking
      const res = await request(app)
        .get(`/api/bookings/${aliceBooking.id}`)
        .set('Authorization', `Bearer ${bobToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('authorization');
    });
  });

  describe('5. Explicit Cancellation Rules & Capacity Restoration', () => {
    it('POST /api/bookings/:id/cancel should restore tour schedule capacity and mark booking CANCELLED', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);

      const cancellableBooking = {
        id: '33333333-0000-4000-a000-000000000001',
        bookingReference: 'VV-CAN-01',
        userId: travelerAlice.id,
        status: BookingStatus.PENDING,
        couponId: null,
        subtotal: new Prisma.Decimal('1200.00'),
        totalAmount: new Prisma.Decimal('1320.00'),
        createdAt: new Date('2026-03-01T10:00:00Z'),
        updatedAt: new Date('2026-03-01T10:00:00Z'),
        user: travelerAlice,
        items: [
          {
            id: 'item-1',
            tourScheduleId: mockTourSchedule.id,
            quantity: 2,
            unitPrice: new Prisma.Decimal('1200.00'),
            totalPrice: new Prisma.Decimal('2400.00'),
            startDate: mockTourSchedule.startDate, // Future departure
          },
        ],
        payments: [
          {
            id: 'pay-1',
            status: PaymentStatus.PENDING,
            amount: new Prisma.Decimal('1320.00'),
          },
        ],
      };

      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(cancellableBooking as any);

      const txMock = {
        tourSchedule: {
          findUnique: vi.fn().mockResolvedValue({
            ...mockTourSchedule,
            bookedCapacity: 6,
          }),
          update: vi.fn().mockResolvedValue({
            ...mockTourSchedule,
            bookedCapacity: 4, // 6 - 2 = 4
          }),
        },
        payment: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        booking: {
          update: vi.fn().mockResolvedValue({
            ...cancellableBooking,
            status: BookingStatus.CANCELLED,
            cancellationReason: 'Emergency change of plans',
            cancelledAt: new Date(),
          }),
        },
      };

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        return cb(txMock);
      });

      const notifySpy = vi.spyOn(NotificationService, 'notifyBookingCancelled');

      const res = await request(app)
        .post(`/api/bookings/${cancellableBooking.id}/cancel`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({
          reason: 'Emergency change of plans',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(BookingStatus.CANCELLED);
      expect(txMock.tourSchedule.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockTourSchedule.id },
          data: expect.objectContaining({
            bookedCapacity: 4,
            status: ScheduleStatus.AVAILABLE,
          }),
        })
      );
      expect(notifySpy).toHaveBeenCalled();
    });

    it('POST /api/bookings/:id/cancel should reject cancellation when booking has already been cancelled', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);

      const alreadyCancelled = {
        id: '44444444-0000-4000-a000-000000000001',
        userId: travelerAlice.id,
        status: BookingStatus.CANCELLED,
        items: [],
        payments: [],
      };

      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(alreadyCancelled as any);

      const res = await request(app)
        .post(`/api/bookings/${alreadyCancelled.id}/cancel`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ reason: 'Try again' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('already been cancelled');
    });

    it('POST /api/bookings/:id/cancel should reject cancellation when departure date is in the past', async () => {
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(travelerAlice as any);

      const pastBooking = {
        id: '55555555-0000-4000-a000-000000000001',
        userId: travelerAlice.id,
        status: BookingStatus.CONFIRMED,
        items: [
          {
            id: 'item-past',
            tourScheduleId: mockTourSchedule.id,
            quantity: 1,
            startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          },
        ],
        payments: [],
      };

      vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(pastBooking as any);

      const res = await request(app)
        .post(`/api/bookings/${pastBooking.id}/cancel`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ reason: 'Trip was last week' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('departure date has passed');
    });
  });
});
