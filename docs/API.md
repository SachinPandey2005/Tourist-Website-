# REST API Documentation & Contracts (Phase 4 Authentication & Authorization)

## 1. Architectural Overview & Middleware Pipeline

The backend REST API is built with **Express.js**, **TypeScript**, and **Prisma ORM**, strictly following clean-architecture principles and separating HTTP declaration (`app.ts`) from server lifecycle & process orchestration (`server.ts`).

### Middleware Pipeline Execution Order
1. **Helmet**: Secures response HTTP headers against known web vulnerabilities (XSS, Clickjacking, MIME sniffing).
2. **CORS**: Enforces origin whitelisting (`CORS_ORIGIN`), credentials support, and explicit HTTP methods.
3. **Morgan Logger**: Structured request access logging (`dev` format in development, `combined` Apache format in production, silent in tests).
4. **Body Parsing**: Standard `express.json` with strict `1mb` maximum payload threshold preventing DOS attacks.
5. **Cookie Parser**: Signs and parses incoming HTTP-only cookies using `COOKIE_SECRET`.
6. **Rate Limiting**:
   - General API rate limiter (`RATE_LIMIT_MAX` requests / 15m).
   - Strict Auth rate limiter (`AUTH_RATE_LIMIT_MAX` attempts / 15m) on sensitive authentication endpoints (`/login`, `/register`, `/forgot-password`, `/reset-password`).
7. **Zod Validation**: Reusable request validator parsing and coercing `body`, `query`, and `params` before reaching controllers.
8. **Authentication (`authenticate`)**: Extracts and verifies JWT from Bearer header or HTTP-only cookies; validates `tokenVersion` against the database for instant session revocation.
9. **Authorization (`authorize`, `authorizeOwnerOrAdmin`)**: Role-based access control (RBAC) and resource ownership verification.
10. **Centralized Error Handler**: Translates operational exceptions to standard JSON envelopes and masks internal stack traces in production.

---

## 2. API Response & Error Envelopes

All endpoint responses conform to standard envelopes defined in `@tourist/shared`.

