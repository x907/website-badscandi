# Contributing Guide

Guidelines for contributing to the Bad Scandi e-commerce platform.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Component Guidelines](#component-guidelines)
- [API Development](#api-development)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Commit Conventions](#commit-conventions)

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm or pnpm
- PostgreSQL (via Supabase or local)
- Git

### Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/website-badscandi.git
cd website-badscandi
```

---

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in required values:
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials
- Stripe keys (test mode)
- AWS credentials (optional for local dev)

### 3. Database Setup

```bash
# Push schema to database
npm run db:push

# Seed sample data
npm run db:seed

# Open Prisma Studio (optional)
npm run db:studio
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Code Style

### TypeScript

- Strict mode enabled
- Explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use `unknown` instead of `any` where possible

```typescript
// Good
export async function getProducts(): Promise<Product[]> {
  return db.product.findMany();
}

// Avoid
export async function getProducts() {
  return db.product.findMany();
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard.tsx` |
| Hooks | camelCase with `use` prefix | `useIsAdmin.ts` |
| Utilities | camelCase | `formatPrice.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_FILE_SIZE` |
| API Routes | kebab-case | `cart-abandonment` |

### File Organization

```
// Component file structure
components/
└── product-card.tsx        # Single component per file
└── product-card.test.tsx   # Tests alongside component (if any)
```

### Imports

```typescript
// Order: React, Next, external, internal, styles
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
```

---

## Component Guidelines

### Server vs Client Components

**Default to Server Components** unless you need:
- State (`useState`, `useReducer`)
- Effects (`useEffect`)
- Browser APIs
- Event handlers

```typescript
// Server Component (default)
export default async function ProductPage() {
  const products = await db.product.findMany();
  return <ProductGrid products={products} />;
}

// Client Component (when needed)
"use client";
export function AddToCartButton({ product }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  // ...
}
```

### Component Structure

```typescript
"use client"; // Only if needed

import { ... } from "...";

// Types
interface ProductCardProps {
  product: Product;
  onAddToCart?: (id: string) => void;
}

// Component
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // Hooks first
  const [isHovered, setIsHovered] = useState(false);

  // Event handlers
  const handleClick = () => {
    onAddToCart?.(product.id);
  };

  // Render
  return (
    <div className="...">
      {/* ... */}
    </div>
  );
}
```

### Styling with Tailwind

```typescript
// Use semantic color tokens (not hardcoded colors)
// Good
<div className="bg-card text-foreground border-border" />

// Avoid
<div className="bg-white text-neutral-900 border-neutral-200" />

// Use the cn() utility for conditional classes
import { cn } from "@/lib/utils";

<button className={cn(
  "px-4 py-2 rounded-lg",
  isActive && "bg-accent text-accent-foreground",
  isDisabled && "opacity-50 cursor-not-allowed"
)} />
```

### Accessibility

- Always include `alt` text for images
- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Ensure keyboard navigation works
- Maintain color contrast ratios

```typescript
// Good
<button onClick={handleClick}>Add to Cart</button>
<img src={url} alt="Hand-dyed macrame wall hanging" />

// Avoid
<div onClick={handleClick}>Add to Cart</div>
<img src={url} />
```

---

## API Development

### Route Structure

```typescript
// app/api/[resource]/route.ts
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  // 1. Rate limiting (if needed)
  const rateLimitResponse = await checkRateLimit(request, "default");
  if (rateLimitResponse) return rateLimitResponse;

  // 2. Authentication (if needed)
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Business logic
  try {
    const data = await db.resource.findMany();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Input Validation

Always validate input with Zod:

```typescript
import { z } from "zod";

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  priceCents: z.number().int().positive(),
  description: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();

  const result = CreateProductSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.issues },
      { status: 400 }
    );
  }

  // Use result.data (typed and validated)
}
```

### Error Responses

Use consistent error format:

```typescript
// Standard error response
return NextResponse.json(
  {
    error: "Human-readable message",
    code: "ERROR_CODE",
    details: {} // Optional
  },
  { status: 400 }
);
```

### Admin Routes

```typescript
import { requireAdmin } from "@/lib/auth-utils";
import { logAuditAction } from "@/lib/audit";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // ... business logic ...

  // Log the action
  await logAuditAction({
    userId: admin.id,
    userEmail: admin.email,
    action: "create",
    entityType: "product",
    entityId: product.id,
    changes: { name: product.name },
    request,
  });

  return NextResponse.json(product, { status: 201 });
}
```

---

## Testing

### Manual Testing Checklist

Before submitting a PR, test these flows:

**Public Pages:**
- [ ] Homepage loads correctly
- [ ] Shop page shows products
- [ ] Product detail page works
- [ ] Contact form submits
- [ ] Dark mode toggles correctly

**Authentication:**
- [ ] Sign in with Google works
- [ ] Passkey enrollment works
- [ ] Sign out works
- [ ] Session persists on refresh

**Checkout:**
- [ ] Add to cart works
- [ ] Cart updates correctly
- [ ] Checkout redirects to Stripe
- [ ] Order appears after payment (test mode)

**Admin:**
- [ ] Dashboard shows stats
- [ ] Product CRUD works
- [ ] Image upload works
- [ ] Review moderation works
- [ ] Theme changes apply

### Testing Stripe

Use test card: `4242 4242 4242 4242`

```bash
# Listen for webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Testing Emails

```bash
# Test SES configuration
npm run test:ses your-email@example.com
```

---

## Pull Request Process

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Keep changes focused and atomic
- Update documentation if needed
- Add/update types as necessary

### 3. Test Locally

```bash
# Build to catch type errors
npm run build

# Run linter
npm run lint
```

### 4. Commit Changes

Follow [commit conventions](#commit-conventions).

### 5. Push & Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Self-reviewed the code
- [ ] Added/updated documentation
- [ ] Tested all affected flows
- [ ] No TypeScript errors
- [ ] No ESLint warnings

---

## Commit Conventions

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```bash
feat(cart): add quantity selector to cart items

fix(checkout): handle expired session gracefully

docs(api): add webhook documentation

refactor(admin): extract product form into separate component

chore(deps): update dependencies to latest versions
```

### Scope (optional)

Common scopes:
- `auth` - Authentication
- `cart` - Shopping cart
- `checkout` - Checkout flow
- `admin` - Admin dashboard
- `api` - API routes
- `ui` - UI components
- `db` - Database changes

---

## Architecture Decisions

When making significant changes, consider:

1. **Performance**: Does this add unnecessary bundle size?
2. **Accessibility**: Is it keyboard/screen reader friendly?
3. **Security**: Are inputs validated? Is auth checked?
4. **Maintainability**: Is it easy to understand and modify?

### When to Create Server Components

- Data fetching
- Accessing backend resources
- Keeping sensitive info on server
- Large dependencies

### When to Create Client Components

- Interactivity (onClick, onChange)
- State management
- Browser APIs
- React hooks (useEffect, useState)

---

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Security Issues**: Email directly (do not open public issue)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
