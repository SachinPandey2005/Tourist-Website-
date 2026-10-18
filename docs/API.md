# REST API Documentation & Contracts

## 1. Design Conventions
- **Base URL**: `/api`
- **Format**: JSON (`Content-Type: application/json`)
- **Naming Conventions**:
  - Endpoints: Plural nouns without verbs (`/api/destinations`, `/api/bookings`)
  - Request & Response fields: `camelCase`
  - Enums: `UPPER_SNAKE` (e.g. `CONFIRMED`, `TOURIST`)
- **Response Envelopes**:
  All API error payloads conform to the standardized contract from `@tourist/shared`:
  ```json
  {
    "error": {
      "code": "STRING_ERROR_CODE",
      "message": "Human readable explanation",
      "details": {}
    },
    "timestamp": "2026-10-18T22:00:00.000Z"
  }
  ```

---

## 2. Active Endpoints (Phase 1)

### `GET /api/health`
Checks the operational health and connectivity of the API server and dependencies.

- **Authentication**: None
- **Rate Limit**: Unrestricted
- **Status Codes**:
  - `200 OK`: Server running normally

#### Example Response:
```json
{
  "status": "healthy",
  "uptime": 142,
  "timestamp": "2026-10-18T16:34:10.512Z",
  "environment": "development",
  "version": "0.1.0",
  "services": {
    "api": "healthy",
    "database": "pending"
  }
}
```

---

## 3. Planned Endpoints Roadmap (Phase 2 & Phase 3)

### Authentication
- `POST /api/auth/register` - Create user profile
- `POST /api/auth/login` - Authenticate and issue JWT / session
- `GET /api/auth/me` - Retrieve current session profile

### Destinations
- `GET /api/destinations` - Filtered & paginated list of destinations
- `GET /api/destinations/:slug` - Detailed destination profile with reviews & guide info
- `POST /api/destinations` - Create destination (Admin only)

### Bookings
- `POST /api/bookings` - Create reservation with idempotency key
- `GET /api/bookings/my-bookings` - User's active and historical reservations
- `PATCH /api/bookings/:id/cancel` - Cancel existing booking

### Reviews
- `POST /api/destinations/:id/reviews` - Submit traveler rating and review
