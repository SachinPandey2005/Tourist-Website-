import { PrismaClient, UserRole, DestinationCategory, TourDifficulty, ScheduleStatus, DiscountType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Users
  console.log('Seeding users...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@voyagevista.com' },
    update: {},
    create: {
      email: 'admin@voyagevista.com',
      name: 'System Administrator',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      phoneNumber: '+1-555-0100',
    },
  });

  const guide = await prisma.user.upsert({
    where: { email: 'guide.kenji@voyagevista.com' },
    update: {},
    create: {
      email: 'guide.kenji@voyagevista.com',
      name: 'Kenji Sato',
      role: UserRole.GUIDE,
      isEmailVerified: true,
      phoneNumber: '+81-90-1234-5678',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  });

  const tourist = await prisma.user.upsert({
    where: { email: 'traveler.jane@gmail.com' },
    update: {},
    create: {
      email: 'traveler.jane@gmail.com',
      name: 'Jane Doe',
      role: UserRole.TOURIST,
      isEmailVerified: true,
      phoneNumber: '+1-555-0199',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    },
  });

  console.log(`Users seeded: ${admin.email}, ${guide.email}, ${tourist.email}`);

  // 2. Seed Destinations
  console.log('Seeding destinations...');
  const kyoto = await prisma.destination.upsert({
    where: { slug: 'kyoto-japan' },
    update: {},
    create: {
      title: 'Kyoto Imperial Heritage & Bamboo Groves',
      slug: 'kyoto-japan',
      description: 'Kyoto, once the capital of Japan, is a refined cultural sanctuary celebrated for thousands of classical Buddhist temples, serene Shinto shrines, imperial palaces, and preserved historic geisha districts.',
      shortDescription: 'The cultural soul of Japan with thousand-year-old temples and bamboo forests.',
      country: 'Japan',
      city: 'Kyoto',
      location: 'Kansai Region, Honshu Island',
      latitude: 35.0116,
      longitude: 135.7681,
      category: DestinationCategory.CULTURAL,
      imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.92,
      reviewCount: 148,
      isFeatured: true,
    },
  });

  const zermatt = await prisma.destination.upsert({
    where: { slug: 'swiss-alps-zermatt' },
    update: {},
    create: {
      title: 'Zermatt & The Majestic Matterhorn',
      slug: 'swiss-alps-zermatt',
      description: 'Nestled at the base of the pyramidal Matterhorn peak, Zermatt offers car-free alpine serenity, world-class glacier skiing, and dramatic hiking routes through the high Swiss Alps.',
      shortDescription: 'Car-free mountain resort in Switzerland under the iconic Matterhorn.',
      country: 'Switzerland',
      city: 'Zermatt',
      location: 'Valais Canton',
      latitude: 45.9765,
      longitude: 7.7491,
      category: DestinationCategory.MOUNTAIN,
      imageUrl: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.96,
      reviewCount: 92,
      isFeatured: true,
    },
  });

  const santorini = await prisma.destination.upsert({
    where: { slug: 'santorini-cyclades' },
    update: {},
    create: {
      title: 'Santorini Caldera & White Sunsets',
      slug: 'santorini-cyclades',
      description: 'Perched high above the azure Aegean Sea, Santorini charms travelers with whitewashed cliffside villages, blue-domed chapels, volcanic beaches, and world-renowned sunsets.',
      shortDescription: 'Spectacular volcanic island in the Aegean Sea famed for dramatic sunsets.',
      country: 'Greece',
      city: 'Oia',
      location: 'Cyclades Islands',
      latitude: 36.3932,
      longitude: 25.4615,
      category: DestinationCategory.BEACH,
      imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.88,
      reviewCount: 215,
      isFeatured: true,
    },
  });

  const serengeti = await prisma.destination.upsert({
    where: { slug: 'serengeti-safari' },
    update: {},
    create: {
      title: 'Serengeti National Wildlife Sanctuary',
      slug: 'serengeti-safari',
      description: 'One of the most untamed ecosystems on earth, the Serengeti hosts the Great Migration of millions of wildebeest, zebras, gazelles, and the legendary African Big Five.',
      shortDescription: 'Endless African plains famous for wildlife safaris and the Great Migration.',
      country: 'Tanzania',
      city: 'Mara Region',
      location: 'Northern Tanzania',
      latitude: -2.3333,
      longitude: 34.8333,
      category: DestinationCategory.WILDLIFE,
      imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.95,
      reviewCount: 84,
      isFeatured: false,
    },
  });

  // 3. Seed Tour Packages & Schedules
  console.log('Seeding tour packages and schedules...');
  const kyotoTour = await prisma.tourPackage.upsert({
    where: { slug: 'kyoto-zen-and-temple-trail' },
    update: {},
    create: {
      destinationId: kyoto.id,
      title: 'Kyoto Zen & Sacred Temples Expedition',
      slug: 'kyoto-zen-and-temple-trail',
      description: 'Immerse yourself in authentic Japanese culture with private access to Zen gardens, Fushimi Inari torii corridors, tea ceremonies with master artisans, and traditional kaiseki feasts.',
      highlights: [
        'Private morning access to Fushimi Inari shrine',
        'Traditional tea master ceremony in Gion',
        'Arashiyama bamboo grove walking tour',
        'Kaiseki multicourse dinner at Michelin-recognized ryokan'
      ],
      durationDays: 7,
      durationNights: 6,
      basePrice: 1850.00,
      discountPrice: 1699.00,
      maxGroupSize: 12,
      difficulty: TourDifficulty.EASY,
      featuredImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.94,
      reviewCount: 36,
      isPublished: true,
      schedules: {
        create: [
          {
            startDate: new Date('2026-11-10T09:00:00Z'),
            endDate: new Date('2026-11-17T18:00:00Z'),
            price: 1699.00,
            totalCapacity: 12,
            bookedCapacity: 4,
            status: ScheduleStatus.AVAILABLE,
          },
          {
            startDate: new Date('2026-12-05T09:00:00Z'),
            endDate: new Date('2026-12-12T18:00:00Z'),
            price: 1850.00,
            totalCapacity: 12,
            bookedCapacity: 10,
            status: ScheduleStatus.ALMOST_FULL,
          }
        ]
      }
    },
  });

  const zermattTour = await prisma.tourPackage.upsert({
    where: { slug: 'zermatt-matterhorn-alpine-trek' },
    update: {},
    create: {
      destinationId: zermatt.id,
      title: 'Matterhorn Alpine Traverse & Glacier Trek',
      slug: 'zermatt-matterhorn-alpine-trek',
      description: 'Guided high-altitude alpine expedition along the Five Lakes Walk, Gornergrat viewpoint, and the Matterhorn Glacier Paradise with UIAGM-certified mountain guides.',
      highlights: [
        'UIAGM certified alpine guide guidance',
        'Gornergrat cogwheel railway panoramic pass',
        'High glacier crossing with crampons & safety gear',
        'Luxury mountain lodge accommodation with sauna'
      ],
      durationDays: 5,
      durationNights: 4,
      basePrice: 2450.00,
      maxGroupSize: 8,
      difficulty: TourDifficulty.CHALLENGING,
      featuredImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
      rating: 4.97,
      reviewCount: 28,
      isPublished: true,
      schedules: {
        create: [
          {
            startDate: new Date('2026-11-20T08:00:00Z'),
            endDate: new Date('2026-11-25T17:00:00Z'),
            price: 2450.00,
            totalCapacity: 8,
            bookedCapacity: 3,
            status: ScheduleStatus.AVAILABLE,
          }
        ]
      }
    },
  });

  const santoriniTour = await prisma.tourPackage.upsert({
    where: { slug: 'santorini-caldera-catamaran-escape' },
    update: {},
    create: {
      destinationId: santorini.id,
      title: 'Santorini Caldera & Sunset Catamaran Escape',
      slug: 'santorini-caldera-catamaran-escape',
      description: 'Sail the crystalline waters of the Aegean on a luxury catamaran, swim in volcanic hot springs, taste volcanic Assyrtiko wines, and watch the sunset from Oia cliffs.',
      highlights: [
        'Luxury private catamaran caldera sailing',
        'Volcanic hot springs swimming',
        'Private volcanic vineyard wine tasting tour',
        'Traditional Greek sunset dining in Ammoudi Bay'
      ],
      durationDays: 4,
      durationNights: 3,
      basePrice: 1290.00,
      discountPrice: 1150.00,
      maxGroupSize: 10,
      difficulty: TourDifficulty.EASY,
      featuredImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      rating: 4.89,
      reviewCount: 52,
      isPublished: true,
      schedules: {
        create: [
          {
            startDate: new Date('2026-11-15T10:00:00Z'),
            endDate: new Date('2026-11-19T14:00:00Z'),
            price: 1150.00,
            totalCapacity: 10,
            bookedCapacity: 2,
            status: ScheduleStatus.AVAILABLE,
          }
        ]
      }
    },
  });

  // 4. Seed Hotels & Accommodations
  console.log('Seeding accommodations...');
  await prisma.hotel.upsert({
    where: { slug: 'kyoto-ryokan-hoshinoya' },
    update: {},
    create: {
      destinationId: kyoto.id,
      name: 'Hoshinoya Kyoto Luxury Riverside Ryokan',
      slug: 'kyoto-ryokan-hoshinoya',
      description: 'Historic riverside retreat accessible only by traditional wooden boat along the Oi River.',
      address: 'Arashiyama, Ukyo Ward, Kyoto',
      starRating: 5,
      pricePerNight: 520.00,
      amenities: ['Onsen Hot Spring', 'Kaiseki Dining', 'Tea Salon', 'River Views', 'High-Speed WiFi'],
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    },
  });

  await prisma.hotel.upsert({
    where: { slug: 'zermatt-omnia-alpine-lodge' },
    update: {},
    create: {
      destinationId: zermatt.id,
      name: 'The Omnia Modern Mountain Lodge',
      slug: 'zermatt-omnia-alpine-lodge',
      description: 'Perched on a rock 45 meters above the roofs of Zermatt with unobstructed Matterhorn views.',
      address: 'Auf dem Fels, 3920 Zermatt, Switzerland',
      starRating: 5,
      pricePerNight: 590.00,
      amenities: ['Matterhorn Views', 'Spa & Wellness', 'Indoor/Outdoor Pool', 'Gourmet Restaurant'],
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    },
  });

  // 5. Seed Activities
  console.log('Seeding activities...');
  await prisma.activity.upsert({
    where: { slug: 'kyoto-master-tea-ceremony' },
    update: {},
    create: {
      destinationId: kyoto.id,
      name: 'Authentic Urasenke Tea Ceremony with Geiko',
      slug: 'kyoto-master-tea-ceremony',
      description: 'Private 90-minute tea ritual in a historic 200-year-old wooden teahouse in Gion.',
      durationHours: 1.5,
      price: 85.00,
      imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80',
    },
  });

  await prisma.activity.upsert({
    where: { slug: 'zermatt-gornergrat-railway' },
    update: {},
    create: {
      destinationId: zermatt.id,
      name: 'Gornergrat Open-Air Alpine Railway Pass',
      slug: 'zermatt-gornergrat-railway',
      description: 'Ride Europe’s highest open-air cogwheel train up to 3,089 meters for breathtaking 360-degree panoramas.',
      durationHours: 3.5,
      price: 135.00,
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    },
  });

  // 6. Seed Coupons
  console.log('Seeding coupons & promotions...');
  await prisma.coupon.upsert({
    where: { code: 'VOYAGE10' },
    update: {},
    create: {
      code: 'VOYAGE10',
      description: '10% launch discount for all inaugural bookings',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10.00,
      minBookingAmount: 500.00,
      maxDiscountAmount: 300.00,
      maxUses: 500,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-12-31T23:59:59Z'),
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'EXPLORE150' },
    update: {},
    create: {
      code: 'EXPLORE150',
      description: '$150 flat discount on luxury multi-day expeditions',
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 150.00,
      minBookingAmount: 1500.00,
      maxUses: 200,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-12-31T23:59:59Z'),
      isActive: true,
    },
  });

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
