# VoyageVista - Tourist Website Platform

[![Phase](https://img.shields.io/badge/Phase-1_Foundation_Complete-teal.svg)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_v5.7-blue.svg)](#)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](#)
[![Vite](https://img.shields.io/badge/Vite-6.1-purple.svg)](#)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](#)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](#)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-indigo.svg)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](#)

Enterprise-grade full-stack tourist website platform built with a high-performance TypeScript monorepo architecture.

---

## 📁 Repository Structure

```text
tourist-website/
├── apps/
│   ├── web/               # React 18 + Vite + Tailwind CSS frontend
│   └── api/               # Node.js + Express + TypeScript + Prisma backend
├── packages/
│   └── shared/            # Shared types, health contracts & domain models
├── docs/                  # Comprehensive engineering documentation
│   ├── ARCHITECTURE.md    # System design & monorepo architecture
│   ├── SETUP.md           # Local environment onboarding & instructions
│   ├── DATABASE.md        # PostgreSQL schema & Prisma ORM workflows
│   ├── API.md             # REST API specifications & endpoints
│   └── DEPLOYMENT.md      # Vercel & cloud deployment guidelines
├── package.json           # Root workspace orchestration
├── tsconfig.base.json     # Strict compiler settings
├── .env.example           # Root environment variable template
└── .gitignore             # Workspace-wide ignore patterns
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` templates to `.env`:
```bash
# Root
cp .env.example .env

# Apps
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

### 4. Start Development Mode
```bash
npm run dev
```
- **Web Client**: [http://localhost:5173](http://localhost:5173)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🛠️ Root Orchestration Scripts

| Script | Action |
|---|---|
| `npm run dev` | Runs both API and Web concurrently in watch mode |
| `npm run dev:api` | Runs API service only |
| `npm run dev:web` | Runs Web Vite dev server only |
| `npm run build` | Builds shared contracts, API, and Web bundles |
| `npm run typecheck` | Strict TypeScript verification across all workspaces |
| `npm run test` | Runs unit and integration test suites |
| `npm run prisma:generate` | Compiles Prisma client types from schema |

---

## 📖 Documentation Index
- [Architecture & System Flow](file:///d:/tourist%20website/docs/ARCHITECTURE.md)
- [Setup & Troubleshooting](file:///d:/tourist%20website/docs/SETUP.md)
- [Database & Prisma Schema](file:///d:/tourist%20website/docs/DATABASE.md)
- [REST API Specification](file:///d:/tourist%20website/docs/API.md)
- [Deployment Guidelines](file:///d:/tourist%20website/docs/DEPLOYMENT.md)
