import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import {
  UserRole,
  DestinationCategory,
  TourDifficulty,
  ScheduleStatus,
  Prisma,
} from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { generateToken } from '../src/utils/jwt.js';

describe('Phase 5: Travel Discovery REST APIs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const adminUser = {
    id: '10000000-0000-4000-a000-000000000001',
    email: 'admin@voyagevista.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    tokenVersion: 0,
    passwordHash: '',
    phoneNumber: null,
    avatarUrl: null,
    isEmailVerified: true,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const touristUser = {
    id: '20000000-0000-4000-a000-000000000002',
    email: 'tourist@example.com',
    name: 'Jane Traveler',
    role: UserRole.TOURIST,
    tokenVersion: 0,
    passwordHash: '',
    phoneNumber: null,
    avatarUrl: null,
    isEmailVerified: true,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const adminToken = generateToken({
    sub: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    tokenVersion: 0,
  });

  const touristToken = generateToken({
    sub: touristUser.id,
    email: touristUser.email,
    role: touristUser.role,
    tokenVersion: 0,
  });

  const mockDestination = {
    id: '30000000-0000-4000-a000-000000000003',
    title: 'Kyoto Cultural Heritage',
    slug: 'kyoto-cultural-heritage',
    description: 'Ancient temples, peaceful bamboo groves, and traditional tea ceremonies.',
    shortDescription: 'The cultural capital of Japan.',
    country: 'Japan',
    city: 'Kyoto',
    location: 'Kansai Region',
    latitude: 35.0116,
    longitude: 135.7681,
    category: DestinationCategory.CULTURAL,
    imageUrl: 'https://images.unsplash.com/kyoto.jpg',
    galleryImages: ['https://images.unsplash.com/kyoto-1.jpg'],
    rating: 4.9,
    reviewCount: 42,
    isFeatured: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockTour = {
    id: '40000000-0000-4000-a000-000000000004',
    destinationId: '30000000-0000-4000-a000-000000000003',
    title: 'Kyoto Zen Temples Expedition',
    slug: 'kyoto-zen-temples-expedition',
    description: 'Immerse yourself in authentic Buddhist sanctuaries and ancient shrines.',
    highlights: ['Private tea master ceremony', 'Fushimi Inari morning hike'],
    durationDays: 5,
    durationNights: 4,
    basePrice: new Prisma.Decimal('1499.00'),
    discountPrice: new Prisma.Decimal('1299.00'),
    maxGroupSize: 12,
    difficulty: TourDifficulty.EASY,
    featuredImage: 'https://images.unsplash.com/tour.jpg',
    galleryImages: [],
    rating: 4.95,
    reviewCount: 18,
    isPublished: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    destination: mockDestination,
    schedules: [],
  };

  const mockSchedule = {
    id: '50000000-0000-4000-a000-000000000005',
    tourPackageId: '40000000-0000-4000-a000-000000000004',
    startDate: new Date('2026-12-01T09:00:00Z'),
    endDate: new Date('2026-12-06T18:00:00Z'),
    price: new Prisma.Decimal('1299.00'),
    totalCapacity: 12,
    bookedCapacity: 3,
    status: ScheduleStatus.AVAILABLE,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  const mockHotel = {
    id: '60000000-0000-4000-a000-000000000006',
    destinationId: '30000000-0000-4000-a000-000000000003',
    name: 'Hoshinoya Luxury Ryokan',
    slug: 'hoshinoya-luxury-ryokan',
    description: 'Traditional riverside Japanese inn with hot springs.',
    address: 'Arashiyama, Kyoto',
    starRating: 5,
    pricePerNight: new Prisma.Decimal('450.00'),
    amenities: ['Onsen Hot Spring', 'Free WiFi', 'Kaiseki Dining'],
    imageUrl: 'https://images.unsplash.com/hotel.jpg',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    destination: mockDestination,
  };

  const mockActivity = {
    id: '70000000-0000-4000-a000-000000000007',
    destinationId: '30000000-0000-4000-a000-000000000003',
    name: 'Gion Tea Ceremony Experience',
    slug: 'gion-tea-ceremony-experience',
    description: 'Authentic 90-minute tea ritual with licensed tea master.',
    durationHours: 1.5,
    price: new Prisma.Decimal('75.00'),
    imageUrl: 'https://images.unsplash.com/activity.jpg',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    destination: mockDestination,
  };

  const mockReview = {
    id: '80000000-0000-4000-a000-000000000008',
    userId: '20000000-0000-4000-a000-000000000002',
    destinationId: '30000000-0000-4000-a000-000000000003',
    tourPackageId: null,
    rating: 5,
    title: 'Magical trip!',
    comment: 'The bamboo forest at sunrise was utterly unforgettable.',
    isVerifiedBooking: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    user: {
      id: '20000000-0000-4000-a000-000000000002',
      name: 'Jane Traveler',
      avatarUrl: null,
    },
  };

  // Helper mock for authenticate middleware
  function mockAuthUser(user: typeof adminUser | typeof touristUser) {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(user as never);
  }

  // =========================================================================
  // 1. DESTINATION API TESTS
  // =========================================================================
  describe('Destination APIs', () => {
    it('GET /api/destinations - should list destinations with pagination', async () => {
      vi.spyOn(prisma.destination, 'findMany').mockResolvedValue([mockDestination]);
      vi.spyOn(prisma.destination, 'count').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/destinations')
        .query({ page: 1, pageSize: 10, category: 'CULTURAL', sortBy: 'title', sortOrder: 'asc' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].title).toBe('Kyoto Cultural Heritage');
      expect(res.body.data.pagination.totalItems).toBe(1);
    });

    it('GET /api/destinations/:idOrSlug - should retrieve destination by slug', async () => {
      vi.spyOn(prisma.destination, 'findFirst').mockResolvedValue({
        ...mockDestination,
        tours: [],
        hotels: [],
        activities: [],
      } as never);

      const res = await request(app).get('/api/destinations/kyoto-cultural-heritage');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('kyoto-cultural-heritage');
    });

    it('GET /api/destinations/:idOrSlug - should return 404 for missing destination', async () => {
      vi.spyOn(prisma.destination, 'findFirst').mockResolvedValue(null);

      const res = await request(app).get('/api/destinations/non-existent-destination');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DESTINATION_NOT_FOUND');
    });

    it('POST /api/destinations - should reject unauthenticated request with 401', async () => {
      const res = await request(app).post('/api/destinations').send({ title: 'New City' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/destinations - should forbid non-admin user with 403', async () => {
      mockAuthUser(touristUser);

      const res = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          title: 'Tokyo Metropolis',
          description: 'Vibrant modern city with historic shrines.',
          country: 'Japan',
          location: 'Kanto Region',
          imageUrl: 'https://images.unsplash.com/tokyo.jpg',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('POST /api/destinations - should allow admin to create destination', async () => {
      mockAuthUser(adminUser);
      vi.spyOn(prisma.destination, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.destination, 'create').mockResolvedValue(mockDestination);

      const res = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Kyoto Cultural Heritage',
          description: 'Ancient temples, peaceful bamboo groves, and traditional tea ceremonies.',
          country: 'Japan',
          location: 'Kansai Region',
          category: 'CULTURAL',
          imageUrl: 'https://images.unsplash.com/kyoto.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Kyoto Cultural Heritage');
    });

    it('POST /api/destinations - should reject invalid body with 422', async () => {
      mockAuthUser(adminUser);

      const res = await request(app)
        .post('/api/destinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'A', // Too short
          description: 'Short', // Too short
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('PATCH /api/destinations/:id - should update destination by ID for admin', async () => {
      mockAuthUser(adminUser);
      vi.spyOn(prisma.destination, 'findUnique').mockResolvedValue(mockDestination);
      vi.spyOn(prisma.destination, 'update').mockResolvedValue({
        ...mockDestination,
        title: 'Kyoto Ancient Sanctuary',
      });

      const res = await request(app)
        .patch(`/api/destinations/${mockDestination.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Kyoto Ancient Sanctuary' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Kyoto Ancient Sanctuary');
    });

    it('DELETE /api/destinations/:id - should delete destination by ID for admin', async () => {
      mockAuthUser(adminUser);
      vi.spyOn(prisma.destination, 'findUnique').mockResolvedValue(mockDestination);
      vi.spyOn(prisma.destination, 'delete').mockResolvedValue(mockDestination);

      const res = await request(app)
        .delete(`/api/destinations/${mockDestination.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Destination deleted successfully.');
    });
  });

  // =========================================================================
  // 2. TOUR PACKAGE & SCHEDULE API TESTS
  // =========================================================================
  describe('Tour Package & Schedule APIs', () => {
    it('GET /api/tours - should list tours with query filters', async () => {
      vi.spyOn(prisma.tourPackage, 'findMany').mockResolvedValue([mockTour as never]);
      vi.spyOn(prisma.tourPackage, 'count').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/tours')
        .query({
          minPrice: 500,
          maxPrice: 2000,
          difficulty: 'EASY',
          destinationId: mockDestination.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].basePrice).toMatch(/^1499/);
    });

    it('GET /api/tours/:idOrSlug - should retrieve tour details with schedules and destination', async () => {
      vi.spyOn(prisma.tourPackage, 'findFirst').mockResolvedValue({
        ...mockTour,
        schedules: [mockSchedule],
        reviews: [],
      } as never);

      const res = await request(app).get(`/api/tours/${mockTour.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe(mockTour.title);
      expect(res.body.data.schedules).toHaveLength(1);
    });

    it('POST /api/tours - should create tour package for admin', async () => {
      mockAuthUser(adminUser);
      vi.spyOn(prisma.destination, 'findUnique').mockResolvedValue(mockDestination);
      vi.spyOn(prisma.tourPackage, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.tourPackage, 'create').mockResolvedValue(mockTour as never);

      const res = await request(app)
        .post('/api/tours')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          destinationId: mockDestination.id,
          title: 'Kyoto Zen Temples Expedition',
          description: 'Immerse yourself in authentic Buddhist sanctuaries and ancient shrines.',
          durationDays: 5,
          basePrice: 1499,
          featuredImage: 'https://images.unsplash.com/tour.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe(mockTour.title);
    });

    it('POST /api/tours/:tourId/schedules - should create tour schedule for admin', async () => {
      mockAuthUser(adminUser);
      vi.spyOn(prisma.tourPackage, 'findFirst').mockResolvedValue(mockTour as never);
      vi.spyOn(prisma.tourSchedule, 'create').mockResolvedValue(mockSchedule as never);

      const res = await request(app)
        .post(`/api/tours/${mockTour.id}/schedules`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: '2026-12-01T09:00:00.000Z',
          endDate: '2026-12-06T18:00:00.000Z',
          price: 1299,
          totalCapacity: 12,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.price).toMatch(/^1299/);
      expect(res.body.data.totalCapacity).toBe(12);
    });

    it('PATCH /api/tours/:tourId/schedules/:scheduleId - should update schedule capacity', async () => {
      mockAuthUser(adminUser);
      vi.spyOn(prisma.tourSchedule, 'findUnique').mockResolvedValue(mockSchedule as never);
      vi.spyOn(prisma.tourSchedule, 'update').mockResolvedValue({
        ...mockSchedule,
        bookedCapacity: 10,
        status: ScheduleStatus.ALMOST_FULL,
      } as never);

      const res = await request(app)
        .patch(`/api/tours/${mockTour.id}/schedules/${mockSchedule.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bookedCapacity: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.bookedCapacity).toBe(10);
      expect(res.body.data.status).toBe(ScheduleStatus.ALMOST_FULL);
    });
  });

  // =========================================================================
  // 3. HOTEL API TESTS
  // =========================================================================
  describe('Hotel APIs', () => {
    it('GET /api/hotels - should list hotels with star rating and price filters', async () => {
      vi.spyOn(prisma.hotel, 'findMany').mockResolvedValue([mockHotel as never]);
      vi.spyOn(prisma.hotel, 'count').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/hotels')
        .query({ minPrice: 200, maxPrice: 600, starRating: 5, amenities: 'Onsen Hot Spring' });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].name).toBe('Hoshinoya Luxury Ryokan');
    });

    it('GET /api/hotels/:idOrSlug - should retrieve hotel details', async () => {
      vi.spyOn(prisma.hotel, 'findFirst').mockResolvedValue(mockHotel as never);

      const res = await request(app).get(`/api/hotels/${mockHotel.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe(mockHotel.slug);
      expect(res.body.data.destination.title).toBe(mockDestination.title);
    });

    it('POST /api/hotels - should create accommodation for admin', async () => {
      mockAuthUser(adminUser);
      vi.spyOn(prisma.destination, 'findUnique').mockResolvedValue(mockDestination);
      vi.spyOn(prisma.hotel, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.hotel, 'create').mockResolvedValue(mockHotel as never);

      const res = await request(app)
        .post('/api/hotels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          destinationId: mockDestination.id,
          name: 'Hoshinoya Luxury Ryokan',
          description: 'Traditional riverside Japanese inn with hot springs.',
          address: 'Arashiyama, Kyoto',
          starRating: 5,
          pricePerNight: 450,
          amenities: ['Onsen Hot Spring'],
          imageUrl: 'https://images.unsplash.com/hotel.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(mockHotel.name);
    });
  });

  // =========================================================================
  // 4. ACTIVITY API TESTS
  // =========================================================================
  describe('Activity APIs', () => {
    it('GET /api/activities - should list activities with duration and destination filters', async () => {
      vi.spyOn(prisma.activity, 'findMany').mockResolvedValue([mockActivity as never]);
      vi.spyOn(prisma.activity, 'count').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/activities')
        .query({ destinationId: mockDestination.id, minPrice: 50, maxPrice: 100 });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].name).toBe(mockActivity.name);
    });

    it('GET /api/activities/:idOrSlug - should retrieve activity by slug', async () => {
      vi.spyOn(prisma.activity, 'findFirst').mockResolvedValue(mockActivity as never);

      const res = await request(app).get(`/api/activities/${mockActivity.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(mockActivity.name);
    });

    it('POST /api/activities - should create activity for admin', async () => {
      mockAuthUser(adminUser);
      vi.spyOn(prisma.destination, 'findUnique').mockResolvedValue(mockDestination);
      vi.spyOn(prisma.activity, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.activity, 'create').mockResolvedValue(mockActivity as never);

      const res = await request(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          destinationId: mockDestination.id,
          name: 'Gion Tea Ceremony Experience',
          description: 'Authentic 90-minute tea ritual with licensed tea master.',
          durationHours: 1.5,
          price: 75,
          imageUrl: 'https://images.unsplash.com/activity.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(mockActivity.name);
    });
  });

  // =========================================================================
  // 5. REVIEWS & RATINGS TESTS
  // =========================================================================
  describe('Review & Rating APIs', () => {
    it('GET /api/reviews - should list reviews for a destination', async () => {
      vi.spyOn(prisma.review, 'findMany').mockResolvedValue([mockReview]);
      vi.spyOn(prisma.review, 'count').mockResolvedValue(1);

      const res = await request(app)
        .get('/api/reviews')
        .query({ destinationId: mockDestination.id });

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].rating).toBe(5);
    });

    it('GET /api/reviews/stats - should calculate average rating and distribution', async () => {
      vi.spyOn(prisma.review, 'aggregate').mockResolvedValue({
        _avg: { rating: 4.8 },
        _count: { rating: 25 },
      } as never);

      vi.spyOn(prisma.review, 'groupBy').mockResolvedValue([
        { rating: 5, _count: { rating: 20 } },
        { rating: 4, _count: { rating: 5 } },
      ] as never);

      const res = await request(app)
        .get('/api/reviews/stats')
        .query({ destinationId: mockDestination.id });

      expect(res.status).toBe(200);
      expect(res.body.data.averageRating).toBe(4.8);
      expect(res.body.data.totalReviews).toBe(25);
      expect(res.body.data.ratingDistribution['5']).toBe(20);
      expect(res.body.data.ratingDistribution['4']).toBe(5);
    });

    it('POST /api/reviews - should reject unauthenticated review submission with 401', async () => {
      const res = await request(app).post('/api/reviews').send({
        destinationId: mockDestination.id,
        rating: 5,
        comment: 'Great trip!',
      });

      expect(res.status).toBe(401);
    });

    it('POST /api/reviews - should allow authenticated user with verified booking to submit review', async () => {
      mockAuthUser(touristUser);
      vi.spyOn(prisma.destination, 'findUnique').mockResolvedValue(mockDestination);
      vi.spyOn(prisma.review, 'findFirst').mockResolvedValue(null); // No duplicate
      // Mock booking check: user has confirmed booking
      vi.spyOn(prisma.booking, 'findFirst').mockResolvedValue({ id: 'booking-1' } as never);
      vi.spyOn(prisma.review, 'create').mockResolvedValue(mockReview);
      vi.spyOn(prisma.review, 'aggregate').mockResolvedValue({
        _avg: { rating: 4.9 },
        _count: { rating: 1 },
      } as never);
      vi.spyOn(prisma.destination, 'update').mockResolvedValue(mockDestination);

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          destinationId: mockDestination.id,
          rating: 5,
          title: 'Magical trip!',
          comment: 'The bamboo forest at sunrise was utterly unforgettable.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isVerifiedBooking).toBe(true);
      expect(res.body.data.rating).toBe(5);
    });

    it('POST /api/reviews - should reject duplicate review with 409 Conflict', async () => {
      mockAuthUser(touristUser);
      vi.spyOn(prisma.destination, 'findUnique').mockResolvedValue(mockDestination);
      vi.spyOn(prisma.review, 'findFirst').mockResolvedValue(mockReview); // Already exists!

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${touristToken}`)
        .send({
          destinationId: mockDestination.id,
          rating: 5,
          comment: 'Submitting a second review.',
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_REVIEW');
    });

    it('DELETE /api/reviews/:id - should allow review owner to delete review', async () => {
      mockAuthUser(touristUser);
      vi.spyOn(prisma.review, 'findUnique').mockResolvedValue(mockReview);
      vi.spyOn(prisma.review, 'delete').mockResolvedValue(mockReview);
      vi.spyOn(prisma.review, 'aggregate').mockResolvedValue({
        _avg: { rating: 0 },
        _count: { rating: 0 },
      } as never);
      vi.spyOn(prisma.destination, 'update').mockResolvedValue(mockDestination);

      const res = await request(app)
        .delete(`/api/reviews/${mockReview.id}`)
        .set('Authorization', `Bearer ${touristToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Review deleted successfully.');
    });

    it('DELETE /api/reviews/:id - should forbid non-author user from deleting review', async () => {
      const otherUser = { ...touristUser, id: '90000000-0000-4000-a000-000000000009' };
      mockAuthUser(otherUser);
      vi.spyOn(prisma.review, 'findUnique').mockResolvedValue(mockReview);

      const otherToken = generateToken({
        sub: otherUser.id,
        email: otherUser.email,
        role: otherUser.role,
        tokenVersion: 0,
      });

      const res = await request(app)
        .delete(`/api/reviews/${mockReview.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });
});