### Standard Success Envelope (`ApiResponseBuilder.success`)
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-10-21T12:00:00.000Z"
}
```

### Standard Error Envelope (`ApiResponseBuilder.error`)
```json
{
  "success": false,
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human readable explanation of the error",
    "details": []
  },
  "timestamp": "2026-10-21T12:00:00.000Z"
}
```

### Error Code Reference & Status Codes

| HTTP Status | Error Code | Description | Details Payload |
|---|---|---|---|
| `400 Bad Request` | `BAD_REQUEST` | Malformed syntax or invalid request format | Optional context |
| `400 Bad Request` | `INVALID_JSON` | Malformed JSON in request body | None |
| `400 Bad Request` | `INVALID_CURRENT_PASSWORD` | Current password verification failed | None |
| `400 Bad Request` | `INVALID_OR_EXPIRED_RESET_TOKEN` | Reset token is invalid, used, or expired | None |
| `401 Unauthorized` | `AUTH_TOKEN_MISSING` | Authentication token missing from header & cookie | None |
| `401 Unauthorized` | `TOKEN_EXPIRED` | JWT access token expired | None |
| `401 Unauthorized` | `TOKEN_INVALID` | JWT signature is invalid | None |
| `401 Unauthorized` | `SESSION_REVOKED` | User logged out or changed password (`tokenVersion` mismatch) | None |
| `401 Unauthorized` | `INVALID_CREDENTIALS` | Invalid email or password | None |
| `403 Forbidden` | `INSUFFICIENT_PERMISSIONS` | User does not have the required role (e.g. ADMIN) | None |
| `403 Forbidden` | `RESOURCE_OWNERSHIP_REQUIRED` | User attempted to access/mutate another user's profile | None |
| `404 Not Found` | `NOT_FOUND` | Route or resource does not exist | Unmatched path |
| `409 Conflict` | `EMAIL_ALREADY_EXISTS` | Email address is already registered | None |
| `422 Unprocessable` | `VALIDATION_ERROR` | Request validation failed | Array of `{ field, message, code }` |
| `429 Too Many Req` | `AUTH_RATE_LIMIT_EXCEEDED`| Brute-force protection triggered on auth routes | None |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Unexpected server failure | Stack trace (dev only; hidden in prod) |

---

## 3. Authentication & Authorization API Endpoints

### 3.1. `POST /api/auth/register`
Creates a new tourist account with bcrypt hashed password (12 rounds) and default `TOURIST` role.
- **Rate Limit**: Protected by `authRateLimiter`
- **Request Body**:
  ```json
  {
    "email": "traveler@example.com",
    "password": "SecurePassword123!",
    "name": "Alex Traveler",
    "phoneNumber": "+1-555-0199"
  }
  ```
- **Password Rules**: Minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
- **Response**: `201 Created` with user profile, JWT token, and `Set-Cookie: token=...; HttpOnly; SameSite=Lax`.

### 3.2. `POST /api/auth/login`
Authenticates email and password. Returns generic `INVALID_CREDENTIALS` on unknown email or incorrect password to prevent user enumeration.
- **Rate Limit**: Protected by `authRateLimiter` (10 attempts / 15m)
- **Request Body**:
  ```json
  {
    "email": "traveler@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK` with user profile, JWT token, and HttpOnly cookie.

### 3.3. `POST /api/auth/logout`
Revokes active session tokens by incrementing `tokenVersion` and clears the HTTP-only cookie.
- **Authentication**: Required (`authenticate`)
- **Response**: `200 OK` (`"Logged out successfully and revoked active sessions."`)

### 3.4. `GET /api/auth/profile` (or `GET /api/auth/me`)
Retrieves authenticated user's profile details.
- **Authentication**: Required (`authenticate`)
- **Response**: `200 OK` with sanitized `AuthUserDto` (excludes `passwordHash` and reset tokens).

### 3.5. `PATCH /api/auth/profile`
Updates profile information (`name`, `phoneNumber`, `avatarUrl`). Rejects attempts to alter `role`, `email`, or credentials.
- **Authentication**: Required (`authenticate`)
- **Request Body**:
  ```json
  {
    "name": "Alex Updated",
    "phoneNumber": "+1-555-9876",
    "avatarUrl": "https://images.unsplash.com/profile"
  }
  ```
- **Response**: `200 OK` with updated profile.

### 3.6. `POST /api/auth/change-password`
Changes current password. Increments `tokenVersion` to invalidate all other active sessions and issues a new token.
- **Authentication**: Required (`authenticate`)
- **Request Body**:
  ```json
  {
    "currentPassword": "SecurePassword123!",
    "newPassword": "NewSecurePassword456#",
    "confirmPassword": "NewSecurePassword456#"
  }
  ```
- **Response**: `200 OK` with updated user and fresh JWT.

### 3.7. `POST /api/auth/forgot-password`
Generates a cryptographically random, 15-minute expiring reset token. Stores the SHA-256 hash in the database and dispatches via `EmailService`.
- **Rate Limit**: Protected by `authRateLimiter`
- **Request Body**:
  ```json
  {
    "email": "traveler@example.com"
  }
  ```
- **Response**: `200 OK` with enumeration-resistant message. When `EMAIL_PROVIDER=console`, logs the token and URL to the server terminal.

### 3.8. `POST /api/auth/reset-password`
Resets the password using the raw reset token. Invalidates all active tokens by incrementing `tokenVersion`.
- **Rate Limit**: Protected by `authRateLimiter`
- **Request Body**:
  ```json
  {
    "token": "32-byte-hex-token",
    "newPassword": "BrandNewPassword789$"
  }
  ```
- **Response**: `200 OK` (`"Password successfully reset. Please log in with your new credentials."`)

---

## 4. Role-Based Access Control (RBAC) & Ownership Endpoints

### 4.1. `GET /api/admin/dashboard`
Restricted to users possessing the `ADMIN` role.
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
- **Response**: `200 OK` if Admin; `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`) if Tourist.

### 4.2. `GET /api/admin/users/:userId`
Resource ownership demonstration endpoint.
- **Access Rule**: Allowed if authenticated user has role `ADMIN` OR if `req.user.id === req.params.userId`.
- **Response**: `200 OK` if Owner or Admin; `403 Forbidden` (`RESOURCE_OWNERSHIP_REQUIRED`) if accessing another user's record.

---

## 5. System Health Check Endpoint

