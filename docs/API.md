# REST API Documentation & Contracts (Phase 3 Backend Foundation)

## 1. Architectural Overview & Middleware Pipeline

The backend REST API is built with **Express.js**, **TypeScript**, and **Prisma ORM**, strictly following clean-architecture principles and separating HTTP declaration (`app.ts`) from server lifecycle & process orchestration (`server.ts`).

### Middleware Pipeline Execution Order
1. **Helmet**: Secures response HTTP headers against known web vulnerabilities (XSS, Clickjacking, MIME sniffing).
2. **CORS**: Enforces origin whitelisting (`CORS_ORIGIN`), credentials support, and explicit HTTP methods.
3. **Morgan Logger**: Structured request access logging (`dev` format in development, `combined` Apache format in production, silent in tests).
4. **Body Parsing**: Standard `express.json` with strict `1mb` maximum payload threshold preventing DOS attacks.
5. **Rate Limiting**: `express-rate-limit` enforcing IP-based sliding window ceilings with standard `RateLimit-*` headers.
6. **Zod Validation**: Reusable request validator parsing and coercing `body`, `query`, and `params` before reaching controllers.
7. **Controller & Service Layer**: Isolated business logic with typed DTOs and Prisma database interaction.
8. **404 Not Found Handler**: Catches all unmatched routes and passes a structured `AppError.notFound()` to the centralized handler.
9. **Centralized Error Handler**: Translates operational exceptions to standard JSON envelopes and masks internal stack traces in production.

---

## 2. API Response & Error Envelopes

All endpoint responses conform to standard envelopes defined in `@tourist/shared`.

### Standard Success Envelope (`ApiResponseBuilder.success`)
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Kyoto Heritage Tour"
  },
  "timestamp": "2026-10-18T22:30:00.000Z"
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
  "timestamp": "2026-10-18T22:30:00.000Z"
}
```

### Error Code Reference & Status Codes

| HTTP Status | Error Code | Description | Details Payload |
|---|---|---|---|
| `400 Bad Request` | `BAD_REQUEST` | Malformed syntax or invalid request format | Optional context |
| `400 Bad Request` | `INVALID_JSON` | Malformed JSON in request body | None |
| `401 Unauthorized` | `UNAUTHORIZED` | Authentication missing or expired | None |
| `403 Forbidden` | `FORBIDDEN` | Authenticated but insufficient permission | None |
| `404 Not Found` | `NOT_FOUND` | Route or resource does not exist | Unmatched path |
| `409 Conflict` | `CONFLICT` | Resource uniqueness violation or collision | Conflicting identifier |
| `422 Unprocessable` | `VALIDATION_ERROR` | Request validation failed | Array of `{ field, message, code }` |
| `429 Too Many Req` | `RATE_LIMIT_EXCEEDED`| Rate limit exceeded | Retry window info |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Unexpected server failure | Stack trace (dev only; hidden in prod) |

#### Validation Error Example (`422 Unprocessable Entity`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed on request parameters",
    "details": [
      {
        "field": "id",
        "message": "Invalid resource identifier format (must be a valid UUID)",
        "code": "invalid_string"
      },
      {
        "field": "page",
        "message": "Number must be greater than or equal to 1",
        "code": "too_small"
      }
    ]
  },
  "timestamp": "2026-10-18T22:30:00.000Z"
}
```

---

## 3. Active Endpoints

### `GET /api/health`
Performs comprehensive operational health checks, telemetry sampling, and active database connection pinging via `SELECT 1`.

- **Rate Limit**: Scoped under `/api` rate limiter
- **Status Codes**:
  - `200 OK`: Server running (`status: "healthy"` or `"degraded"`)
  - `503 Service Unavailable`: Unrecoverable server failure

#### Response Body Schema
```json
{
  "status": "healthy",
  "uptime": 142,
  "timestamp": "2026-10-18T22:35:10.512Z",
  "environment": "development",
  "version": "0.1.0",
  "services": {
    "api": "healthy",
    "database": "connected"
  },
  "databaseLatencyMs": 4,
  "memoryUsageMb": 28.4
}
```
*Note: If the PostgreSQL database instance is not connected, `status` gracefully switches to `"degraded"` and `services.database` becomes `"disconnected"` without crashing the server.*

---

## 4. Reusable Validation & Pagination Utilities

### Request Validation Middleware (`validateRequest`)
Validates input at network boundaries using Zod schemas:
```typescript
router.get(
  '/destinations/:id',
  validateRequest({
    params: uuidParamSchema,
    query: paginationQuerySchema,
  }),
  destinationController.getById
);
```

### Standard Pagination Query Parameters
| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | Integer | `1` | 1-based page index |
| `pageSize` | Integer | `10` | Items per page (max `100`) |
| `sortBy` | String | `undefined` | Field name to order by |
| `sortOrder` | Enum | `asc` | Order direction: `asc` or `desc` |

### Paginated Result Meta
```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 42,
    "totalPages": 5
  },
  "meta": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```
