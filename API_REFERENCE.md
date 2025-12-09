# API Reference

Complete API documentation for Bad Scandi e-commerce platform.

## Table of Contents

- [Authentication](#authentication)
- [Public Endpoints](#public-endpoints)
- [Protected Endpoints](#protected-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Webhook Endpoints](#webhook-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All API requests use session-based authentication via Better Auth. Sessions are stored in HTTP-only cookies.

### Session Check

```typescript
// Server-side session check
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const session = await auth.api.getSession({
  headers: await headers(),
});

if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Admin Authorization

Admin endpoints require both authentication and `isAdmin: true` on the user record:

```typescript
import { requireAdmin } from "@/lib/auth-utils";

const admin = await requireAdmin();
if (!admin) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
```

---

## Public Endpoints

### Products

#### GET /api/products
Fetch all visible products.

**Response:**
```json
{
  "products": [
    {
      "id": "clx...",
      "slug": "handmade-tapestry",
      "name": "Handmade Tapestry",
      "description": "Beautiful handcrafted tapestry...",
      "priceCents": 14900,
      "imageUrl": "https://...",
      "imageUrls": ["https://..."],
      "stock": 5,
      "featured": true,
      "category": "wall-hanging"
    }
  ]
}
```

### Reviews

#### GET /api/reviews
Fetch approved reviews (public) or all reviews (admin).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `approved` | boolean | Filter by approval status |
| `featured` | boolean | Filter featured reviews only |
| `productId` | string | Filter by product |

**Response:**
```json
{
  "reviews": [
    {
      "id": "clx...",
      "customerName": "Jane D.",
      "rating": 5,
      "comment": "Beautiful craftsmanship!",
      "productName": "Macrame Wall Hanging",
      "imageUrls": [],
      "approved": true,
      "featured": false,
      "verified": true,
      "createdAt": "2024-01-15T..."
    }
  ]
}
```

#### POST /api/reviews
Submit a new review (requires authentication).

**Request Body:**
```json
{
  "customerName": "Jane D.",
  "rating": 5,
  "comment": "Beautiful craftsmanship!",
  "productName": "Macrame Wall Hanging",
  "email": "jane@example.com",
  "imageUrls": []
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "review": { ... }
}
```

### Contact

#### POST /api/contact
Submit contact form inquiry.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Custom order inquiry",
  "message": "I'd like to discuss a custom piece..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

### Health Check

#### GET /api/health
System health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

## Protected Endpoints

These endpoints require user authentication.

### Checkout

#### POST /api/checkout
Create a Stripe checkout session.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "clx...",
      "quantity": 1,
      "priceCents": 14900
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

**Error Codes:**
| Code | Status | Description |
|------|--------|-------------|
| `SESSION_EXPIRED` | 401 | User session expired |
| `PRODUCTS_NOT_FOUND` | 410 | Products no longer exist |
| `PRODUCTS_UNAVAILABLE` | 410 | Products no longer available |
| `PRICE_CHANGED` | 409 | Prices have changed |
| `INSUFFICIENT_STOCK` | 400 | Not enough stock |
| `AMOUNT_TOO_SMALL` | 400 | Order total < $0.50 |

#### POST /api/checkout/payment-intent
Create a payment intent for embedded checkout.

#### POST /api/checkout/verify
Verify a completed checkout session.

**Request Body:**
```json
{
  "sessionId": "cs_..."
}
```

### Cart

#### GET /api/cart
Fetch user's cart contents.

#### POST /api/cart
Update cart contents.

**Request Body:**
```json
{
  "items": [
    { "productId": "clx...", "quantity": 2 }
  ]
}
```

### User Preferences

#### GET /api/user/preferences
Get user marketing preferences.

#### PUT /api/user/preferences
Update user preferences.

**Request Body:**
```json
{
  "marketingConsent": true
}
```

#### GET /api/user/is-admin
Check if current user is an admin.

**Response:**
```json
{
  "isAdmin": true
}
```

### Shipping Rates

#### POST /api/shipping/rates
Calculate shipping rates for items.

**Request Body:**
```json
{
  "items": [
    { "productId": "clx...", "quantity": 1 }
  ],
  "address": {
    "country": "US",
    "state": "CA",
    "postalCode": "90210"
  }
}
```

**Response:**
```json
{
  "rates": [
    {
      "id": "rate_...",
      "carrier": "USPS",
      "service": "Priority Mail",
      "rate": 1250,
      "deliveryDays": 3
    }
  ]
}
```

---

## Admin Endpoints

All admin endpoints require admin authentication.

### Dashboard

#### GET /api/admin/dashboard
Get dashboard statistics.

**Response:**
```json
{
  "stats": {
    "totalProducts": 15,
    "totalOrders": 47,
    "pendingReviews": 3,
    "totalRevenue": 458700,
    "recentOrders": [...],
    "recentReviews": [...]
  }
}
```

### Products (Admin)

#### GET /api/admin/products
List all products (including hidden).

#### POST /api/admin/products
Create a new product.

**Request Body:**
```json
{
  "name": "New Tapestry",
  "slug": "new-tapestry",
  "description": "Beautiful handmade piece...",
  "priceCents": 14900,
  "stock": 5,
  "imageUrls": ["https://..."],
  "category": "wall-hanging",
  "featured": false,
  "hidden": false,
  "metaTitle": "Custom SEO Title",
  "metaDescription": "Custom meta description",
  "altText": "Image alt text",
  "tags": "boho,handmade",
  "materials": "100% cotton yarn",
  "colors": "cream,beige",
  "dimensions": "24 x 36 inches",
  "room": "living-room",
  "shippingWeightOz": 32,
  "shippingLengthIn": 24,
  "shippingWidthIn": 36,
  "shippingHeightIn": 4
}
```

#### GET /api/admin/products/[id]
Get single product details.

#### PUT /api/admin/products/[id]
Update a product.

#### DELETE /api/admin/products/[id]
Delete a product and its images.

### Orders (Admin)

#### GET /api/admin/orders
List all orders with details.

**Response:**
```json
{
  "orders": [
    {
      "id": "clx...",
      "stripeId": "cs_...",
      "totalCents": 17900,
      "shippingCents": 3000,
      "status": "paid",
      "items": [...],
      "customerEmail": "customer@example.com",
      "shippingAddress": {...},
      "trackingNumber": "9400...",
      "trackingUrl": "https://...",
      "labelUrl": "https://...",
      "carrier": "USPS",
      "shippingService": "Priority Mail",
      "labelCostCents": 850,
      "createdAt": "2024-01-15T...",
      "user": {
        "name": "Jane Doe",
        "email": "jane@example.com"
      }
    }
  ]
}
```

#### POST /api/admin/orders/[id]/refund-label
Refund an unused shipping label.

**Response:**
```json
{
  "success": true,
  "status": "submitted",
  "message": "Label refund submitted successfully"
}
```

### Reviews (Admin)

#### PATCH /api/reviews/[id]/approve
Approve a pending review.

#### PATCH /api/reviews/[id]/featured
Toggle featured status.

**Request Body:**
```json
{
  "featured": true
}
```

#### DELETE /api/reviews/[id]
Delete a review.

### File Uploads

#### POST /api/admin/upload
Upload image to S3.

**Request:** `multipart/form-data`
- `file`: Image file (JPEG, PNG, WebP, GIF)
- `folder`: Optional folder path (default: "products")

**Response:**
```json
{
  "url": "https://bucket.s3.amazonaws.com/products/abc123.jpg"
}
```

#### DELETE /api/admin/upload/[...path]
Delete image from S3.

**Example:** `DELETE /api/admin/upload/products/abc123.jpg`

### Theme Settings

#### GET /api/admin/themes
Get current theme settings.

#### PUT /api/admin/themes
Update theme settings.

**Request Body:**
```json
{
  "themeId": "nordic",
  "borderRadius": "rounded",
  "buttonStyle": "soft",
  "headingStyle": "uppercase",
  "accentColor": "forest",
  "fontScale": "default",
  "darkMode": "system"
}
```

### Sandbox Mode

#### GET /api/admin/sandbox
Get sandbox mode status.

#### PUT /api/admin/sandbox
Toggle sandbox mode.

**Request Body:**
```json
{
  "enabled": true
}
```

---

## Webhook Endpoints

### Stripe Webhook

#### POST /api/webhooks/stripe
Handles Stripe payment events.

**Events Handled:**
- `checkout.session.completed` - Creates order record
- `payment_intent.succeeded` - Updates order status
- `charge.dispute.created` - Logs dispute

**Headers Required:**
- `stripe-signature`: Webhook signature for verification

---

## Cron Endpoints

These endpoints are triggered by scheduled jobs (Vercel Cron).

### Cart Abandonment

#### POST /api/cron/cart-abandonment
Send abandoned cart reminder emails.

**Authorization:** Requires `CRON_SECRET` header.

### Review Requests

#### POST /api/cron/review-request
Send post-purchase review request emails.

### Win-back Campaigns

#### POST /api/cron/winback
Send re-engagement emails to inactive customers.

---

## Error Handling

All API errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional context
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

API endpoints are protected by rate limiting using Upstash Redis.

### Default Limits

| Endpoint Category | Requests | Window |
|-------------------|----------|--------|
| Checkout | 10 | 1 minute |
| Contact Form | 5 | 1 minute |
| Reviews | 10 | 1 minute |
| Admin Operations | 30 | 1 minute |
| General API | 60 | 1 minute |

### Rate Limit Response

When rate limited, endpoints return:

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMITED",
  "retryAfter": 45
}
```

**Headers:**
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets
- `Retry-After`: Seconds until retry (when limited)

---

## Stripe Configuration

### Test Cards

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 3220` | 3D Secure required |
| `4000 0000 0000 9995` | Insufficient funds |

### Webhook Events

Configure these events in Stripe Dashboard:
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.dispute.created`

---

## TypeScript Types

Key types are exported from `@/lib/types`:

```typescript
// Product types
interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  imageUrls: string[];
  stock: number;
  featured: boolean;
  hidden: boolean;
  category?: string;
  tags?: string;
  materials?: string;
  colors?: string;
  dimensions?: string;
  room?: string;
  metaTitle?: string;
  metaDescription?: string;
  altText?: string;
  shippingWeightOz?: number;
  shippingLengthIn?: number;
  shippingWidthIn?: number;
  shippingHeightIn?: number;
}

// Order types
interface OrderItem {
  productId: string;
  name: string;
  priceCents: number;
  quantity: number;
  imageUrl: string;
}

interface Order {
  id: string;
  userId: string;
  stripeId: string;
  totalCents: number;
  shippingCents: number;
  status: string;
  items: OrderItem[];
  customerEmail?: string;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  carrier?: string;
  shippingService?: string;
  labelCostCents?: number;
  createdAt: Date;
}

// Review types
interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  productName?: string;
  email?: string;
  imageUrls: string[];
  approved: boolean;
  featured: boolean;
  verified: boolean;
  createdAt: Date;
}
```

---

## SDK Usage Examples

### Fetch Products (Client)

```typescript
async function fetchProducts() {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}
```

### Create Checkout Session

```typescript
async function createCheckout(items: CartItem[]) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Checkout failed');
  }

  const { url } = await response.json();
  window.location.href = url;
}
```

### Admin: Update Product

```typescript
async function updateProduct(id: string, data: Partial<Product>) {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
```