### `GET /api/health`
- **Response**: `200 OK` with operational telemetry:
  ```json
  {
    "status": "healthy",
    "uptime": 142,
    "timestamp": "2026-10-21T12:00:00.000Z",
    "environment": "development",
    "version": "0.1.0",
    "services": {
      "api": "healthy",
      "database": "connected"
    },
    "databaseLatencyMs": 3,
    "memoryUsageMb": 32.1
  }
  ```

---

## 6. Travel Discovery REST APIs (Phase 5)

All catalog endpoints enforce server-side filtering, sorting, pagination, and strict Zod validation. Database records are returned directly from PostgreSQL (Prisma ORM).

### 6.1. Destination APIs

#### `GET /api/destinations`
Lists destinations with multi-criteria filtering, search, and pagination.
- **Query Parameters**:
  - `page` (default: `1`), `pageSize` (default: `10`, max: `100`)
  - `search` / `q`: case-insensitive search across title, country, city, location, description
  - `category`: `BEACH` | `MOUNTAIN` | `HISTORICAL` | `ADVENTURE` | `URBAN` | `CULTURAL` | `NATURE` | `WILDLIFE`
  - `region`: matches location, country, or city
  - `country`, `city`: exact/partial match
  - `isFeatured`: `true` | `false`
  - `sortBy`: `title` | `rating` | `reviewCount` | `createdAt` | `country` (default: `createdAt`)
  - `sortOrder`: `asc` | `desc` (default: `desc`)
- **Example Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "30000000-0000-4000-a000-000000000003",
          "title": "Kyoto Cultural Heritage",
          "slug": "kyoto-cultural-heritage",
          "description": "Ancient temples, peaceful bamboo groves, and traditional tea ceremonies.",
          "country": "Japan",
          "city": "Kyoto",
          "location": "Kansai Region",
          "category": "CULTURAL",
          "imageUrl": "https://images.unsplash.com/kyoto.jpg",
          "rating": 4.92,
          "reviewCount": 42,
          "isFeatured": true
        }
      ],
      "pagination": { "page": 1, "pageSize": 10, "totalItems": 1, "totalPages": 1 }
    }
  }
  ```

#### `GET /api/destinations/:idOrSlug`
Retrieves destination details by UUID or slug with related tours, hotels, and activities previews.
- **Example**: `GET /api/destinations/kyoto-japan`
- **Response**: `200 OK` (or `404 Not Found` if missing)

#### Admin Destination CRUD
- **`POST /api/destinations`** (Admin only): Creates destination. Auto-generates unique slug if not provided. Returns `201 Created`.
- **`PATCH /api/destinations/:id`** (Admin only): Updates destination. Returns `200 OK`.
- **`DELETE /api/destinations/:id`** (Admin only): Deletes destination. Returns `200 OK`.

---

### 6.2. Tour Package & Schedule APIs

#### `GET /api/tours`
Lists tour packages with comprehensive travel discovery filters.
- **Query Parameters**:
  - `page`, `pageSize`, `sortBy` (`basePrice`, `rating`, `reviewCount`, `durationDays`, `createdAt`, `title`), `sortOrder`
  - `search` / `q`: text search across tour and destination titles/descriptions
  - `destinationId`, `destinationSlug`: filter by destination
  - `category`: destination category filter
  - `difficulty`: `EASY` | `MODERATE` | `CHALLENGING` | `DIFFICULT`
  - `minPrice`, `maxPrice`: numeric price bounds
  - `durationDays`, `minDuration`, `maxDuration`: duration in days
  - `hasAvailableSchedules`: `true` (filters tours with upcoming `AVAILABLE` schedules)
- **Response**: `200 OK` with paginated tours.

#### `GET /api/tours/:idOrSlug`
Retrieves full tour package details with upcoming schedules, destination details, and recent traveler reviews.

#### `GET /api/tours/:tourId/schedules`
Lists available departure dates, capacity, booked slots, and status (`AVAILABLE`, `ALMOST_FULL`, `SOLD_OUT`, `CANCELLED`).

#### Admin Tour & Schedule Operations
- **`POST /api/tours`** (Admin only): Creates tour package. Returns `201 Created`.
- **`PATCH /api/tours/:id`** (Admin only): Updates tour details. Returns `200 OK`.
- **`DELETE /api/tours/:id`** (Admin only): Deletes tour package. Returns `200 OK`.
- **`POST /api/tours/:tourId/schedules`** (Admin only): Adds new departure schedule.
- **`PATCH /api/tours/:tourId/schedules/:scheduleId`** (Admin only): Updates schedule capacity & status.
- **`DELETE /api/tours/:tourId/schedules/:scheduleId`** (Admin only): Deletes departure schedule.

---

### 6.3. Hotel APIs

#### `GET /api/hotels`
Lists accommodations with destination, star rating, price range, and facility filters.
- **Query Parameters**:
  - `destinationId`, `destinationSlug`
  - `minPrice`, `maxPrice` (per night)
  - `starRating` (1 to 5)
  - `amenities` (comma-separated list, e.g. `amenities=Onsen,WiFi`)
  - `sortBy` (`pricePerNight`, `starRating`, `name`, `createdAt`), `sortOrder`
- **Response**: `200 OK` with paginated accommodations.

#### `GET /api/hotels/:idOrSlug`
Retrieves hotel details with address, amenities, and parent destination.

#### Admin Hotel Operations
- **`POST /api/hotels`** (Admin only): Creates accommodation. Returns `201 Created`.
- **`PATCH /api/hotels/:id`** (Admin only): Updates accommodation. Returns `200 OK`.
- **`DELETE /api/hotels/:id`** (Admin only): Deletes accommodation. Returns `200 OK`.

---

### 6.4. Activity APIs

#### `GET /api/activities`
Lists excursions and activities with duration, category, and price filters.
- **Query Parameters**:
  - `destinationId`, `destinationSlug`, `category`
  - `minPrice`, `maxPrice`
  - `minDuration`, `maxDuration` (in hours)
  - `sortBy` (`price`, `durationHours`, `name`, `createdAt`), `sortOrder`
- **Response**: `200 OK` with paginated activities.

#### `GET /api/activities/:idOrSlug`
Retrieves activity details with duration hours, pricing, and destination.

#### Admin Activity Operations
- **`POST /api/activities`** (Admin only): Creates activity. Returns `201 Created`.
- **`PATCH /api/activities/:id`** (Admin only): Updates activity. Returns `200 OK`.
- **`DELETE /api/activities/:id`** (Admin only): Deletes activity. Returns `200 OK`.

---

### 6.5. Reviews & Ratings APIs

#### `GET /api/reviews`
Lists customer reviews for destinations or tour packages.
- **Query Parameters**:
  - `destinationId` (uuid)
  - `tourPackageId` (uuid)
  - `rating` (1 to 5)
  - `isVerifiedBooking` (boolean)
  - `page`, `pageSize`, `sortBy` (`createdAt`, `rating`), `sortOrder`

#### `GET /api/reviews/stats`
Calculates aggregated rating metrics and distribution.
- **Query Parameters**: `destinationId` or `tourPackageId`
- **Example Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "averageRating": 4.88,
      "totalReviews": 42,
      "ratingDistribution": {
        "1": 0,
        "2": 1,
        "3": 2,
        "4": 9,
        "5": 30
      }
    }
  }
  ```

