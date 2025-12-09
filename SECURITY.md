# Security Documentation

Security practices and guidelines for Bad Scandi e-commerce platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Input Validation](#input-validation)
- [Rate Limiting](#rate-limiting)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [File Uploads](#file-uploads)
- [Payment Security](#payment-security)
- [Audit Logging](#audit-logging)
- [Security Headers](#security-headers)
- [Dependency Security](#dependency-security)
- [Incident Response](#incident-response)

---

## Overview

### Security Layers

```
┌─────────────────────────────────────────────┐
│              Vercel Edge Network            │  DDoS protection
├─────────────────────────────────────────────┤
│              Rate Limiting                  │  Upstash Redis
├─────────────────────────────────────────────┤
│              Authentication                 │  Better Auth (sessions)
├─────────────────────────────────────────────┤
│              Authorization                  │  Role-based (isAdmin)
├─────────────────────────────────────────────┤
│              Input Validation               │  Zod schemas
├─────────────────────────────────────────────┤
│              Business Logic                 │  Prisma ORM
├─────────────────────────────────────────────┤
│              Database                       │  Supabase PostgreSQL
└─────────────────────────────────────────────┘
```

---

## Authentication

### Session-Based Authentication

Bad Scandi uses Better Auth with HTTP-only session cookies:

```typescript
// lib/auth.ts
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  // ...
});
```

### Supported Methods

| Method | Security Level | Use Case |
|--------|---------------|----------|
| **Passkeys (WebAuthn)** | Highest | Phishing-resistant biometric |
| **OAuth (Google, etc.)** | High | Delegated authentication |
| **Magic Link** | Medium | Email-based login |

### Passkey Security

Passkeys provide the strongest authentication:
- No passwords to steal
- Phishing-resistant (bound to origin)
- Biometric verification required
- Private key never leaves device

```typescript
// WebAuthn configuration
passkey({
  rpName: process.env.RP_NAME,
  rpID: process.env.RP_ID,      // Domain binding
  origin: process.env.RP_ORIGIN, // Origin verification
})
```

### Session Security

```typescript
// Sessions are validated on every request
const session = await auth.api.getSession({
  headers: await headers(),
});

// Session cookie settings (production)
{
  httpOnly: true,    // No JS access
  secure: true,      // HTTPS only
  sameSite: 'lax',   // CSRF protection
  path: '/',
}
```

---

## Authorization

### Role-Based Access Control

Two roles: regular user and admin.

```prisma
model User {
  isAdmin Boolean @default(false)
  // ...
}
```

### Admin Authorization Pattern

```typescript
// lib/auth-utils.ts
export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isAdmin: true }
  });

  if (!user?.isAdmin) {
    return null;
  }

  return user;
}
```

### Usage in API Routes

```typescript
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  // Admin-only logic
}
```

### Client-Side Admin Check

```typescript
// lib/use-is-admin.ts
export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/user/is-admin')
      .then(r => r.json())
      .then(data => setIsAdmin(data.isAdmin));
  }, []);

  return isAdmin;
}
```

---

## Input Validation

### Zod Validation Schemas

All user input is validated with Zod:

```typescript
// lib/validations.ts
import { z } from "zod";

// XSS-safe string validation
const safeString = z.string()
  .transform(s => s
    .replace(/<[^>]*>/g, '')  // Strip HTML tags
    .replace(/javascript:/gi, '') // Remove JS protocol
    .trim()
  );

export const createProductSchema = z.object({
  name: safeString.min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: safeString.min(1).max(5000),
  priceCents: z.number().int().positive().max(10000000),
  stock: z.number().int().min(0),
  category: safeString.max(100).optional(),
  // ...
});

export const contactFormSchema = z.object({
  name: safeString.min(1).max(100),
  email: z.string().email().max(255),
  subject: safeString.min(1).max(200),
  message: safeString.min(10).max(5000),
});
```

### API Route Validation

```typescript
export async function POST(request: Request) {
  const body = await request.json();

  const result = createProductSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: result.error.issues
      },
      { status: 400 }
    );
  }

  // Use result.data (validated and sanitized)
  const { name, description, priceCents } = result.data;
}
```

### SQL Injection Prevention

Prisma ORM automatically parameterizes all queries:

```typescript
// Safe - Prisma handles escaping
const product = await db.product.findUnique({
  where: { slug: userInput } // Automatically escaped
});

// Never use raw queries with user input
// Avoid: db.$queryRaw`SELECT * FROM products WHERE slug = ${userInput}`
```

---

## Rate Limiting

### Upstash Redis Rate Limiter

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const rateLimits = {
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    analytics: true,
    prefix: "ratelimit:checkout",
  }),
  contact: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "ratelimit:contact",
  }),
  // ...
};
```

### Usage in Routes

```typescript
export async function POST(request: Request) {
  const rateLimitResponse = await checkRateLimit(request, "checkout");
  if (rateLimitResponse) {
    return rateLimitResponse; // 429 Too Many Requests
  }

  // Continue with request
}
```

### Rate Limit Configuration

| Endpoint | Limit | Window |
|----------|-------|--------|
| Checkout | 10 requests | 1 minute |
| Contact Form | 5 requests | 1 minute |
| Reviews | 10 requests | 1 minute |
| Admin APIs | 30 requests | 1 minute |
| General | 60 requests | 1 minute |

---

## Data Protection

### Sensitive Data Handling

| Data Type | Protection |
|-----------|------------|
| Passwords | Not stored (OAuth/passkey only) |
| Session tokens | HTTP-only cookies |
| API keys | Environment variables only |
| Payment data | Stripe (PCI compliant) |
| User emails | Database encryption at rest |

### Environment Variables

```bash
# Never commit these - use Vercel env vars
DATABASE_URL=
STRIPE_SECRET_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
BETTER_AUTH_SECRET=
```

### Secrets in Code

```typescript
// Never log secrets
console.log("API Key:", process.env.STRIPE_SECRET_KEY); // BAD!

// Never include in responses
return NextResponse.json({
  user: user,
  secret: process.env.SECRET // BAD!
});
```

### Database Security

- **Supabase RLS**: Row Level Security available
- **Connection pooling**: PgBouncer via Supabase
- **Encrypted at rest**: Supabase default
- **Encrypted in transit**: SSL required

---

## API Security

### CORS Configuration

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: process.env.NEXT_PUBLIC_SITE_URL },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
        ],
      },
    ];
  },
};
```

### Webhook Verification

```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Process verified event
}
```

### API Error Handling

```typescript
// Don't expose internal errors
try {
  // Business logic
} catch (error) {
  console.error("Internal error:", error); // Log for debugging

  // Return safe error to client
  return NextResponse.json(
    { error: "An error occurred", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
```

---

## File Uploads

### S3 Upload Security

```typescript
// lib/s3.ts
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadToS3(file: File, folder: string) {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type");
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large");
  }

  // Generate random filename (prevent path traversal)
  const key = `${folder}/${crypto.randomUUID()}.${extension}`;

  // Upload to S3
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    ACL: "public-read",
  }));

  return `https://${bucket}.s3.amazonaws.com/${key}`;
}
```

### Upload Route Protection

```typescript
export async function POST(request: Request) {
  // Require admin for uploads
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Rate limit uploads
  const rateLimitResponse = await checkRateLimit(request, "upload");
  if (rateLimitResponse) return rateLimitResponse;

  // Process upload
}
```

---

## Payment Security

### Stripe Security

Payment processing is handled entirely by Stripe:

1. **No card data on server**: Card details go directly to Stripe
2. **Checkout Sessions**: Server creates session, Stripe handles UI
3. **Webhook verification**: Cryptographic signature validation
4. **3D Secure**: Strong Customer Authentication (SCA) support

```typescript
// Create checkout session (server-side)
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [...],
  success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${siteUrl}/shop?canceled=true`,
});

// User is redirected to Stripe's secure checkout page
return NextResponse.json({ url: session.url });
```

### 3D Secure Status Tracking

```typescript
// Track 3DS status for fraud protection
const threeDSecureStatus = paymentIntent.payment_method_options?.card
  ?.three_d_secure?.authentication_flow;

await db.order.update({
  where: { id: order.id },
  data: { threeDSecureStatus }
});
```

---

## Audit Logging

### Logging Admin Actions

```typescript
// lib/audit.ts
export async function logAuditAction({
  userId,
  userEmail,
  action,
  entityType,
  entityId,
  changes,
  request,
}: AuditLogParams) {
  await db.auditLog.create({
    data: {
      userId,
      userEmail,
      action,
      entityType,
      entityId,
      changes,
      ipAddress: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent"),
    },
  });
}
```

### Logged Actions

| Action | Entity Type | Description |
|--------|-------------|-------------|
| `create` | product | New product created |
| `update` | product | Product modified |
| `delete` | product | Product deleted |
| `approve` | review | Review approved |
| `reject` | review | Review rejected |
| `feature` | review | Review featured |
| `refund` | order | Label/order refunded |
| `settings_update` | settings | Theme/settings changed |

### Viewing Audit Logs

```bash
# Via Prisma Studio
npm run db:studio
# Navigate to AuditLog table
```

---

## Security Headers

### Next.js Configuration

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy
  }
];
```

### Content Security Policy

```typescript
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.stripe.com *.google.com *.gstatic.com *.facebook.net *.pinterest.com;
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  img-src 'self' data: blob: *.amazonaws.com *.stripe.com *.googleusercontent.com;
  font-src 'self' fonts.gstatic.com;
  frame-src *.stripe.com;
  connect-src 'self' *.stripe.com *.google-analytics.com *.supabase.co;
