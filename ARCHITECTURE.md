# Architecture Overview

System architecture documentation for Bad Scandi e-commerce platform.

## Table of Contents

- [High-Level Architecture](#high-level-architecture)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Data Flow](#data-flow)
- [Authentication Flow](#authentication-flow)
- [Payment Flow](#payment-flow)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Caching Strategy](#caching-strategy)
- [External Services](#external-services)

---

## High-Level Architecture

```
                                    +------------------+
                                    |    Vercel CDN    |
                                    |  (Edge Network)  |
                                    +--------+---------+
                                             |
                                             v
+------------------+              +------------------+              +------------------+
|   Web Browser    | <----------> |   Next.js App    | <----------> |   Supabase       |
|   (React 19)     |   HTTPS      |  (App Router)    |   Postgres   |   PostgreSQL     |
+------------------+              +--------+---------+              +------------------+
                                           |
                    +----------------------+----------------------+
                    |                      |                      |
                    v                      v                      v
          +------------------+   +------------------+   +------------------+
          |     Stripe       |   |     AWS SES      |   |     AWS S3       |
          |   (Payments)     |   |    (Email)       |   |   (Storage)      |
          +------------------+   +------------------+   +------------------+
```

---

## Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Framework | 19.0.0 |
| Next.js | Full-stack Framework | 15.5+ |
| TypeScript | Type Safety | 5.7+ |
| Tailwind CSS | Styling | 3.4+ |
| shadcn/ui | UI Components | Latest |
| Lucide React | Icons | 0.462+ |

### Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js API Routes | Backend API | 15.5+ |
| Prisma | Database ORM | 5.22+ |
| Better Auth | Authentication | 1.0.0 |
| Zod | Validation | 4.1+ |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Hosting & CDN |
| Supabase | PostgreSQL Database |
| AWS S3 | Image Storage |
| AWS SES | Transactional Email |
| Upstash Redis | Rate Limiting |
| Stripe | Payment Processing |

### Authentication Providers
| Provider | Type |
|----------|------|
| Google | OAuth 2.0 |
| Apple | OAuth 2.0 |
| Facebook | OAuth 2.0 |
| Microsoft | OAuth 2.0 |
| WebAuthn | Passkeys |
| Magic Link | Email |

---

## Directory Structure

```
website-badscandi/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (theme, analytics)
│   ├── page.tsx                 # Homepage
│   ├── globals.css              # Global styles & CSS variables
│   │
│   ├── admin/                   # Admin dashboard (protected)
│   │   ├── layout.tsx          # Admin layout with nav
│   │   ├── page.tsx            # Dashboard stats
│   │   ├── products/           # Product management
│   │   ├── orders/             # Order management
│   │   ├── reviews/            # Review moderation
│   │   └── themes/             # Theme settings
│   │
│   ├── api/                     # API Routes
│   │   ├── auth/[...all]/      # Better Auth endpoints
│   │   ├── admin/              # Admin-only endpoints
│   │   │   ├── products/       # Product CRUD
│   │   │   ├── orders/         # Order management
│   │   │   ├── themes/         # Theme settings
│   │   │   ├── upload/         # S3 uploads
│   │   │   └── dashboard/      # Stats
│   │   ├── checkout/           # Stripe checkout
│   │   ├── webhooks/stripe/    # Payment webhooks
│   │   ├── reviews/            # Review CRUD
│   │   ├── contact/            # Contact form
│   │   ├── cart/               # Cart management
│   │   ├── shipping/rates/     # Shipping calculations
│   │   └── cron/               # Scheduled jobs
│   │
│   ├── shop/                    # Shop pages
│   ├── product/[slug]/          # Product detail pages
│   ├── checkout/                # Checkout flow
│   ├── account/                 # User account
│   └── auth/signin/             # Authentication
│
├── components/                   # React Components
│   ├── ui/                      # shadcn/ui primitives
│   ├── layout/                  # Header, Footer, Navigation
│   ├── cart/                    # Cart components
│   ├── analytics/               # Tracking components
│   ├── admin-*-client.tsx       # Admin page clients
│   └── *.tsx                    # Feature components
│
├── lib/                          # Shared utilities
│   ├── auth.ts                  # Better Auth config
│   ├── auth-utils.ts            # Auth helpers
│   ├── auth-client.ts           # Client-side auth
│   ├── db.ts                    # Prisma client
│   ├── stripe.ts                # Stripe client
│   ├── s3.ts                    # AWS S3 client
│   ├── ses-client.ts            # AWS SES client
│   ├── email.ts                 # Email functions
│   ├── email-templates/         # Drip campaign templates
│   ├── themes.ts                # Theme definitions
│   ├── shipping.ts              # Shipping calculations
│   ├── rate-limit.ts            # Rate limiting
│   ├── validations.ts           # Zod schemas
│   ├── audit.ts                 # Audit logging
│   └── utils.ts                 # Utility functions
│
├── contexts/                     # React Contexts
│   └── cart-context.tsx         # Shopping cart state
│
├── prisma/                       # Database
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed data
│
├── scripts/                      # Utility scripts
│   ├── backup-database.sh       # DB backup
│   ├── promote-admin.ts         # Make user admin
│   ├── test-ses.ts              # Test email
│   └── migrate-*.ts             # Migration scripts
│
├── public/                       # Static assets
│   └── .well-known/             # Apple Pay domain verification
│
└── docs/                         # Documentation
    └── *.md                     # Guide files
```

---

## Data Flow

### Page Request Flow

```
Browser Request
      │
      v
+─────────────────+
│  Vercel Edge    │  ← Caches static assets
│    Network      │
+────────┬────────+
         │
         v
+─────────────────+
│   Next.js       │
│  Middleware     │  ← Auth checks, redirects
+────────┬────────+
         │
         v
+─────────────────+
│  Server         │
│  Component      │  ← Data fetching (Prisma)
+────────┬────────+
         │
         v
+─────────────────+
│  Client         │
│  Component      │  ← Interactive UI
+─────────────────+
```

### API Request Flow

```
Client Request
      │
      v
+─────────────────+
│  Rate Limiter   │  ← Upstash Redis
│   (Middleware)  │
+────────┬────────+
         │
         v
+─────────────────+
│  Auth Check     │  ← Better Auth
│   (Session)     │
+────────┬────────+
         │
         v
+─────────────────+
│  Input          │  ← Zod validation
│  Validation     │
+────────┬────────+
         │
         v
+─────────────────+
│  Business       │
│  Logic          │  ← Prisma, Stripe, AWS
+────────┬────────+
         │
         v
+─────────────────+
│  Audit Log      │  ← Admin actions logged
+────────┬────────+
         │
         v
JSON Response
```

---

## Authentication Flow

### Social OAuth Flow

```
1. User clicks "Sign in with Google"
         │
         v
2. Redirect to Google OAuth
         │
         v
3. User authenticates with Google
         │
         v
4. Callback to /api/auth/callback/google
         │
         v
5. Better Auth creates/links account
   (accounts linked by email)
         │
         v
6. Session cookie set
         │
         v
7. Redirect to returnUrl or homepage
```

### Passkey Registration Flow

```
1. User signed in via OAuth
         │
         v
2. User clicks "Add Passkey"
         │
         v
3. WebAuthn API creates credential
   (Touch ID, Face ID, Windows Hello)
         │
         v
4. Public key sent to server
         │
         v
5. Better Auth stores passkey in DB
         │
         v
6. Confirmation shown to user
```

### Passkey Login Flow

```
1. User clicks "Sign in with Passkey"
         │
         v
2. WebAuthn API requests assertion
         │
         v
3. User authenticates (biometric)
         │
         v
4. Signed assertion sent to server
         │
         v
5. Better Auth verifies signature
         │
         v
6. Session created, cookie set
```

---

## Payment Flow

### Checkout Flow

```
1. User adds items to cart
         │
         v
2. User clicks "Checkout"
         │
         v
3. Frontend validates cart
         │
         v
4. POST /api/checkout
   - Validate products exist
   - Validate stock available
   - Validate prices current
         │
         v
5. Create Stripe Checkout Session
   - Line items
   - Shipping options
   - Success/cancel URLs
         │
         v
6. Redirect to Stripe Checkout
         │
         v
7. User completes payment
         │
         v
8. Stripe webhook: checkout.session.completed
         │
         v
9. Create Order in database
   - Decrement stock
   - Send confirmation email
         │
         v
10. Redirect to success page
```

### Webhook Security

```
Stripe POST to /api/webhooks/stripe
         │
         v
Verify stripe-signature header
         │
         v
Parse event with stripe.webhooks.constructEvent()
         │
         v
Process based on event.type
         │
         v
Return 200 OK (or error)
```

---

## Component Architecture

### Server vs Client Components

```
Layout (Server)
└── ThemeLoader (Client)        ← Dynamic theme CSS
└── Header (Server)
    └── HeaderUserSection (Client)  ← Auth state
    └── CartSheet (Client)          ← Cart state
└── Page Content (Server)
    └── Interactive parts (Client)
└── Footer (Server)
```

### Admin Dashboard Architecture

```
AdminLayout (Server)
├── AdminNav (Client)           ← Navigation
└── Page (Server)
    └── AdminXXXClient (Client) ← Full page interactivity
        ├── State management
        ├── API calls
        ├── Forms
        └── Data tables
```

### Component Naming Conventions

| Pattern | Purpose |
|---------|---------|
| `*-client.tsx` | Client components with state |
| `*.tsx` | Server or shared components |
| `use-*.ts` | Custom React hooks |
| `ui/*.tsx` | shadcn/ui primitives |

---

## State Management

### Server State
- **Database queries**: Prisma ORM
- **Caching**: Next.js fetch cache + Vercel edge cache
- **Revalidation**: On-demand via `revalidatePath()`

### Client State
- **Cart**: React Context (`CartContext`)
- **Theme**: CSS variables (no runtime JS)
- **UI State**: Local `useState` per component
- **Auth State**: Better Auth client hooks

### Cart Context

```typescript
// contexts/cart-context.tsx
interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}
```

---

## Caching Strategy

### Static Assets
- Images: Vercel CDN (immutable)
- Fonts: Google Fonts CDN
- JS/CSS: Vercel CDN (hashed filenames)

### API Responses
```typescript
// Cacheable GET requests
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
  }
});
```

### Database Queries
- Prisma connection pooling via Supabase
- No application-level query cache (database handles it)

### Revalidation Triggers
- Product update: `revalidatePath('/shop')`
- Order created: `revalidatePath('/account')`
- Theme changed: `revalidatePath('/')`

---

## External Services

### Stripe Integration

```
lib/stripe.ts
├── getStripeClient()     ← Server-side Stripe SDK
├── getStripePublishableKey()
└── Checkout flow
    ├── Create sessions
    ├── Handle webhooks
    └── Process refunds
```

### AWS S3 Integration

```
lib/s3.ts
├── S3Client configuration
├── uploadToS3(file, folder)
├── deleteFromS3(key)
└── getPresignedUrl(key)
```

### AWS SES Integration

```
lib/ses-client.ts
├── SESClient configuration
└── sendEmail(to, subject, html)

lib/email.ts
├── sendMagicLinkEmail()
├── sendOrderConfirmation()
├── sendContactNotification()
└── sendDripEmail()
```

### Better Auth Configuration

```
lib/auth.ts
├── Database adapter (Prisma)
├── Social providers
│   ├── Google
│   ├── Apple
│   ├── Facebook
│   └── Microsoft
├── Plugins
│   ├── Passkey (WebAuthn)
│   └── Magic Link
└── Database hooks
    └── Welcome email on signup
```

---

## Deployment Architecture

### Vercel Deployment

```
GitHub Push
      │
      v
Vercel Build
├── prisma generate
├── next build
│   ├── Static pages (SSG)
│   ├── Server components
│   └── API routes (Serverless)
└── Deploy to Edge
```

### Environment Configuration

| Environment | Purpose |
|-------------|---------|
| Development | Local dev with test keys |
| Preview | PR deployments (test mode) |
| Production | Live site (production keys) |

### Serverless Function Regions
- Primary: `iad1` (US East)
- Configured in `vercel.json`

---

## Performance Considerations

### Bundle Optimization
- Code splitting by route
- Dynamic imports for heavy components
- Tree shaking unused code

### Image Optimization
- S3 for storage
- Next.js Image component for optimization
- WebP format support

### Database Performance
- Indexes on frequently queried columns
- Connection pooling via Supabase
- Pagination for large datasets

### Rate Limiting
- Upstash Redis for distributed rate limiting
- Per-endpoint limits
- Graceful degradation

---

## Security Architecture

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

Key security layers:
1. **Authentication**: Better Auth with session cookies
2. **Authorization**: Role-based access (isAdmin flag)
3. **Input Validation**: Zod schemas on all endpoints
4. **Rate Limiting**: Upstash Redis
5. **Audit Logging**: All admin actions logged
6. **CSP Headers**: Content Security Policy

---

## Monitoring & Observability

### Error Tracking
- Console logging (Vercel logs)
- Structured error responses

### Analytics
- Google Analytics 4 (optional)
- Meta Pixel (optional)
- Pinterest Tag (optional)

### Health Checks
- `/api/health` endpoint
- Vercel deployment checks

---

## Scaling Considerations

### Current Limits
| Resource | Limit | Notes |
|----------|-------|-------|
| Database | 500MB | Supabase free tier |
| Storage | Unlimited | AWS S3 |
| Functions | 100GB-hrs | Vercel free tier |
| Bandwidth | 100GB | Vercel free tier |

### Scaling Path
1. **More traffic**: Vercel auto-scales
2. **More data**: Upgrade Supabase plan
3. **More images**: S3 scales automatically
4. **More emails**: SES scales automatically
