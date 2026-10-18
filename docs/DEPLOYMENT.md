# Deployment Guide

## 1. Architecture Strategy
The platform follows a decoupled deployment architecture:
- **Frontend (`apps/web`)**: Hosted on **Vercel** with global edge CDN distribution and instant invalidation.
- **Backend API (`apps/api`)**: Deployed to a Node.js cloud runtime (e.g., Render, Railway, Fly.io, or AWS).
- **Database**: Managed PostgreSQL instance (Supabase, Neon, or AWS RDS).

---

## 2. Frontend Deployment: Vercel

### Setup via Vercel Dashboard
1. Import your Git repository into Vercel.
2. In **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/web` (or leave as root and configure custom commands)
   - **Build Command**: `cd ../.. && npm run build:shared && cd apps/web && npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && npm install`
3. Configure **Environment Variables** in Vercel:
   | Key | Value | Description |
   |---|---|---|
   | `VITE_API_URL` | `https://api.yourdomain.com` | Production URL of your deployed Express API |

### SPA Client-Side Routing
A `vercel.json` configuration file is included in `apps/web` to ensure HTML5 history mode routing rewrites all deep links to `index.html`.

---

## 3. Backend Deployment (Render / Railway / Fly.io)

### Build & Run Configuration
- **Build Command**:
  ```bash
  npm install && npm run build:shared && npm run build:api && npm run prisma:generate
  ```
- **Pre-deploy / Migration Command**:
  ```bash
  npx --prefix apps/api prisma migrate deploy
  ```
- **Start Command**:
  ```bash
  node apps/api/dist/index.js
  ```

### Production Environment Variables
| Variable | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `8080` / `5000` | Port assigned by hosting provider |
| `DATABASE_URL` | `postgresql://...` | Production PostgreSQL connection string |
| `CORS_ORIGIN` | `https://your-app.vercel.app` | Whitelist Vercel domain for CORS |

---

## 4. Managed PostgreSQL Setup
- Recommended providers: **Neon** (serverless Postgres) or **Supabase**.
- Ensure connection strings utilize SSL: `?sslmode=require`.
- Enable connection pooling (e.g. PgBouncer) for high concurrency.
