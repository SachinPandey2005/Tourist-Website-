# PostgreSQL Database Architecture & Prisma Schema (Phase 2)

## 1. Overview
The database layer is built on **PostgreSQL** using **Prisma ORM** as the schema declaration, query generator, and migration engine. The architecture adheres to third-normal-form (3NF) relational design principles with specialized design patterns for e-commerce, auditing, and high-concurrency availability.

---

## 2. Complete Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Booking : "places (RESTRICT)"
    User ||--o{ Payment : "makes (RESTRICT)"
    User ||--o{ Review : "writes (CASCADE)"
    User ||--o{ Favorite : "saves (CASCADE)"

    Destination ||--o{ TourPackage : "offers (CASCADE)"
    Destination ||--o{ Hotel : "contains (CASCADE)"
    Destination ||--o{ Activity : "hosts (CASCADE)"
    Destination ||--o{ Review : "receives (CASCADE)"
    Destination ||--o{ Favorite : "bookmarked_as (CASCADE)"

    TourPackage ||--o{ TourSchedule : "schedules (CASCADE)"
    TourPackage ||--o{ BookingItem : "booked_in (SET_NULL)"
    TourPackage ||--o{ Review : "rated_in (CASCADE)"
    TourPackage ||--o{ Favorite : "saved_as (CASCADE)"

    TourSchedule ||--o{ BookingItem : "reserves (SET_NULL)"

    Hotel ||--o{ BookingItem : "booked_in (SET_NULL)"
    Activity ||--o{ BookingItem : "booked_in (SET_NULL)"

    Coupon ||--o{ Booking : "applies_to (SET_NULL)"

    Booking ||--|{ BookingItem : "contains (CASCADE)"
    Booking ||--o{ Payment : "settled_via (RESTRICT)"

    User {
        uuid id PK
        string email UK
        string passwordHash
        string name
        string phoneNumber
        string avatarUrl
        enum role "ADMIN | GUIDE | TOURIST"
        boolean isEmailVerified
        datetime createdAt
        datetime updatedAt
    }

    Destination {
        uuid id PK
        string title
        string slug UK
        text description
        string shortDescription
        string country
        string city
        string location
        float latitude
        float longitude
        enum category "BEACH | MOUNTAIN | HISTORICAL | ADVENTURE | URBAN | CULTURAL | NATURE | WILDLIFE"
        string imageUrl
        stringArray galleryImages
        float rating
        int reviewCount
        boolean isFeatured
        datetime createdAt
        datetime updatedAt
    }

    TourPackage {
        uuid id PK
        uuid destinationId FK
        string title
        string slug UK
        text description
        stringArray highlights
        int durationDays
        int durationNights
        decimal basePrice
        decimal discountPrice
        int maxGroupSize
        enum difficulty "EASY | MODERATE | CHALLENGING | DIFFICULT"
        string featuredImage
        stringArray galleryImages
        float rating
        int reviewCount
        boolean isPublished
        datetime createdAt
        datetime updatedAt
    }

    TourSchedule {
        uuid id PK
        uuid tourPackageId FK
        datetime startDate
        datetime endDate
        decimal price
        int totalCapacity
        int bookedCapacity
        enum status "AVAILABLE | ALMOST_FULL | SOLD_OUT | CANCELLED"
        datetime createdAt
        datetime updatedAt
    }

    Hotel {
        uuid id PK
        uuid destinationId FK
        string name
        string slug UK
        text description
        string address
        int starRating
        decimal pricePerNight
        stringArray amenities
        string imageUrl
        datetime createdAt
        datetime updatedAt
    }

    Activity {
        uuid id PK
        uuid destinationId FK
        string name
        string slug UK
        text description
        float durationHours
        decimal price
        string imageUrl
        datetime createdAt
        datetime updatedAt
    }

    Coupon {
        uuid id PK
        string code UK
        string description
        enum discountType "PERCENTAGE | FIXED_AMOUNT"
        decimal discountValue
        decimal minBookingAmount
        decimal maxDiscountAmount
        int maxUses
        int usedCount
        datetime startDate
        datetime endDate
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    Booking {
        uuid id PK
        string bookingReference UK
        uuid userId FK
        uuid couponId FK
        enum status "PENDING | CONFIRMED | CANCELLED | COMPLETED"
        decimal subtotal
        decimal discountAmount
        decimal taxAmount
        decimal totalAmount
        string currency
        text specialRequests
        datetime createdAt
        datetime updatedAt
    }

    BookingItem {
        uuid id PK
        uuid bookingId FK
        uuid tourPackageId FK
        uuid tourScheduleId FK
        uuid hotelId FK
        uuid activityId FK
        string itemTitle "Immutable snapshot"
        decimal unitPrice "Immutable snapshot"
        int quantity
        decimal totalPrice
        datetime startDate
        datetime endDate
        datetime createdAt
    }

    Payment {
        uuid id PK
        string paymentReference UK
        uuid bookingId FK
        uuid userId FK
        decimal amount
        string currency
        enum status "PENDING | SUCCEEDED | FAILED | REFUNDED"
        enum method "CREDIT_CARD | DEBIT_CARD | PAYPAL | STRIPE | BANK_TRANSFER"
        string gatewayTransactionId
        text gatewayResponse
        datetime paidAt
        datetime createdAt
        datetime updatedAt
    }

    Review {
        uuid id PK
        uuid userId FK
        uuid destinationId FK
        uuid tourPackageId FK
        int rating
        string title
        text comment
        boolean isVerifiedBooking
        datetime createdAt
        datetime updatedAt
    }

    Favorite {
        uuid id PK
        uuid userId FK
        uuid destinationId FK
        uuid tourPackageId FK
        datetime createdAt
    }
```

---

## 3. Core Architectural Patterns

### 1. Reliable Historical Snapshot Pattern (`BookingItem`)
When booking a tour, hotel, or activity, prices and descriptions may change in the future. To prevent historical receipts from mutating:
- Each `BookingItem` stores an immutable snapshot of `itemTitle`, `unitPrice`, `quantity`, and `totalPrice`.
- Foreign keys (`tourPackageId`, `tourScheduleId`, `hotelId`, `activityId`) use `onDelete: SetNull`. If a catalog package is discontinued, historical booking invoices remain 100% intact and auditable.

### 2. Separation of Payment and Booking Status
Booking lifecycle (`BookingStatus`: `PENDING` -> `CONFIRMED` -> `COMPLETED`) is decoupled from transaction lifecycle (`PaymentStatus`: `PENDING` -> `SUCCEEDED` -> `REFUNDED`):
- Supports split payments, deposits, installment plans, and transaction retries without corrupting booking state.
- Preserves complete payment attempts, gateway reference IDs, and responses for auditing.

### 3. Deletion & Financial Audit Protection
- `User` records referenced by `Booking` or `Payment` are protected with `onDelete: Restrict`. User accounts tied to financial ledgers cannot be accidentally dropped.
- `Booking` records referenced by `Payment` use `onDelete: Restrict`. Payments cannot be orphaned.

### 4. Decimal Precision for Financial Integrity
All prices and currency totals utilize PostgreSQL fixed-precision `DECIMAL(10, 2)`:
- Eliminates floating-point rounding errors (e.g. `0.1 + 0.2 != 0.3`).
- Supports transaction amounts up to $99,999,999.99 with exact cent precision.

### 5. High-Performance Indexing Strategy
- **Unique Indexes**: `users(email)`, `destinations(slug)`, `tour_packages(slug)`, `bookings(bookingReference)`, `payments(paymentReference)`, `coupons(code)`.
- **Search & Filter Indexes**: `destinations(category, country, isFeatured)`, `tour_packages(basePrice, isPublished)`.
- **Composite Date Indexes**: `tour_schedules(tourPackageId, startDate)`, `coupons(isActive, startDate, endDate)`.
- **Foreign Key Query Indexes**: Added on all child relations to optimize join execution plans.

---

## 4. Migration & Seeding Workflows

### Environment Setup
Ensure `DATABASE_URL` is configured in `apps/api/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tourist_db?schema=public"
```

### 1. Generate Prisma Client
Generates the type-safe client reflecting the latest models:
```bash
npm run prisma:generate
```

### 2. Apply Migrations
The initial Phase 2 migration SQL is generated at `apps/api/prisma/migrations/20261018000000_init_phase2_schema/migration.sql`.
To apply pending migrations to a running PostgreSQL database:
```bash
# During development
npm run prisma:migrate

# In production / CI/CD
npx --prefix apps/api prisma migrate deploy
```

### 3. Execute Development Seed Script
Populates verified global destinations (Kyoto, Swiss Alps, Santorini, Serengeti), tour packages, schedules, accommodations, activities, and coupons:
```bash
npm run prisma:seed
```

### 4. Interactive Database GUI
To inspect records visually via Prisma Studio:
```bash
npx --prefix apps/api prisma studio
```
