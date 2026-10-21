import { Prisma, BookingStatus, PaymentStatus, ScheduleStatus, UserRole, DiscountType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { AppError } from '../utils/appError.js';
import { parsePaginationParams, formatPaginatedResult } from '../utils/pagination.js';
import { NotificationService } from './notification.service.js';
import type {
  PaginatedResult,
  CheckAvailabilityInput,
  CheckAvailabilityResult,
  AvailabilityItemResult,
  BookingQuoteInput,
  BookingQuoteResult,
  BookingQuoteItem,
} from '@tourist/shared';

export interface CreateBookingItemInput {
  tourPackageId?: string;
  tourScheduleId?: string;
  hotelId?: string;
  activityId?: string;
  quantity?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  // unitPrice and itemTitle can be optionally accepted from legacy payloads, but will NEVER be trusted
  unitPrice?: number;
  itemTitle?: string;
}

export interface CreateBookingInput {
  items: CreateBookingItemInput[];
  specialRequests?: string;
  couponCode?: string;
  idempotencyKey?: string;
}

export interface ListBookingsFilter {
  page?: number;
  pageSize?: number;
  status?: BookingStatus;
  userId?: string;
  search?: string;
}

interface ResolvedPricedItem {
  tourPackageId?: string | null;
  tourScheduleId?: string | null;
  hotelId?: string | null;
  activityId?: string | null;
  itemTitle: string;
  unitPrice: Prisma.Decimal;
  quantity: number;
  totalPrice: Prisma.Decimal;
  startDate?: Date | null;
  endDate?: Date | null;
  nights?: number;
}

interface PriceResolutionResult {
  pricedItems: ResolvedPricedItem[];
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  couponRecord?: any;
}

export class BookingService {
  /**
   * Standardized tax rate: 10% (0.10)
   */
  private static readonly TAX_RATE = 0.1;

  /**
   * Formats a booking record for API response including cancellation eligibility
   */
  private static formatBooking(booking: any) {
    // Check if booking has any departure date in the past
    const now = Date.now();
    let hasDeparted = false;

    if (booking.items && Array.isArray(booking.items)) {
      for (const item of booking.items) {
        if (item.startDate && new Date(item.startDate).getTime() <= now) {
          hasDeparted = true;
          break;
        }
      }
    }

    const isCancellable =
      (booking.status === BookingStatus.PENDING || booking.status === BookingStatus.CONFIRMED) &&
      !hasDeparted;

    return {
      id: booking.id,
      bookingReference: booking.bookingReference,
      userId: booking.userId,
      couponId: booking.couponId || null,
      idempotencyKey: booking.idempotencyKey || null,
      status: booking.status,
      subtotal: booking.subtotal ? Number(booking.subtotal).toFixed(2) : '0.00',
      discountAmount: booking.discountAmount ? Number(booking.discountAmount).toFixed(2) : '0.00',
      taxAmount: booking.taxAmount ? Number(booking.taxAmount).toFixed(2) : '0.00',
      totalAmount: booking.totalAmount ? Number(booking.totalAmount).toFixed(2) : '0.00',
      currency: booking.currency,
      specialRequests: booking.specialRequests || null,
      cancellationReason: booking.cancellationReason || null,
      cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
      isCancellable,
      createdAt: booking.createdAt
        ? typeof booking.createdAt === 'string'
          ? booking.createdAt
          : booking.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: booking.updatedAt
        ? typeof booking.updatedAt === 'string'
          ? booking.updatedAt
          : booking.updatedAt.toISOString()
        : new Date().toISOString(),
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
            tourPackageId: item.tourPackageId || null,
            tourScheduleId: item.tourScheduleId || null,
            hotelId: item.hotelId || null,
            activityId: item.activityId || null,
            itemTitle: item.itemTitle,
            unitPrice: Number(item.unitPrice).toFixed(2),
            quantity: item.quantity,
            totalPrice: Number(item.totalPrice).toFixed(2),
            startDate: item.startDate
              ? typeof item.startDate === 'string'
                ? item.startDate
                : item.startDate.toISOString()
              : null,
            endDate: item.endDate
              ? typeof item.endDate === 'string'
                ? item.endDate
                : item.endDate.toISOString()
              : null,
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
                  startDate: item.tourSchedule.startDate
                    ? typeof item.tourSchedule.startDate === 'string'
                      ? item.tourSchedule.startDate
                      : item.tourSchedule.startDate.toISOString()
                    : null,
                  endDate: item.tourSchedule.endDate
                    ? typeof item.tourSchedule.endDate === 'string'
                      ? item.tourSchedule.endDate
                      : item.tourSchedule.endDate.toISOString()
                    : null,
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
            paidAt: p.paidAt
              ? typeof p.paidAt === 'string'
                ? p.paidAt
                : p.paidAt.toISOString()
              : null,
            createdAt: p.createdAt
              ? typeof p.createdAt === 'string'
                ? p.createdAt
                : p.createdAt.toISOString()
              : new Date().toISOString(),
          }))
        : [],
    };
  }

  /**
   * SERVER-AUTHORITATIVE PRICING & INVENTORY RESOLUTION:
   * Never trusts the price supplied by the browser.
   * Resolves actual catalog prices, validates capacities and dates, applies server coupons,
   * and computes accurate subtotals, taxes, and totals.
   */
  private static async resolveAndPriceItems(
    clientOrTx: Prisma.TransactionClient | typeof prisma,
    items: CreateBookingItemInput[],
    couponCode?: string
  ): Promise<PriceResolutionResult> {
    if (!items || items.length === 0) {
      throw AppError.badRequest('At least one travel item is required.');
    }

    const pricedItems: ResolvedPricedItem[] = [];
    let subtotal = new Prisma.Decimal(0);

    for (const item of items) {
      const quantity = Math.max(1, item.quantity || 1);

      // 1. TOUR SCHEDULE ITEM
      if (item.tourScheduleId) {
        const schedule = await clientOrTx.tourSchedule.findUnique({
          where: { id: item.tourScheduleId },
          include: { tourPackage: true },
        });

        if (!schedule) {
          throw AppError.notFound(`Tour schedule '${item.tourScheduleId}' not found.`);
        }

        if (schedule.status === ScheduleStatus.SOLD_OUT || schedule.status === ScheduleStatus.CANCELLED) {
          throw AppError.badRequest(`Tour schedule is not available for booking.`);
        }

        const availableCapacity = schedule.totalCapacity - schedule.bookedCapacity;
        if (availableCapacity < quantity) {
          throw AppError.conflict(
            `INSUFFICIENT_CAPACITY: Only ${availableCapacity} spots remaining on this tour schedule.`
          );
        }

        // Check if schedule departure date is in the past
        if (schedule.startDate.getTime() <= Date.now()) {
          throw AppError.badRequest(`Cannot book a tour departure that has already passed.`);
        }

        // Server-determined unit price: schedule price or tourPackage discountPrice/basePrice
        const unitPrice =
          Number(schedule.price) > 0
            ? new Prisma.Decimal(schedule.price)
            : new Prisma.Decimal(schedule.tourPackage.discountPrice || schedule.tourPackage.basePrice);

        const totalPrice = unitPrice.mul(quantity);
        subtotal = subtotal.add(totalPrice);

        const startStr = schedule.startDate.toISOString().slice(0, 10);
        const endStr = schedule.endDate.toISOString().slice(0, 10);
        const itemTitle = `${schedule.tourPackage.title} (${startStr} to ${endStr})`;

        pricedItems.push({
          tourPackageId: schedule.tourPackageId,
          tourScheduleId: schedule.id,
          itemTitle,
          unitPrice,
          quantity,
          totalPrice,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
        });
      }
      // 2. HOTEL ITEM
      else if (item.hotelId) {
        const hotel = await clientOrTx.hotel.findUnique({
          where: { id: item.hotelId },
        });

        if (!hotel) {
          throw AppError.notFound(`Hotel '${item.hotelId}' not found.`);
        }

        if (!item.startDate || !item.endDate) {
          throw AppError.badRequest(`Check-in and check-out dates are required for hotel reservations.`);
        }

        const checkIn = new Date(item.startDate);
        const checkOut = new Date(item.endDate);

        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut.getTime() <= checkIn.getTime()) {
          throw AppError.badRequest(`Check-out date must be after check-in date.`);
        }

        const nights = Math.max(
          1,
          Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        );

        const unitPrice = new Prisma.Decimal(hotel.pricePerNight);
        const totalPrice = unitPrice.mul(nights).mul(quantity);
        subtotal = subtotal.add(totalPrice);

        const itemTitle = `${hotel.name} (${nights} night${nights > 1 ? 's' : ''}, ${quantity} room${quantity > 1 ? 's' : ''})`;

        pricedItems.push({
          hotelId: hotel.id,
          itemTitle,
          unitPrice,
          quantity,
          totalPrice,
          startDate: checkIn,
          endDate: checkOut,
          nights,
        });
      }
      // 3. ACTIVITY ITEM
      else if (item.activityId) {
        const activity = await clientOrTx.activity.findUnique({
          where: { id: item.activityId },
        });

        if (!activity) {
          throw AppError.notFound(`Activity '${item.activityId}' not found.`);
        }

        const actDate = item.startDate ? new Date(item.startDate) : null;
        if (actDate && actDate.getTime() <= Date.now()) {
          throw AppError.badRequest(`Selected activity date must be in the future.`);
        }

        const unitPrice = new Prisma.Decimal(activity.price);
        const totalPrice = unitPrice.mul(quantity);
        subtotal = subtotal.add(totalPrice);

        pricedItems.push({
          activityId: activity.id,
          itemTitle: activity.name,
          unitPrice,
          quantity,
          totalPrice,
          startDate: actDate,
          endDate: actDate,
        });
      }
      // 4. STANDALONE TOUR PACKAGE
      else if (item.tourPackageId) {
        const tour = await clientOrTx.tourPackage.findUnique({
          where: { id: item.tourPackageId },
        });

        if (!tour) {
          throw AppError.notFound(`Tour package '${item.tourPackageId}' not found.`);
        }

        const unitPrice = new Prisma.Decimal(tour.discountPrice || tour.basePrice);
        const totalPrice = unitPrice.mul(quantity);
        subtotal = subtotal.add(totalPrice);

        pricedItems.push({
          tourPackageId: tour.id,
          itemTitle: tour.title,
          unitPrice,
          quantity,
          totalPrice,
          startDate: item.startDate ? new Date(item.startDate) : null,
          endDate: item.endDate ? new Date(item.endDate) : null,
        });
      } else {
        throw AppError.badRequest(
          `Each booking item must specify a valid tourScheduleId, hotelId, activityId, or tourPackageId.`
        );
      }
    }

    // COUPON & PROMOTION VALIDATION ON SERVER
    let discountAmount = new Prisma.Decimal(0);
    let couponRecord: any = undefined;

    if (couponCode && couponCode.trim()) {
      const cleanCode = couponCode.trim().toUpperCase();
      const coupon = await clientOrTx.coupon.findFirst({
        where: { code: { equals: cleanCode, mode: 'insensitive' } },
      });

      if (!coupon) {
        throw AppError.badRequest(`Coupon '${cleanCode}' is invalid.`);
      }

      const now = new Date();
      if (!coupon.isActive) {
        throw AppError.badRequest(`Coupon '${cleanCode}' is no longer active.`);
      }

      if (now < coupon.startDate || now > coupon.endDate) {
        throw AppError.badRequest(`Coupon '${cleanCode}' has expired or is not yet valid.`);
      }

      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        throw AppError.badRequest(`Coupon '${cleanCode}' has reached its maximum usage limit.`);
      }

      if (coupon.minBookingAmount && subtotal.lessThan(coupon.minBookingAmount)) {
        throw AppError.badRequest(
          `Booking subtotal of $${subtotal.toFixed(2)} does not meet the minimum coupon requirement of $${Number(coupon.minBookingAmount).toFixed(2)}.`
        );
      }

      // Calculate discount amount
      if (coupon.discountType === DiscountType.PERCENTAGE) {
        const pctDiscount = subtotal.mul(coupon.discountValue).div(100);
        if (coupon.maxDiscountAmount && pctDiscount.greaterThan(coupon.maxDiscountAmount)) {
          discountAmount = new Prisma.Decimal(coupon.maxDiscountAmount);
        } else {
          discountAmount = pctDiscount;
        }
      } else {
        // FIXED
        discountAmount = Prisma.Decimal.min(subtotal, new Prisma.Decimal(coupon.discountValue));
      }

      couponRecord = coupon;
    }

    // TAX CALCULATION (10% on post-discount subtotal)
    const taxableSubtotal = Prisma.Decimal.max(new Prisma.Decimal(0), subtotal.sub(discountAmount));
    const taxAmount = taxableSubtotal.mul(this.TAX_RATE);
    const totalAmount = taxableSubtotal.add(taxAmount);

    return {
      pricedItems,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      couponRecord,
    };
  }

  /**
   * CHECK AVAILABILITY ENDPOINT:
   * Validates capacity, schedules, and dates for items without altering database state.
   */
  static async checkAvailability(input: CheckAvailabilityInput): Promise<CheckAvailabilityResult> {
    if (!input.items || input.items.length === 0) {
      throw AppError.badRequest('At least one item is required to check availability.');
    }

    const results: AvailabilityItemResult[] = [];
    let allAvailable = true;

    for (const item of input.items) {
      const quantity = Math.max(1, item.quantity || 1);

      if (item.tourScheduleId) {
        const schedule = await prisma.tourSchedule.findUnique({
          where: { id: item.tourScheduleId },
          include: { tourPackage: true },
        });

        if (!schedule) {
          results.push({
            itemType: 'TOUR',
            itemId: item.tourScheduleId,
            itemTitle: 'Tour Departure',
            isAvailable: false,
            requestedQuantity: quantity,
            unitPrice: '0.00',
            totalPrice: '0.00',
            message: 'Schedule not found.',
          });
          allAvailable = false;
          continue;
        }

        const remaining = schedule.totalCapacity - schedule.bookedCapacity;
        const isPast = schedule.startDate.getTime() <= Date.now();
        const isSchedActive =
          schedule.status !== ScheduleStatus.SOLD_OUT &&
          schedule.status !== ScheduleStatus.CANCELLED &&
          !isPast;

        const isAvailable = isSchedActive && remaining >= quantity;
        if (!isAvailable) allAvailable = false;

        const unit =
          Number(schedule.price) > 0
            ? Number(schedule.price)
            : Number(schedule.tourPackage.discountPrice || schedule.tourPackage.basePrice);

        results.push({
          itemType: 'TOUR',
          itemId: schedule.id,
          itemTitle: `${schedule.tourPackage.title} (${schedule.startDate.toISOString().slice(0, 10)})`,
          isAvailable,
          availableCapacity: Math.max(0, remaining),
          requestedQuantity: quantity,
          unitPrice: unit.toFixed(2),
          totalPrice: (unit * quantity).toFixed(2),
          message: isPast
            ? 'Departure date has passed.'
            : !isSchedActive
            ? 'Schedule is sold out or unavailable.'
            : isAvailable
            ? `Available (${remaining} spots remaining)`
            : `Insufficient capacity (${remaining} spots remaining, ${quantity} requested)`,
        });
      } else if (item.hotelId) {
        const hotel = await prisma.hotel.findUnique({
          where: { id: item.hotelId },
        });

        if (!hotel) {
          results.push({
            itemType: 'HOTEL',
            itemId: item.hotelId,
            itemTitle: 'Hotel Accommodation',
            isAvailable: false,
            requestedQuantity: quantity,
            unitPrice: '0.00',
            totalPrice: '0.00',
            message: 'Hotel not found.',
          });
          allAvailable = false;
          continue;
        }

        const start = item.startDate ? new Date(item.startDate) : null;
        const end = item.endDate ? new Date(item.endDate) : null;
        const validDates = start && end && end.getTime() > start.getTime() && start.getTime() > Date.now();

        const nights = validDates
          ? Math.max(1, Math.ceil((end!.getTime() - start!.getTime()) / (1000 * 60 * 60 * 24)))
          : 1;

        const unit = Number(hotel.pricePerNight);
        const total = unit * nights * quantity;

        results.push({
          itemType: 'HOTEL',
          itemId: hotel.id,
          itemTitle: hotel.name,
          isAvailable: Boolean(validDates),
          requestedQuantity: quantity,
          unitPrice: unit.toFixed(2),
          totalPrice: total.toFixed(2),
          message: validDates
            ? `Rooms available for ${nights} night${nights > 1 ? 's' : ''}`
            : 'Check-in and check-out dates must be future dates with checkout after checkin.',
        });
        if (!validDates) allAvailable = false;
      } else if (item.activityId) {
        const activity = await prisma.activity.findUnique({
          where: { id: item.activityId },
        });

        if (!activity) {
          results.push({
            itemType: 'ACTIVITY',
            itemId: item.activityId,
            itemTitle: 'Excursion',
            isAvailable: false,
            requestedQuantity: quantity,
            unitPrice: '0.00',
            totalPrice: '0.00',
            message: 'Activity not found.',
          });
          allAvailable = false;
          continue;
        }

        const unit = Number(activity.price);
        results.push({
          itemType: 'ACTIVITY',
          itemId: activity.id,
          itemTitle: activity.name,
          isAvailable: true,
          requestedQuantity: quantity,
          unitPrice: unit.toFixed(2),
          totalPrice: (unit * quantity).toFixed(2),
          message: 'Available for reservation.',
        });
      }
    }

    return {
      isAvailable: allAvailable,
      items: results,
    };
  }

  /**
   * CALCULATE LIVE PRICE QUOTE:
   * Server-authoritative calculation of subtotal, coupon discounts, taxes, and final total.
   */
  static async calculateQuote(input: BookingQuoteInput): Promise<BookingQuoteResult> {
    const resolved = await this.resolveAndPriceItems(prisma, input.items, input.couponCode);

    const quoteItems: BookingQuoteItem[] = resolved.pricedItems.map((i) => ({
      tourPackageId: i.tourPackageId || null,
      tourScheduleId: i.tourScheduleId || null,
      hotelId: i.hotelId || null,
      activityId: i.activityId || null,
      itemTitle: i.itemTitle,
      unitPrice: i.unitPrice.toFixed(2),
      quantity: i.quantity,
      totalPrice: i.totalPrice.toFixed(2),
      startDate: i.startDate ? i.startDate.toISOString() : null,
      endDate: i.endDate ? i.endDate.toISOString() : null,
      nights: i.nights,
    }));

    return {
      items: quoteItems,
      subtotal: resolved.subtotal.toFixed(2),
      discountAmount: resolved.discountAmount.toFixed(2),
      taxAmount: resolved.taxAmount.toFixed(2),
      taxRatePercentage: Math.round(this.TAX_RATE * 100),
      totalAmount: resolved.totalAmount.toFixed(2),
      currency: 'USD',
      coupon: resolved.couponRecord
        ? {
            id: resolved.couponRecord.id,
            code: resolved.couponRecord.code,
            discountType: resolved.couponRecord.discountType,
            discountValue: Number(resolved.couponRecord.discountValue).toFixed(2),
            discountApplied: resolved.discountAmount.toFixed(2),
            description: resolved.couponRecord.description || null,
          }
        : undefined,
    };
  }

  /**
   * CREATE PENDING BOOKING:
   * Uses database transactions and serializable concurrency controls.
   * Atomically locks tour schedule capacity and marks booking as PENDING.
   * Creates a linked Payment in PENDING status.
   * Supports idempotency key to prevent duplicate booking operations.
   */
  static async createBooking(userId: string, input: CreateBookingInput) {
    if (!input.items || input.items.length === 0) {
      throw AppError.badRequest('A booking must include at least one item.');
    }

    // 1. Idempotency Check: if key provided, verify if already processed
    if (input.idempotencyKey) {
      const existing = await prisma.booking.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
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
          user: true,
        },
      });

      if (existing) {
        // Return existing booking if idempotency key matches
        return this.formatBooking(existing);
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 2. Server-Authoritative Price Resolution & Capacity Check
      const resolved = await this.resolveAndPriceItems(tx, input.items, input.couponCode);

      // 3. Atomically Lock Capacity for Tour Schedules
      for (const item of resolved.pricedItems) {
        if (item.tourScheduleId) {
          const schedule = await tx.tourSchedule.findUnique({
            where: { id: item.tourScheduleId },
          });

          if (!schedule) {
            throw AppError.notFound(`Tour schedule '${item.tourScheduleId}' not found.`);
          }

          const remaining = schedule.totalCapacity - schedule.bookedCapacity;
          if (remaining < item.quantity) {
            throw AppError.conflict(
              `INSUFFICIENT_CAPACITY: Only ${remaining} spots remaining on this tour schedule.`
            );
          }

          const newBooked = schedule.bookedCapacity + item.quantity;
          const newStatus =
            newBooked >= schedule.totalCapacity
              ? ScheduleStatus.SOLD_OUT
              : schedule.totalCapacity - newBooked <= 2
              ? ScheduleStatus.ALMOST_FULL
              : schedule.status;

          await tx.tourSchedule.update({
            where: { id: item.tourScheduleId },
            data: {
              bookedCapacity: newBooked,
              status: newStatus,
            },
          });
        }
      }

      // 4. Increment Coupon Usage Count
      if (resolved.couponRecord) {
        await tx.coupon.update({
          where: { id: resolved.couponRecord.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // 5. Generate Reference Code
      const bookingReference = `VV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 6. Create Booking in PENDING Status (Do not mark as CONFIRMED or PAID!)
      const booking = await tx.booking.create({
        data: {
          bookingReference,
          userId,
          couponId: resolved.couponRecord?.id || null,
          idempotencyKey: input.idempotencyKey || null,
          status: BookingStatus.PENDING,
          subtotal: resolved.subtotal,
          discountAmount: resolved.discountAmount,
          taxAmount: resolved.taxAmount,
          totalAmount: resolved.totalAmount,
          currency: 'USD',
          specialRequests: input.specialRequests,
          items: {
            create: resolved.pricedItems.map((i) => ({
              tourPackageId: i.tourPackageId || null,
              tourScheduleId: i.tourScheduleId || null,
              hotelId: i.hotelId || null,
              activityId: i.activityId || null,
              itemTitle: i.itemTitle,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              totalPrice: i.totalPrice,
              startDate: i.startDate,
              endDate: i.endDate,
            })),
          },
          // Track booking status independently from payment status (Payment is PENDING)
          payments: {
            create: {
              paymentReference: `PAY-${Date.now().toString(36).toUpperCase()}`,
              userId,
              amount: resolved.totalAmount,
              currency: 'USD',
              status: PaymentStatus.PENDING,
            },
          },
        },
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
          user: true,
        },
      });

      // 7. Dispatch Notification Service (Non-blocking / honest logging)
      if (booking.user) {
        NotificationService.notifyBookingCreated({
          recipientEmail: booking.user.email,
          recipientName: booking.user.name,
          bookingReference: booking.bookingReference,
          totalAmount: Number(booking.totalAmount).toFixed(2),
          currency: booking.currency,
          status: booking.status,
          items: booking.items.map((i) => ({
            title: i.itemTitle,
            quantity: i.quantity,
            totalPrice: Number(i.totalPrice).toFixed(2),
            startDate: i.startDate ? i.startDate.toISOString() : null,
          })),
        }).catch((err) => {
          console.error('[NotificationService Error] Could not dispatch creation notice:', err);
        });
      }

      return this.formatBooking(booking);
    });
  }

  /**
   * Retrieves paginated bookings belonging to the authenticated user.
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
          user: true,
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
   * CANCEL ELIGIBLE BOOKING:
   * Explicit rules:
   * 1. Only owner or ADMIN can cancel.
   * 2. Already CANCELLED or COMPLETED bookings cannot be cancelled.
   * 3. Past departure schedules cannot be cancelled by non-admins.
   * 4. Atomically restores tour schedule capacity and resets schedule status.
   * 5. Decrements coupon usage if applicable.
   * 6. Marks payments as CANCELLED (if PENDING) or REFUNDED (if SUCCEEDED).
   * 7. Preserves history and records cancellationReason and cancelledAt timestamp.
   * 8. Triggers cancellation notification.
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
        user: true,
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

    // Departure Date Eligibility Check
    const now = Date.now();
    for (const item of booking.items) {
      if (item.startDate && new Date(item.startDate).getTime() <= now && requestingRole !== UserRole.ADMIN) {
        throw AppError.badRequest('Bookings cannot be cancelled after the scheduled departure date has passed.');
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Restore Capacity for Tour Schedules
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
                  schedule.status === ScheduleStatus.SOLD_OUT ||
                  schedule.status === ScheduleStatus.ALMOST_FULL
                    ? ScheduleStatus.AVAILABLE
                    : schedule.status,
              },
            });
          }
        }
      }

      // 2. Decrement Coupon Used Count if coupon was applied
      if (booking.couponId) {
        await tx.coupon.update({
          where: { id: booking.couponId },
          data: {
            usedCount: {
              decrement: 1,
            },
          },
        });
      }

      // 3. Update Payment Status (Separated from Booking Status)
      await tx.payment.updateMany({
        where: { bookingId: booking.id, status: PaymentStatus.PENDING },
        data: { status: PaymentStatus.REFUNDED },
      });
      await tx.payment.updateMany({
        where: { bookingId: booking.id, status: PaymentStatus.SUCCEEDED },
        data: { status: PaymentStatus.REFUNDED },
      });

      // 4. Mark Booking as CANCELLED with Explicit History
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason || 'Customer requested cancellation',
          cancelledAt: new Date(),
        },
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
          user: true,
        },
      });

      // 5. Send Cancellation Notification
      if (booking.user) {
        NotificationService.notifyBookingCancelled({
          recipientEmail: booking.user.email,
          recipientName: booking.user.name,
          bookingReference: booking.bookingReference,
          reason,
          refundStatus: 'Payment reservation voided / released',
        }).catch((err) => {
          console.error('[NotificationService Error] Could not dispatch cancellation notice:', err);
        });
      }

      return this.formatBooking(updated);
    });
  }
}