#### `POST /api/reviews`
Allows authenticated travelers to submit a review for a destination or tour package.
- **Authentication**: Required (`authenticate`)
- **Booking Rules**:
  - The system checks `Booking` and `BookingItem` records for the authenticated user with status `CONFIRMED` or `COMPLETED`.
  - If a confirmed booking for the target tour (or destination) exists, the review is awarded `isVerifiedBooking: true`.
  - Prevents duplicate reviews from the same user on the same item (`409 Conflict`).
  - Automatically recalculates the parent destination or tour package's average `rating` and `reviewCount` in the database.
- **Request Body**:
  ```json
  {
    "destinationId": "30000000-0000-4000-a000-000000000003",
    "rating": 5,
    "title": "Unforgettable Kyoto experience!",
    "comment": "The sunrise over Arashiyama bamboo forest was breathtaking."
  }
  ```
- **Response**: `201 Created` with created review and verified status badge.

#### `DELETE /api/reviews/:id`
Allows review deletion. Restricted to the author of the review or an `ADMIN`. Automatically re-synchronizes the target item's average rating.

---

## 4. Payment Processing & Settlement APIs (Phase 10)

Phase 10 introduces a secure payment processing and settlement subsystem that coordinates between the inventory engine, gateway transaction lifecycle, and notifications.

### 4.1 Payment Lifecycle & State Machine Transitions

