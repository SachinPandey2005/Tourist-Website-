import { Prisma, BookingStatus, PaymentStatus, ScheduleStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { parsePaginationParams, formatPaginatedResult } from '../utils/pagination.js';
import type { PaginatedResult } from '@tourist/shared';

export interface CreateBookingItemInput {
  tourPackageId?: string;
  tourScheduleId?: string;
  hotelId?: string;
  activityId?: string;
  itemTitle: string;
  unitPrice: number;
  quantity?: number;
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface CreateBookingInput {
  items: CreateBookingItemInput[];
  specialRequests?: string;
  couponCode?: string;
}

export interface ListBookingsFilter {
  page?: number;
  pageSize?: number;
  status?: BookingStatus;
  userId?: string;
  search?: string;
}

export class BookingService {
  /**
   * Formats a booking record for API response
   */
  private static formatBooking(booking: any) {
    return {
      id: booking.id,
      bookingReference: booking.bookingReference,
      userId: booking.userId,
      status: booking.status,
      subtotal: booking.subtotal ? Number(booking.subtotal).toFixed(2) : '0.00',
      discountAmount: booking.discountAmount ? Number(booking.discountAmount).toFixed(2) : '0.00',
      taxAmount: booking.taxAmount ? Number(booking.taxAmount).toFixed(2) : '0.00',
      totalAmount: booking.totalAmount ? Number(booking.totalAmount).toFixed(2) : '0.00',
      currency: booking.currency,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      user: booking.user
        ? {
            id: booking.user.id,
            name: booking.user.name,
            email: booking.user.email,
          }
        : undefined,
      items: booking.items
        ? booking.items.map((item: any) => ({
            id: item.id,
            itemTitle: item.itemTitle,
            unitPrice: Number(item.unitPrice).toFixed(2),
            quantity: item.quantity,
            totalPrice: Number(item.totalPrice).toFixed(2),
            startDate: item.startDate ? item.startDate.toISOString() : null,
            endDate: item.endDate ? item.endDate.toISOString() : null,
            tourPackage: item.tourPackage
              ? {
                  id: item.tourPackage.id,
                  title: item.tourPackage.title,
                  slug: item.tourPackage.slug,
                  featuredImage: item.tourPackage.featuredImage,
                }
              : null,
            tourSchedule: item.tourSchedule
              ? {
                  id: item.tourSchedule.id,
                  startDate: item.tourSchedule.startDate ? item.tourSchedule.startDate.toISOString() : null,
                  endDate: item.tourSchedule.endDate ? item.tourSchedule.endDate.toISOString() : null,
                  status: item.tourSchedule.status,
                }
              : null,
            hotel: item.hotel
              ? {
                  id: item.hotel.id,
                  name: item.hotel.name,
                  slug: item.hotel.slug,
                  imageUrl: item.hotel.imageUrl,
                }
              : null,
            activity: item.activity
              ? {
                  id: item.activity.id,
                  name: item.activity.name,
                  slug: item.activity.slug,
                  imageUrl: item.activity.imageUrl,
                }
              : null,
          }))
        : [],
      payments: booking.payments
        ? booking.payments.map((p: any) => ({
            id: p.id,
            paymentReference: p.paymentReference,
            amount: Number(p.amount).toFixed(2),
            currency: p.currency,
            status: p.status,
            method: p.method,
            paidAt: p.paidAt ? p.paidAt.toISOString() : null,
            createdAt: p.createdAt.toISOString(),
          }))
        : [],
    };
  }

  /**
   * Retrieves paginated bookings belonging exclusively to the authenticated user.
   */
  static async listUserBookings(
    userId: string,
    filter: ListBookingsFilter
  ): Promise<PaginatedResult<any>> {
    const { page, pageSize, skip, take } = parsePaginationParams(
      {
        page: filter.page,
        pageSize: filter.pageSize,
      },
      10,
      50
    );

    const where: Prisma.BookingWhereInput = {
      userId,
      ...(filter.status ? { status: filter.status } : {}),
    };

    const [items, totalItems] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              tourPackage: true,
              tourSchedule: true,
              hotel: true,
              activity: true,
            },
          },
          payments: true,
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const formatted = items.map((b) => this.formatBooking(b));
    return formatPaginatedResult(formatted, totalItems, page, pageSize);
  }

  /**
   * Retrieves single booking details enforcing strict ownership checks.
   */
  static async getBookingById(
    bookingId: string,
    requestingUserId: string,
    requestingRole: UserRole
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        items: {
          include: {
            tourPackage: true,
            tourSchedule: true,
            hotel: true,
            activity: true,
          },
        },
        payments: true,
      },
    });

    if (!booking) {
      throw AppError.notFound(`Booking with ID '${bookingId}' does not exist.`);
    }

    // Ownership Authorization Check: must be owner or ADMIN
    if (booking.userId !== requestingUserId && requestingRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You do not have authorization to view this booking record.');
    }

    return this.formatBooking(booking);
  }

  /**
   * Cancels a booking, restoring reserved tour schedule capacity.
   */
  static async cancelBooking(
    bookingId: string,
    requestingUserId: string,
    requestingRole: UserRole,
    reason?: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!booking) {
      throw AppError.notFound(`Booking with ID '${bookingId}' does not exist.`);
    }

    // Ownership Authorization Check
    if (booking.userId !== requestingUserId && requestingRole !== UserRole.ADMIN) {
      throw AppError.forbidden('You do not have authorization to cancel this booking.');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw AppError.badRequest('This booking has already been cancelled.');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw AppError.badRequest('Completed journeys cannot be cancelled.');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Restore capacity for any tour schedule item
      for (const item of booking.items) {
        if (item.tourScheduleId) {
          const schedule = await tx.tourSchedule.findUnique({
            where: { id: item.tourScheduleId },
          });

          if (schedule) {
            const newBooked = Math.max(0, schedule.bookedCapacity - item.quantity);
            await tx.tourSchedule.update({
              where: { id: item.tourScheduleId },
              data: {
                bookedCapacity: newBooked,
                status:
                  schedule.status === ScheduleStatus.SOLD_OUT || schedule.status === ScheduleStatus.ALMOST_FULL
                    ? ScheduleStatus.AVAILABLE
                    : schedule.status,
              },
            });
          }
        }
      }

      // 2. Mark payments as REFUNDED if succeeded or PENDING
      await tx.payment.updateMany({
        where: { bookingId: booking.id, status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCEEDED] } },
        data: { status: PaymentStatus.REFUNDED },
      });

      // 3. Mark booking as CANCELLED
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          specialRequests: reason
            ? `${booking.specialRequests || ''}\n[Cancellation Reason: ${reason}]`.trim()
            : booking.specialRequests,
        },
        include: {
          items: true,
          payments: true,
          user: true,
        },
      });

      return this.formatBooking(updated);
    });
  }

  /**
   * Creates a new booking with immutable historical snapshots.
   */
  static async createBooking(userId: string, input: CreateBookingInput) {
    if (!input.items || input.items.length === 0) {
      throw AppError.badRequest('A booking must include at least one item.');
    }

    return await prisma.$transaction(async (tx) => {
      let subtotal = new Prisma.Decimal(0);

      // Validate schedules and calculate subtotal
      for (const item of input.items) {
        const itemQuantity = item.quantity || 1;
        const itemUnit = new Prisma.Decimal(item.unitPrice);
        subtotal = subtotal.add(itemUnit.mul(itemQuantity));

        if (item.tourScheduleId) {
          const schedule = await tx.tourSchedule.findUnique({
            where: { id: item.tourScheduleId },
          });

          if (!schedule) {
            throw AppError.notFound(`Tour schedule '${item.tourScheduleId}' not found.`);
          }

          if (schedule.status === ScheduleStatus.SOLD_OUT || schedule.status === ScheduleStatus.CANCELLED) {
            throw AppError.badRequest(`Tour schedule is not available for booking.`);
          }

          const availableCapacity = schedule.totalCapacity - schedule.bookedCapacity;
          if (availableCapacity < itemQuantity) {
            throw AppError.badRequest(
              `Insufficient capacity on schedule. Only ${availableCapacity} spots remaining.`
            );
          }

          // Lock capacity
          const newBooked = schedule.bookedCapacity + itemQuantity;
          await tx.tourSchedule.update({
            where: { id: item.tourScheduleId },
            data: {
              bookedCapacity: newBooked,
              status:
                newBooked >= schedule.totalCapacity
                  ? ScheduleStatus.SOLD_OUT
                  : newBooked >= schedule.totalCapacity - 2
                  ? ScheduleStatus.ALMOST_FULL
                  : schedule.status,
            },
          });
        }
      }

      const totalAmount = subtotal; // Discount & tax can be applied if coupon present
      const bookingReference = `VV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const booking = await tx.booking.create({
        data: {
          bookingReference,
          userId,
          status: BookingStatus.CONFIRMED,
          subtotal,
          discountAmount: new Prisma.Decimal(0),
          taxAmount: new Prisma.Decimal(0),
          totalAmount,
          currency: 'USD',
          specialRequests: input.specialRequests,
          items: {
            create: input.items.map((i) => ({
              tourPackageId: i.tourPackageId,
              tourScheduleId: i.tourScheduleId,
              hotelId: i.hotelId,
              activityId: i.activityId,
              itemTitle: i.itemTitle,
              unitPrice: new Prisma.Decimal(i.unitPrice),
              quantity: i.quantity || 1,
              totalPrice: new Prisma.Decimal(i.unitPrice).mul(i.quantity || 1),
              startDate: i.startDate ? new Date(i.startDate) : null,
              endDate: i.endDate ? new Date(i.endDate) : null,
            })),
          },
          payments: {
            create: {
              paymentReference: `PAY-${Date.now().toString(36).toUpperCase()}`,
              userId,
              amount: totalAmount,
              currency: 'USD',
              status: PaymentStatus.SUCCEEDED,
              paidAt: new Date(),
            },
          },
        },
        include: {
          items: true,
          payments: true,
          user: true,
        },
      });

      return this.formatBooking(booking);
    });
  }
}
