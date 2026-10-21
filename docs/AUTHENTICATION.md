# Authentication & Authorization Architecture (Phase 4)

## 1. Overview

VoyageVista implements a defense-in-depth security model using **JWT (JSON Web Tokens)**, **HTTP-only SameSite cookies**, **bcrypt password hashing** (12 work factor rounds), **tokenVersion session revocation**, **Role-Based Access Control (RBAC)**, and **sliding-window brute-force rate limiting**.

---

## 2. Security Architecture Principles

1. **Zero Trust on Frontend Roles**:
   When registering via `POST /api/auth/register`, role fields submitted by clients are discarded. All accounts default securely to `UserRole.TOURIST` (or `UserRole.USER`). Admin promotions must happen through explicit administrative endpoints or database operations.
2. **Timing-Safe Password Verification & Non-Enumeration**:
   - Passwords are salted and hashed with `bcryptjs` using 12 salt rounds.
   - Login attempts returning failure always respond with a generic `401 Unauthorized` (`INVALID_CREDENTIALS`), whether the email does not exist or the password did not match.
   - Password reset requests (`POST /api/auth/forgot-password`) always respond with an identical generic success message to prevent user enumeration.
3. **Session Revocation via `tokenVersion`**:
   - Each `User` has an integer field `tokenVersion` (indexed in PostgreSQL).
   - The user's active `tokenVersion` is baked into the JWT claims (`{ userId, email, role, tokenVersion }`).
   - When a user logs out (`POST /api/auth/logout`), changes password (`POST /api/auth/change-password`), or resets password (`POST /api/auth/reset-password`), `tokenVersion` is incremented.
   - Any previously issued JWT tokens immediately fail authentication with `401 Unauthorized` (`SESSION_REVOKED`), terminating sessions across all devices instantly without requiring a stateful Redis store.
4. **Defense-in-Depth Cookie Security**:
   - Cookies are set with `httpOnly: true` (inaccessible to JavaScript, neutralizing XSS credential theft).
   - `sameSite: 'lax'` prevents CSRF on cross-origin requests while maintaining smooth top-level navigation.
   - `secure: true` in production ensures cookies are only transmitted over TLS/HTTPS.
   - Cookies are signed with `COOKIE_SECRET` to detect tampering.
   - Both HTTP-only cookies and standard `Authorization: Bearer <token>` headers are supported, enabling web browsers and mobile apps to authenticate cleanly.
5. **Brute-Force Attack Mitigation**:
   - Sensitive endpoints (`/login`, `/register`, `/forgot-password`, `/reset-password`) are guarded by `authRateLimiter`, restricting requests to a maximum of 10 requests per 15-minute sliding window per IP address.
   - When exceeded, returns `429 Too Many Requests` (`AUTH_RATE_LIMIT_EXCEEDED`).

---

## 3. Authentication & Authorization Flows

### 3.1. Registration Flow
```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Express as Express (authRateLimiter)
    participant Validator as Zod Validator
    participant Service as AuthService
    participant DB as PostgreSQL (Prisma)

    Client->>Express: POST /api/auth/register { email, password, name }
    Express->>Validator: Validate RegisterSchema
    Validator-->>Express: Validation Passed
    Express->>Service: register(validatedData)
    Service->>DB: prisma.user.findUnique({ email })
    alt Email already taken
        DB-->>Service: Existing user
        Service-->>Express: 409 Conflict (EMAIL_ALREADY_EXISTS)
        Express-->>Client: 409 Conflict
    else Email available
        DB-->>Service: null
        Service->>Service: hashPassword(password, 12 rounds)
        Service->>DB: prisma.user.create({ role: TOURIST, tokenVersion: 0, ... })
        DB-->>Service: Created User
        Service->>Service: generateToken({ userId, role, tokenVersion: 0 })
        Service-->>Express: { user (sanitized), token }
        Express-->>Client: 201 Created + Set-Cookie: token=... (HttpOnly)
    end
```

### 3.2. Login & Token Verification Flow
```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Express as Express (authRateLimiter)
    participant Service as AuthService
    participant DB as PostgreSQL (Prisma)

    Client->>Express: POST /api/auth/login { email, password }
    Express->>Service: login(email, password)
    Service->>DB: prisma.user.findUnique({ email })
    alt User not found OR password mismatch
        Service-->>Express: 401 Unauthorized (INVALID_CREDENTIALS)
        Express-->>Client: 401 Unauthorized
    else Valid Credentials
        Service->>Service: generateToken({ userId, role, tokenVersion })
        Service-->>Express: { user (sanitized), token }
        Express-->>Client: 200 OK + Set-Cookie: token=... (HttpOnly)
    end
```