| Action / Event | Previous Payment Status | New Payment Status | Coupled Booking Status | Inventory / Schedule Action | Notification Dispatched |
|---|---|---|---|---|---|
| **Initialize Session** | None / `PENDING` | `PENDING` | `PENDING` | Retains locked reservation hold | None |
| **Settlement Succeeded** | `PENDING` | `SUCCEEDED` | `CONFIRMED` | Locked capacity confirmed | `Booking Confirmed & Boarding Voucher` |
| **Settlement Failed / Card Declined** | `PENDING` | `FAILED` | `PENDING` | Retains reservation hold until expiry | `Payment Failed Alert` |
| **Payment Refunded** | `SUCCEEDED` | `REFUNDED` | `CANCELLED` | Atomically releases booked seats back to `AVAILABLE` | `Booking Cancellation & Refund Confirmed` |

---

### 4.2 Endpoints Reference

#### `POST /api/payments/session`
Initializes a payment intent / checkout session for a pending booking.
- **Authentication**: Required (`authenticate`)
- **Request Body**:
  ```json
  {
    "bookingId": "40000000-0000-4000-a000-000000000004",
    "method": "CREDIT_CARD"
  }
  ```
- **Response (`200 OK` / `201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "paymentId": "50000000-0000-4000-a000-000000000005",
      "paymentReference": "PAY-2026-ABC123",
      "clientSecret": "pi_sec_mock_4000000000004_secret",
      "amount": "1320.00",
      "currency": "USD",
      "status": "PENDING",
      "bookingId": "40000000-0000-4000-a000-000000000004",
      "bookingReference": "VV-2026-999"
    }
  }
  ```

#### `POST /api/payments/process`
Directly processes credit card, PayPal, or bank transfer settlement.
- **Authentication**: Required (`authenticate`)
- **Card Decline Simulation**: Card numbers ending in `0002` or `0000` simulate issuing bank declines without external network dependencies.
- **Request Body**:
  ```json
  {
    "paymentId": "50000000-0000-4000-a000-000000000005",
    "paymentMethod": "CREDIT_CARD",
    "cardholderName": "Alice Traveler",
    "cardNumber": "4242424242424242",
    "expiryDate": "12/28",
    "cvv": "123"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "success": true,
      "paymentId": "50000000-0000-4000-a000-000000000005",
      "paymentReference": "PAY-2026-ABC123",
      "status": "SUCCEEDED",
      "bookingStatus": "CONFIRMED",
      "transactionId": "txn_mock_8819283",
      "message": "Payment verified and settled successfully."
    }
  }
  ```

#### `POST /api/payments/webhook`
Asynchronous payment gateway callback endpoint supporting webhook signature verification and idempotent replay protection.
- **Authentication**: Public endpoint (validated via `x-webhook-signature` or payload signature token)
- **Idempotency**: Duplicate delivery of `payment_intent.succeeded` returns `already_succeeded_idempotent` without double-crediting or duplicate voucher dispatch.
- **Request Body**:
  ```json
  {
    "event": "payment_intent.succeeded",
    "data": {
      "paymentReference": "PAY-2026-ABC123",
      "gatewayTransactionId": "wh_txn_live_9981",
      "amount": "1320.00",
      "currency": "USD",
      "status": "succeeded"
    },
    "timestamp": "2026-10-22T12:00:00.000Z"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "received": true,
      "paymentReference": "PAY-2026-ABC123",
      "bookingStatus": "CONFIRMED"
    }
  }
  ```

#### `GET /api/payments/:id`
Retrieves detailed payment transaction record.
- **Authentication**: Required (`authenticate`). Restricted to the booking owner or platform `ADMIN`.
- **Response (`200 OK`)**: Returns `PaymentDto`.

#### `POST /api/payments/:id/refund`
Issues a full payment refund, atomically transitions booking to `CANCELLED`, and releases tour schedule capacity back to availability.
- **Authentication**: Required (`authenticate`). Allowed for booking owner within cancellation policy or platform `ADMIN`.
- **Request Body**:
  ```json
  {
    "reason": "Severe weather cancellation refund"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "50000000-0000-4000-a000-000000000005",
      "paymentReference": "PAY-2026-ABC123",
      "status": "REFUNDED",
      "amount": "1320.00",
      "currency": "USD"
    }
  }
  ```