`;
```

---

## Dependency Security

### Dependency Auditing

```bash
# Check for vulnerabilities
npm audit

# Auto-fix non-breaking vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

### Update Strategy

1. **Security patches**: Apply immediately
2. **Minor updates**: Test and deploy weekly
3. **Major updates**: Plan and test thoroughly

### Dependabot (GitHub)

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## Incident Response

### Security Issue Response

1. **Identify**: Determine scope and impact
2. **Contain**: Disable affected features if needed
3. **Investigate**: Review logs and audit trail
4. **Fix**: Apply patches
5. **Review**: Post-incident analysis

### Contact for Security Issues

For security vulnerabilities, please email directly rather than opening a public issue.

### Monitoring

- **Vercel Logs**: Application errors and requests
- **Stripe Dashboard**: Payment issues and disputes
- **Supabase Dashboard**: Database metrics
- **Upstash Dashboard**: Rate limit analytics

---

## Security Checklist

### Pre-Launch

- [ ] All secrets in environment variables
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Admin routes protected
- [ ] Webhook signatures verified
- [ ] File upload restrictions in place
- [ ] Security headers configured
- [ ] Dependencies audited
- [ ] SSL/HTTPS enforced

### Ongoing

- [ ] Monitor for unusual activity
- [ ] Review audit logs regularly
- [ ] Update dependencies weekly
- [ ] Review Stripe webhooks
- [ ] Check rate limit metrics
- [ ] Test authentication flows

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
- [ADMIN_SETUP.md](./ADMIN_SETUP.md) - Admin security features
- [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) - Recovery procedures
