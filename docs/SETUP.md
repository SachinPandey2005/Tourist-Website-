# Local Development & Setup Guide

## 1. Prerequisites
Ensure the following tools are installed on your workstation:
- **Node.js**: `v20.x` or `v22.x+` (verified on `v24.19.0`)
- **npm**: `v10.x+` (verified on `11.17.0`)
- **Git**: `v2.x+`
- **PostgreSQL**: `v14.x` or higher (local or managed instance such as Supabase/Neon)

---

## 2. Quickstart Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SachinPandey2005/Tourist-Website-.git
   cd "tourist website"
   ```

2. **Install all workspace dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` templates in the root, API, and web directories:
   ```bash
   # Root
   cp .env.example .env

   # API
   cp apps/api/.env.example apps/api/.env

   # Web
   cp apps/web/.env.example apps/web/.env
   ```

4. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

5. **Start Development Servers:**
   ```bash
   npm run dev
   ```
   This runs both the API (`http://localhost:5000`) and Web app (`http://localhost:5173`) concurrently.

---

## 3. Backend Architecture (`apps/api`)

The backend is organized into decoupled layers:
```text
apps/api/src/
├── config/             # Zod environment validation (env.ts) & Prisma singleton (database.ts)
├── controllers/        # HTTP handlers handling req/res (e.g. health.controller.ts)
├── services/           # Reusable business logic & database queries (health.service.ts)
├── middleware/         # Error handler, 404, Zod validator, rate limiter, logger
├── routes/             # Route definitions and URL mapping (health.routes.ts, index.ts)
├── validators/         # Reusable Zod schemas for pagination, IDs, slugs (common.validator.ts)
├── utils/              # AppError hierarchy, ApiResponseBuilder, pagination helpers
├── types/              # Internal TypeScript types and DTO exports
├── app.ts              # Express application configuration & middleware pipeline
└── server.ts           # HTTP server listener with graceful shutdown & signal traps
```

---

## 4. Workspaces & Monorepo Commands

| Command | Workspace | Description |
|---|---|---|
| `npm run dev` | Root | Concurrently starts API and Web in watch mode |
| `npm run dev:api` | `@tourist/api` | Starts Express service via `tsx watch src/server.ts` |
| `npm run dev:web` | `@tourist/web` | Starts Vite React dev server on port 5173 |
| `npm run build` | Root | Builds shared contracts, API, and Web bundles |
| `npm run build:api` | `@tourist/api` | Compiles API TypeScript to `dist/` |
| `npm run start --workspace=@tourist/api` | `@tourist/api` | Starts production server with `node dist/server.js` |
| `npm run typecheck` | Root | Executes strict TypeScript checking across all workspaces |
| `npm run test` | Root | Runs all Vitest test suites (health, validation, errors, React) |
| `npm run prisma:generate` | `@tourist/api` | Generates Prisma client from `schema.prisma` |
| `npm run prisma:migrate` | `@tourist/api` | Applies schema migrations to active PostgreSQL database |
| `npm run prisma:seed` | `@tourist/api` | Seeds realistic destinations, tours, hotels, and activities |

---

## 5. Environment Variables Reference (`apps/api/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port for Express HTTP listener |
| `NODE_ENV` | `development` | Environment mode (`development`, `test`, `production`) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin for CORS headers |
| `DATABASE_URL` | *Required* | PostgreSQL connection string |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15m) | Rate limiting sliding window in milliseconds |
| `RATE_LIMIT_MAX` | `100` | Maximum requests allowed per IP per window |

---

## 6. Verification

After running `npm run dev`:
- Open **Web Frontend**: [http://localhost:5173](http://localhost:5173)
- Check **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- The web landing page will display a live health status card and confirm connection.

---

## 7. Troubleshooting

- **Database Disconnected**:
  If no PostgreSQL instance is running, `/api/health` reports status `degraded` and `services.database: "disconnected"` without crashing the server.
- **Port Conflict (5000 or 5173 in use)**:
  Update `PORT` in `apps/api/.env` and adjust the proxy target in `apps/web/vite.config.ts`.
- **Validation Errors**:
  Request parameters failing Zod schema checks return `422 Unprocessable Entity` with a structured `details` array.
- **Graceful Shutdown**:
  The server traps `SIGTERM` and `SIGINT`, closes incoming HTTP connections, and disconnects the Prisma connection pool before exiting cleanly.
