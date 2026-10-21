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