### 3.3. Protected Request & Session Revocation Verification
```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant AuthMiddleware as authenticate Middleware
    participant RBACMiddleware as authorize Middleware
    participant Controller as Protected Controller
    participant DB as PostgreSQL (Prisma)

    Client->>AuthMiddleware: GET /api/admin/dashboard (Bearer / Cookie)
    AuthMiddleware->>AuthMiddleware: verifyToken(token, JWT_SECRET)
    alt Invalid Signature or Expired
        AuthMiddleware-->>Client: 401 Unauthorized (TOKEN_INVALID / TOKEN_EXPIRED)
    else Token Signature Valid
        AuthMiddleware->>DB: prisma.user.findUnique({ id: payload.userId })
        alt User not found or payload.tokenVersion !== dbUser.tokenVersion
            AuthMiddleware-->>Client: 401 Unauthorized (SESSION_REVOKED)
        else Session Active
            AuthMiddleware->>RBACMiddleware: req.user = dbUser
            RBACMiddleware->>RBACMiddleware: Check req.user.role in allowedRoles
            alt Role unauthorized
                RBACMiddleware-->>Client: 403 Forbidden (INSUFFICIENT_PERMISSIONS)
            else Authorized
                RBACMiddleware->>Controller: Next()
                Controller-->>Client: 200 OK Response
            end
        end
    end
```

### 3.4. Secure Password Reset Flow
```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Express as Express
    participant Service as AuthService
    participant Email as EmailService
    participant DB as PostgreSQL (Prisma)

    Client->>Express: POST /api/auth/forgot-password { email }
    Express->>Service: forgotPassword(email)
    Service->>DB: prisma.user.findUnique({ email })
    opt User found
        Service->>Service: crypto.randomBytes(32).toString('hex')
        Service->>Service: crypto.createHash('sha256').update(token).digest('hex')
        Service->>DB: update({ passwordResetToken: hashedToken, passwordResetExpires: now + 15m })
        Service->>Email: sendPasswordResetEmail(email, rawToken, resetUrl)
    end
    Note over Service,Client: Generic message returned regardless of email existence
    Service-->>Client: 200 OK "If an account exists, a reset link has been dispatched."

    Client->>Express: POST /api/auth/reset-password { token, newPassword }
    Express->>Service: resetPassword(rawToken, newPassword)
    Service->>Service: hash token with SHA-256
    Service->>DB: findFirst({ passwordResetToken: hashedToken, passwordResetExpires > now })
    alt Token invalid or expired
        Service-->>Client: 400 Bad Request (INVALID_OR_EXPIRED_RESET_TOKEN)
    else Token valid
        Service->>Service: hashPassword(newPassword, 12 rounds)
        Service->>DB: update({ passwordHash, passwordResetToken: null, tokenVersion: +1 })
        Service-->>Client: 200 OK "Password reset successfully."
    end
```

---

## 4. Role-Based Access Control (RBAC) Matrix

| Resource / Endpoint | `ANONYMOUS` | `TOURIST` / `USER` | `GUIDE` | `ADMIN` |
|---|:---:|:---:|:---:|:---:|
| `POST /api/auth/register` | Allowed | Allowed | Allowed | Allowed |
| `POST /api/auth/login` | Allowed | Allowed | Allowed | Allowed |
| `POST /api/auth/forgot-password` | Allowed | Allowed | Allowed | Allowed |
| `POST /api/auth/reset-password` | Allowed | Allowed | Allowed | Allowed |
| `POST /api/auth/logout` | Denied (401) | Allowed | Allowed | Allowed |
| `GET /api/auth/profile` (`/me`) | Denied (401) | Allowed (Self) | Allowed (Self) | Allowed (Self) |
| `PATCH /api/auth/profile` | Denied (401) | Allowed (Self) | Allowed (Self) | Allowed (Self) |
| `POST /api/auth/change-password` | Denied (401) | Allowed (Self) | Allowed (Self) | Allowed (Self) |
| `GET /api/admin/dashboard` | Denied (401) | Denied (403) | Denied (403) | Allowed |
| `GET /api/admin/users/:userId` | Denied (401) | Owner Only | Owner Only | Allowed (Any User) |

---

## 5. Configuration & Environment Variables

All configuration is type-checked and validated at startup using Zod in [`apps/api/src/config/env.ts`](file:///d:/tourist%20website/apps/api/src/config/env.ts).

```dotenv
# Port & Runtime
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tourist_db?schema=public"

# JWT Authentication
JWT_SECRET="dev-jwt-secret-min-32-chars-long-voyagevista-auth-key-2026!"
JWT_EXPIRES_IN="7d"

# Cookie Signing
COOKIE_SECRET="dev-cookie-secret-min-32-chars-long-voyagevista-security!"

# Application Host (used for password reset links)
APP_URL="http://localhost:5173"

# Email Provider Configuration
# Options: console | smtp | resend | sendgrid
EMAIL_PROVIDER="console"
# If using SMTP:
# SMTP_HOST="smtp.example.com"
# SMTP_PORT="587"
# SMTP_USER="mailer@example.com"
# SMTP_PASS="secret"
# SMTP_FROM="VoyageVista Support <noreply@voyagevista.com>"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10
```

### Configurable Email Delivery Guarantee
The `EmailService` explicitly checks whether email provider credentials exist before dispatching. If `EMAIL_PROVIDER=console` (the default in development), reset links are logged directly to the server terminal with clear instructions:
```text
[EMAIL SERVICE: CONSOLE] Password Reset Request
To: traveler@example.com
Subject: Reset your VoyageVista password
Raw Token: 9fae1837c35...
Reset URL: http://localhost:5173/reset-password?token=9fae1837c35...
Expires In: 15 minutes
```
In production, if `EMAIL_PROVIDER` is unset or unsupported credentials are provided, the service logs a clear operational warning rather than fabricating fake successful delivery statuses.
