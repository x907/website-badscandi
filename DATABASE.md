# Database Documentation

Complete database schema documentation for Bad Scandi e-commerce platform.

## Table of Contents

- [Overview](#overview)
- [Connection Configuration](#connection-configuration)
- [Schema](#schema)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Common Queries](#common-queries)
- [Migrations](#migrations)
- [Backup & Recovery](#backup--recovery)

---

## Overview

| Aspect | Details |
|--------|---------|
| **Database** | PostgreSQL |
| **Provider** | Supabase |
| **ORM** | Prisma |
| **Schema Location** | `prisma/schema.prisma` |

---

## Connection Configuration

### Environment Variables

```bash
# Primary connection (pooled for serverless)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Direct connection (for migrations)
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

### Prisma Configuration

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

---

## Schema

### User

Stores user accounts and authentication data.

```prisma
model User {
  id                 String              @id @default(cuid())
  email              String              @unique
  name               String?
  image              String?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  emailVerified      Boolean             @default(false)
  isAdmin            Boolean             @default(false)
  marketingConsent   Boolean             @default(false)

  // Relations
  accounts           Account[]
  cart               Cart?
  emailLogs          EmailLog[]
  emailSubscriptions EmailSubscription[]
  events             Event[]
  orders             Order[]
  passkeys           Passkey[]
  sessions           Session[]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | CUID primary key |
| `email` | String | Unique email address |
| `name` | String? | Display name |
| `image` | String? | Profile image URL |
| `emailVerified` | Boolean | Email verification status |
| `isAdmin` | Boolean | Admin access flag |
| `marketingConsent` | Boolean | Marketing email consent |

---

### Passkey

WebAuthn/Passkey credentials for passwordless authentication.

```prisma
model Passkey {
  id           String   @id @default(cuid())
  userId       String
  name         String?
  publicKey    String
  counter      Int
  transports   String?
  createdAt    DateTime @default(now())
  aaguid       String?
  backedUp     Boolean
  credentialID String   @unique
  deviceType   String

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `publicKey` | String | WebAuthn public key |
| `counter` | Int | Signature counter (replay protection) |
| `credentialID` | String | Unique credential identifier |
| `deviceType` | String | platform, cross-platform |
| `backedUp` | Boolean | If passkey is backed up to cloud |

---

### Account

OAuth provider accounts linked to users.

```prisma
model Account {
  id                    String    @id @default(cuid())
  userId                String
  accountId             String    @unique
  providerId            String
  accessToken           String?
  accessTokenExpiresAt  DateTime?
  refreshToken          String?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  idToken               String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `providerId` | String | google, apple, facebook, microsoft |
| `accountId` | String | Provider's user ID |
| `accessToken` | String? | OAuth access token |

---

### Session

Active user sessions.

```prisma
model Session {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

---

### Product

Store products with multi-image support.

```prisma
model Product {
  id              String   @id @default(cuid())
  slug            String   @unique
  name            String
  description     String
  priceCents      Int
  imageUrl        String   // Primary image (backwards compat)
  imageUrls       String[] @default([])
  stock           Int      @default(0)
  featured        Boolean  @default(false)
  hidden          Boolean  @default(false)

  // SEO fields
  metaTitle       String?
  metaDescription String?
  altText         String?

  // Categorization
  category        String?
  tags            String?
  materials       String?
  colors          String?
  dimensions      String?
  room            String?

  // Shipping dimensions
  shippingWeightOz  Float?
  shippingLengthIn  Float?
  shippingWidthIn   Float?
  shippingHeightIn  Float?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([category])
  @@index([featured])
  @@index([hidden])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `slug` | String | URL-friendly identifier |
| `priceCents` | Int | Price in cents (14900 = $149.00) |
| `imageUrl` | String | Primary image URL |
| `imageUrls` | String[] | All image URLs |
| `hidden` | Boolean | Hide from public shop |
| `shippingWeightOz` | Float? | Weight for shipping calculation |

---

### Order

Purchase orders from Stripe checkout.

```prisma
model Order {
  id              String   @id @default(cuid())
  userId          String
  stripeId        String   @unique
  totalCents      Int
  shippingCents   Int      @default(0)
  status          String   @default("pending")
  items           Json
  customerEmail   String?
  shippingAddress Json?

  // Shipping info (EasyPost)
  trackingNumber  String?
  trackingUrl     String?
  labelUrl        String?
  carrier         String?
  shippingService String?
  labelCostCents  Int?
  shipmentId      String?
  labelRefunded   Boolean  @default(false)

  // Flags
  isSandbox       Boolean  @default(false)
  threeDSecureStatus String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([stripeId])
  @@index([isSandbox])
}
```

**Order Items JSON Structure:**
```json
[
  {
    "productId": "clx...",
    "name": "Macrame Wall Hanging",
    "priceCents": 14900,
    "quantity": 1,
    "imageUrl": "https://..."
  }
]
```

**Shipping Address JSON Structure:**
```json
{
  "name": "Jane Doe",
  "address": {
    "line1": "123 Main St",
    "line2": "Apt 4",
    "city": "Los Angeles",
    "state": "CA",
    "postal_code": "90210",
    "country": "US"
  }
}
```

---

### Review

Customer reviews with moderation.

```prisma
model Review {
  id           String   @id @default(cuid())
  customerName String
  email        String?
  rating       Int
  comment      String
  productName  String?
  imageUrls    String[]
  approved     Boolean  @default(false)
  featured     Boolean  @default(false)
  verified     Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([featured])
  @@index([approved])
  @@index([rating])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `rating` | Int | 1-5 star rating |
| `approved` | Boolean | Admin approved for display |
| `featured` | Boolean | Show on homepage |
| `verified` | Boolean | Verified purchase |

---

### Cart

Shopping cart for abandoned cart tracking.

```prisma
model Cart {
  id        String   @id @default(cuid())
  userId    String   @unique
  items     Json
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Cart Items JSON Structure:**
```json
[
  { "productId": "clx...", "quantity": 2 }
]
```

---

### Event

Analytics event tracking.

```prisma
model Event {
  id          String   @id @default(cuid())
  userId      String?
  anonymousId String?
  eventType   String
  properties  Json?
  occurredAt  DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([anonymousId])
  @@index([eventType])
  @@index([occurredAt])
  @@index([userId, eventType, occurredAt])
}
```

**Event Types:**
- `page_view`
- `product_view`
- `add_to_cart`
- `begin_checkout`
- `purchase`

---

### EmailSubscription

Email list subscription status.

```prisma
model EmailSubscription {
  id        String   @id @default(cuid())
  userId    String
  list      String
  status    String   @default("subscribed")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, list])
  @@index([userId])
  @@index([list, status])
}
```

---

### EmailLog

Drip campaign email tracking.

```prisma
model EmailLog {
  id              String   @id @default(cuid())
  userId          String?
  email           String
  templateKey     String
  step            Int      @default(1)
  relatedEntityId String?
  sesMessageId    String?
  configSet       String?
  status          String   @default("sent")
  metadata        Json?
  sentAt          DateTime @default(now())

  user            User?    @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([templateKey])
  @@index([relatedEntityId])
  @@index([sentAt])
  @@index([userId, templateKey, relatedEntityId])
}
```

---

### AuditLog

Admin action audit trail.

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String
  userEmail  String
  action     String
  entityType String
  entityId   String?
  changes    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([entityType])
  @@index([entityId])
  @@index([action])
  @@index([createdAt])
  @@index([userId, entityType, createdAt])
}
```

**Actions:**
- `create`, `update`, `delete`
- `approve`, `reject`, `feature`
- `refund`, `upload`

---

### SiteSettings

Site-wide configuration (singleton).

```prisma
model SiteSettings {
  id            String   @id @default("settings")
  sandboxMode   Boolean  @default(false)

  // Theme settings
  themeId       String   @default("system")
  borderRadius  String   @default("default")
  buttonStyle   String   @default("default")
  headingStyle  String   @default("normal")
  accentColor   String   @default("amber")
  fontScale     String   @default("default")
  darkMode      String   @default("system")

  updatedAt     DateTime @updatedAt
  updatedBy     String?
}
```

---

### Verification

Email verification tokens.

```prisma
model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([identifier, value])
}
```

---

## Relationships

```
User
├── 1:many → Account (OAuth providers)
├── 1:many → Session (active sessions)
├── 1:many → Passkey (WebAuthn credentials)
├── 1:many → Order (purchases)
├── 1:1    → Cart (shopping cart)
├── 1:many → Event (analytics)
├── 1:many → EmailSubscription
└── 1:many → EmailLog

Product
└── (no direct relations - referenced by ID in Order.items)

Review
└── (no direct relations - standalone)

SiteSettings
└── (singleton - no relations)
```

---

## Indexes

### Performance Indexes

```prisma
// User lookups
@@unique([email])

// Product queries
@@index([category])
@@index([featured])
@@index([hidden])

// Order queries
@@index([userId])
@@index([stripeId])
@@index([isSandbox])

// Review queries
@@index([featured])
@@index([approved])
@@index([rating])

// Event queries (analytics)
@@index([userId])
@@index([anonymousId])
@@index([eventType])
@@index([occurredAt])
@@index([userId, eventType, occurredAt])

// Audit queries
@@index([userId])
@@index([entityType])
@@index([entityId])
@@index([createdAt])
```

---

## Common Queries

### Fetch Products

```typescript
// All visible products
const products = await db.product.findMany({
  where: { hidden: false },
  orderBy: { createdAt: 'desc' }
});

// Featured products
const featured = await db.product.findMany({
  where: { featured: true, hidden: false },
  take: 6
});

// Product by slug
const product = await db.product.findUnique({
  where: { slug: 'macrame-wall-hanging' }
});
```

### Fetch Orders

```typescript
// User's orders
const orders = await db.order.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: 'desc' }
});

// All orders (admin)
const allOrders = await db.order.findMany({
  include: { user: true },
  orderBy: { createdAt: 'desc' }
});
```

### Fetch Reviews

```typescript
// Approved reviews
const reviews = await db.review.findMany({
  where: { approved: true },
  orderBy: { createdAt: 'desc' }
});

// Featured reviews for homepage
const featured = await db.review.findMany({
  where: { approved: true, featured: true },
  take: 5
});
```

### Admin Dashboard Stats

```typescript
const [products, orders, reviews] = await Promise.all([
  db.product.count(),
  db.order.findMany({
    select: { totalCents: true }
  }),
  db.review.count({ where: { approved: false } })
]);

const totalRevenue = orders.reduce((sum, o) => sum + o.totalCents, 0);
```

---

## Migrations

### Push Schema Changes

```bash
# Development (direct push)
npm run db:push

# This syncs schema with database without migrations
```

### Generate Prisma Client

```bash
npx prisma generate

# Automatically runs on npm install via postinstall
```

### View Schema

```bash
# Open Prisma Studio
npm run db:studio
```

### Reset Database

```bash
# Warning: Destroys all data!
npx prisma db push --force-reset
npm run db:seed
```

---

## Backup & Recovery

### Manual Backup

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Or use the backup script
./scripts/backup-database.sh
```

### Restore from Backup

```bash
psql $DATABASE_URL < backup.sql
```

### Supabase Backups

Supabase automatically creates daily backups on paid plans. Access via:
1. Supabase Dashboard
2. Settings → Database
3. Backups section

---

## Performance Tips

### 1. Use Select to Limit Fields

```typescript
// Only fetch needed fields
const products = await db.product.findMany({
  select: {
    id: true,
    name: true,
    priceCents: true,
    imageUrl: true
  }
});
```

### 2. Use Pagination

```typescript
// Paginated products
const products = await db.product.findMany({
  skip: page * pageSize,
  take: pageSize
});
```

### 3. Use Include Sparingly

```typescript
// Only include relations when needed
const orders = await db.order.findMany({
  include: { user: true } // Only if displaying user info
});
```

### 4. Batch Operations

```typescript
// Use transactions for multiple operations
await db.$transaction([
  db.product.update({ where: { id: '1' }, data: { stock: 5 } }),
  db.product.update({ where: { id: '2' }, data: { stock: 3 } })
]);
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoints
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) - Recovery procedures
