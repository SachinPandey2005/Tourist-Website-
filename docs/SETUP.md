# Local Development & Setup Guide

## 1. Prerequisites
Ensure the following tools are installed on your workstation:
- **Node.js**: `v20.x` or `v22.x+` (verified on `v24.19.0`)
- **npm**: `v10.x+` (verified on `11.17.0`)
- **Git**: `v2.x+`
- **PostgreSQL**: `v14.x` or higher (local or managed instance such as Supabase/Neon)

## 2. Quickstart Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
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

## 3. Workspaces & Monorepo Commands

| Command | Description |
|---|---|
| `npm run dev` | Concurrently starts both API and Web in watch/dev mode |
| `npm run dev:api` | Starts only the Express API service via `tsx watch` |
| `npm run dev:web` | Starts only the Vite React dev server |
| `npm run build` | Builds `@tourist/shared`, `@tourist/api`, and `@tourist/web` |
| `npm run typecheck` | Executes TypeScript type checking across all workspaces |
| `npm run test` | Runs all Vitest and Supertest test suites across packages |
| `npm run prisma:generate` | Generates the Prisma client from `schema.prisma` |

---

## 4. Verification

After running `npm run dev`:
- Open **Web Frontend**: [http://localhost:5173](http://localhost:5173)
- Check **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- The web landing page will display a live health status card and confirm connection.

---

## 5. Troubleshooting

- **Port Conflict (5000 or 5173 in use)**:
  Update `PORT` in `apps/api/.env` and adjust the proxy target in `apps/web/vite.config.ts`.
- **Prisma Client Missing**:
  Run `npm run prisma:generate` after modifying the schema or checking out the repo.
- **TypeScript Resolution Issue**:
  Run `npm run build:shared` to ensure shared dist declaration files exist.
