# Database Architecture & Prisma Schema

## 1. Overview
The database layer uses **PostgreSQL** as the relational database engine and **Prisma ORM** as the schema declaration, query generator, and migration engine.

## 2. Configuration
The database connection string is configured in `apps/api/.env`:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/tourist_db?schema=public"
```

For cloud-hosted environments (e.g. Supabase, Neon, AWS RDS), use the direct connection or connection pooler URL provided by your database provider.

---

## 3. Entity Relational Model

```mermaid
erDiagram
    User ||--o{ Booking : "makes"
    User ||--o{ Review : "writes"
    Destination ||--o{ Booking : "receives"
    Destination ||--o{ Review : "contains"

    User {
        uuid id PK
        string email UK
        string name
        enum role "ADMIN | GUIDE | TOURIST"
        datetime createdAt
        datetime updatedAt
    }

    Destination {
        uuid id PK
        string title
        string slug UK
        string description
        string location
        string country
        decimal price
        string imageUrl
        float rating
        boolean isFeatured
        datetime createdAt
        datetime updatedAt
    }

    Booking {
        uuid id PK
        uuid userId FK
        uuid destinationId FK
        datetime startDate
        datetime endDate
        decimal totalAmount
        enum status "PENDING | CONFIRMED | CANCELLED | COMPLETED"
        datetime createdAt
        datetime updatedAt
    }

    Review {
        uuid id PK
        int rating
        string comment
        uuid userId FK
        uuid destinationId FK
        datetime createdAt
        datetime updatedAt
    }
```

---

## 4. Migration & Maintenance Commands

All database management commands should be run within `apps/api`:

```bash
# Generate Prisma Client
npm run prisma:generate --workspace=@tourist/api

# Create and apply a migration during development
npx --prefix apps/api prisma migrate dev --name init_schema

# Apply pending migrations in production (CI/CD)
npx --prefix apps/api prisma migrate deploy

# Open Prisma Studio GUI
npx --prefix apps/api prisma studio
```

---

## 5. Seeding Strategy (Planned for Phase 2)
A seed script `apps/api/prisma/seed.ts` will populate:
- Default admin and demo guide accounts.
- Curated destinations across 7 global categories (Beach, Mountain, Adventure, etc.) with verified coordinates and imagery.
- Sample verified reviews and baseline pricing.
