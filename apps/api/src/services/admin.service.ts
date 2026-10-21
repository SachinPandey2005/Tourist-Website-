import { Prisma, BookingStatus, PaymentStatus, UserRole, DiscountType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { parsePaginationParams, formatPaginatedResult } from '../utils/pagination.js';

export interface ListUsersFilter {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  search?: string;
}

export interface ListAdminBookingsFilter {
  page?: number;
  pageSize?: number;
  status?: BookingStatus;
  search?: string;
}

export interface ListPaymentsFilter {
  page?: number;
  pageSize?: number;
  status?: PaymentStatus;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minBookingAmount?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  startDate: string | Date;
  endDate: string | Date;
}

export class AdminService {
  /**
   * Computes live high-level platform statistics directly from PostgreSQL without hardcoding.
   */
  static async getOverviewStats() {
    const [
      totalUsers,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      activeTours,
      totalDestinations,
      totalReviews,
      totalHotels,
      revenueResult,
      recentBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
      prisma.tourPackage.count({ where: { isPublished: true } }),
      prisma.destination.count(),
      prisma.review.count(),
      prisma.hotel.count(),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.SUCCEEDED },
        _sum: { amount: true },
      }),
      prisma.booking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          payments: { select: { status: true } },
        },
      }),
    ]);

    const grossRevenue = revenueResult._sum.amount
      ? Number(revenueResult._sum.amount).toFixed(2)
      : '0.00';

    return {
      totalUsers,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      activeTours,
      totalDestinations,
      totalReviews,
      totalHotels,
      grossRevenue,
      currency: 'USD',
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        bookingReference: b.bookingReference,
        userName: b.user.name,
        userEmail: b.user.email,
        totalAmount: Number(b.totalAmount).toFixed(2),
        status: b.status,
        paymentStatus: b.payments[0]?.status || 'PENDING',
        createdAt: b.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Retrieves all bookings with filters for admin oversight.
   */
  static async listAllBookings(filter: ListAdminBookingsFilter) {
    const { page, pageSize, skip, take } = parsePaginationParams(
      {
        page: filter.page,
        pageSize: filter.pageSize,
      },
      10,
      50
    );

    const where: Prisma.BookingWhereInput = {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { bookingReference: { contains: filter.search, mode: 'insensitive' } },
              { user: { name: { contains: filter.search, mode: 'insensitive' } } },
              { user: { email: { contains: filter.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [items, totalItems] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: true,
          payments: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const formatted = items.map((b) => ({
      id: b.id,
      bookingReference: b.bookingReference,
      userId: b.userId,
      userName: b.user.name,
      userEmail: b.user.email,
      totalAmount: Number(b.totalAmount).toFixed(2),
      status: b.status,
      paymentStatus: b.payments[0]?.status || 'PENDING',
      itemCount: b.items.length,
      createdAt: b.createdAt.toISOString(),
    }));

    return formatPaginatedResult(formatted, totalItems, page, pageSize);
  }

  /**
   * Admin-only modification of booking status.
   */
  static async updateBookingStatus(bookingId: string, status: BookingStatus) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw AppError.notFound(`Booking '${bookingId}' not found.`);
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: { user: true, payments: true },
    });

    return {
      id: updated.id,
      bookingReference: updated.bookingReference,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Retrieves all users for admin user management.
   */
  static async listUsers(filter: ListUsersFilter) {
    const { page, pageSize, skip, take } = parsePaginationParams(
      {
        page: filter.page,
        pageSize: filter.pageSize,
      },
      10,
      50
    );

    const where: Prisma.UserWhereInput = {
      ...(filter.role ? { role: filter.role } : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { email: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, totalItems] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phoneNumber: true,
          isEmailVerified: true,
          createdAt: true,
          _count: {
            select: { bookings: true, reviews: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phoneNumber: u.phoneNumber,
      isEmailVerified: u.isEmailVerified,
      bookingCount: u._count.bookings,
      reviewCount: u._count.reviews,
      createdAt: u.createdAt.toISOString(),
    }));

    return formatPaginatedResult(formatted, totalItems, page, pageSize);
  }

  /**
   * Updates a user's role.
   */
  static async updateUserRole(userId: string, newRole: UserRole) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound(`User '${userId}' not found.`);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true },
    });

    return updated;
  }

  /**
   * Retrieves all payments with transaction status and reference codes.
   */
  static async listPayments(filter: ListPaymentsFilter) {
    const { page, pageSize, skip, take } = parsePaginationParams(
      {
        page: filter.page,
        pageSize: filter.pageSize,
      },
      10,
      50
    );

    const where: Prisma.PaymentWhereInput = {
      ...(filter.status ? { status: filter.status } : {}),
    };

    const [payments, totalItems] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          booking: { select: { id: true, bookingReference: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const formatted = payments.map((p) => ({
      id: p.id,
      paymentReference: p.paymentReference,
      bookingReference: p.booking?.bookingReference,
      userName: p.user?.name,
      userEmail: p.user?.email,
      amount: Number(p.amount).toFixed(2),
      currency: p.currency,
      status: p.status,
      method: p.method,
      paidAt: p.paidAt ? p.paidAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    }));

    return formatPaginatedResult(formatted, totalItems, page, pageSize);
  }

  /**
   * Issues a refund for a payment record and updates the status to REFUNDED.
   */
  static async refundPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw AppError.notFound(`Payment '${paymentId}' not found.`);

    if (payment.status === PaymentStatus.REFUNDED) {
      throw AppError.badRequest('This payment has already been refunded.');
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED },
    });

    return {
      id: updated.id,
      paymentReference: updated.paymentReference,
      status: updated.status,
      message: 'Payment has been successfully refunded.',
    };
  }

  /**
   * Retrieves promotional coupons.
   */
  static async listCoupons() {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return coupons.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: Number(c.discountValue).toFixed(2),
      minBookingAmount: c.minBookingAmount ? Number(c.minBookingAmount).toFixed(2) : null,
      maxDiscountAmount: c.maxDiscountAmount ? Number(c.maxDiscountAmount).toFixed(2) : null,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      isActive: c.isActive,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
    }));
  }

  /**
   * Creates a new promotional coupon.
   */
  static async createCoupon(input: CreateCouponInput) {
    const existing = await prisma.coupon.findUnique({
      where: { code: input.code.toUpperCase() },
    });

    if (existing) {
      throw AppError.conflict(`Coupon code '${input.code.toUpperCase()}' already exists.`);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: input.code.toUpperCase(),
        description: input.description,
        discountType: input.discountType,
        discountValue: new Prisma.Decimal(input.discountValue),
        minBookingAmount: input.minBookingAmount ? new Prisma.Decimal(input.minBookingAmount) : null,
        maxDiscountAmount: input.maxDiscountAmount ? new Prisma.Decimal(input.maxDiscountAmount) : null,
        maxUses: input.maxUses,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        isActive: true,
      },
    });

    return {
      id: coupon.id,
      code: coupon.code,
      discountValue: Number(coupon.discountValue).toFixed(2),
      discountType: coupon.discountType,
      isActive: coupon.isActive,
    };
  }

  /**
   * Deletes a promotional coupon.
   */
  static async deleteCoupon(couponId: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw AppError.notFound(`Coupon '${couponId}' not found.`);

    await prisma.coupon.delete({ where: { id: couponId } });
    return { message: 'Coupon deleted successfully.' };
  }
}
