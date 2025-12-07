# Admin Dashboard & S3 Setup Guide

This guide covers the complete admin dashboard functionality including product management, order management, review moderation, and S3 image storage.

## Table of Contents

1. [Admin User Setup](#admin-user-setup)
2. [Admin Dashboard Overview](#admin-dashboard-overview)
3. [Product Management](#product-management)
4. [Order Management](#order-management)
5. [Review Moderation](#review-moderation)
6. [AWS S3 Configuration](#aws-s3-configuration-for-images)
7. [Security Features](#security-features)

---

## Admin User Setup

### Making a User an Admin

After a user signs up/logs in to the site, you need to manually set them as an admin in the database.

#### Option 1: Using Prisma Studio (Development)

```bash
npx prisma studio
```

1. Navigate to the `User` table
2. Find the user's record by email
3. Set `isAdmin` to `true`
4. Save the changes

#### Option 2: Using Database Query (Production)

Connect to your database and run:

```sql
UPDATE "User"
SET "isAdmin" = true
WHERE email = 'your-email@example.com';
```

#### Option 3: Using Prisma Client

Create a script `scripts/make-admin.ts`:

```typescript
import { db } from "../lib/db";

async function makeAdmin(email: string) {
  const user = await db.user.update({
    where: { email },
    data: { isAdmin: true },
  });

  console.log(`User ${user.email} is now an admin`);
}

// Usage
makeAdmin("your-email@example.com")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Run it with:
```bash
npx tsx scripts/make-admin.ts
```

---

## Admin Dashboard Overview

### Accessing the Dashboard

1. Sign in to the site as an admin user
2. You'll see an "Admin" link in the header (Settings icon)
3. Navigate to `/admin` to access the dashboard

### Dashboard Features

The main dashboard (`/admin`) shows:
- **Total Products**: Count of all products
- **Total Orders**: Count of all orders
- **Pending Reviews**: Reviews awaiting moderation
- **Recent Activity**: Latest orders and reviews

---

## Product Management

### Viewing Products

Navigate to `/admin/products` to see all products in a data table with:
- Name, price, stock, category
- Featured status
- Edit/Delete actions

### Creating Products

1. Click "Add Product" button
2. Fill in required fields:
   - **Name**: Product title
   - **Slug**: URL-friendly identifier (auto-generated from name)
   - **Description**: Product description
   - **Price**: In cents (e.g., 14900 = $149.00)
   - **Stock**: Inventory count
3. Optional fields:
   - **Category**: Product category
   - **Tags**: Comma-separated tags
   - **Materials**: Product materials
   - **Colors**: Available colors
   - **Dimensions**: Size information
   - **Room**: Suggested room placement
4. SEO fields:
   - **Meta Title**: Custom Google title
   - **Meta Description**: Search snippet
   - **Alt Text**: Image description for accessibility

### Uploading Product Images

Products support multiple images:

1. In the product editor, click "Upload Image"
2. Select one or more images (JPEG, PNG, WebP, GIF)
3. Images are automatically:
   - Uploaded to AWS S3
   - Given random unique filenames
   - Made publicly accessible
4. First image becomes the primary image
5. Drag to reorder images
6. Click X to delete an image

**Image Requirements**:
- Max file size: 10MB
- Supported formats: JPEG, PNG, WebP, GIF
- Images are stored in S3 under `products/` folder

### Editing Products

1. Click the edit icon on any product row
2. Modify any field
3. Click "Save" to update
4. Changes are logged in the audit trail

### Deleting Products

1. Click the delete icon on any product row
2. Confirm deletion
3. All associated S3 images are automatically deleted
4. Deletion is logged in the audit trail

---

## Order Management

### Viewing Orders

Navigate to `/admin/orders` to see all orders with:
- Order ID, customer email
- Total amount, status
- Created date
- View details action

### Order Statuses

- **pending**: Payment initiated
- **paid**: Payment completed
- **shipped**: Order shipped
- **delivered**: Order delivered
- **cancelled**: Order cancelled
- **refunded**: Payment refunded

### Order Details

Click any order to see:
- Customer information
- Shipping address
- Order items with quantities
- Payment details
- Shipping tracking (if available)

### Refunding Orders

1. Open order details
2. Click "Refund" button
3. Confirm refund amount
4. Stripe processes the refund
5. Order status updates to "refunded"
6. Action is logged in audit trail

---

## Review Moderation

### Review Workflow

1. Customer submits a review (with optional photos)
2. Review appears in admin panel as "pending"
3. Admin reviews and approves/rejects
4. Approved reviews appear on the site
5. Featured reviews appear on homepage

### Viewing Reviews

Navigate to `/admin/reviews` to see:
- Tabs: All, Pending, Approved
- Review content, rating, photos
- Customer name and date
- Product being reviewed

### Approving Reviews

1. Click on a pending review
2. Review the content and photos
3. Click "Approve" to publish
4. Review appears on product page

### Featuring Reviews

1. Open an approved review
2. Click "Feature" to highlight
3. Featured reviews appear on homepage
4. Maximum 3-5 featured reviews recommended

### Rejecting Reviews

1. Open a review
2. Click "Reject" to hide
3. Review won't appear on site
4. Consider adding rejection reason

---

## AWS S3 Configuration for Images

### 1. Create an S3 Bucket

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)
2. Create a new bucket (e.g., `badscandi-reviews`)
3. Configure bucket settings:
   - **Block Public Access**: Disable (we need public-read access for images)
   - **Bucket Policy**: Add the following policy to allow public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::badscandi-reviews/*"
    }
  ]
}
```

### 2. Create IAM User for S3 Access

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new user with programmatic access
3. Attach the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::badscandi-reviews/*"
    }
  ]
}
```

4. Save the Access Key ID and Secret Access Key

### 3. Add Environment Variables

Add these to your `.env` file:

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET_NAME=badscandi-reviews
```

---

## Security Features

### Authentication & Authorization

- **Admin Check**: All admin routes verify `isAdmin` flag on the user
- **Server-Side Validation**: Every API request checks authentication via `requireAdmin()`
- **Redirect Protection**: Non-admin users redirected to homepage

### Rate Limiting

Admin endpoints are protected with rate limiting (Upstash Redis):
- Standard admin operations: 30 requests/minute
- Prevents API abuse and brute force attempts

### Input Validation

All input is validated with Zod schemas:
- XSS sanitization (HTML tags, JavaScript removed)
- Field length limits
- Format validation (slugs, emails, etc.)

### Audit Logging

All admin actions are logged to the `AuditLog` table:
- Who performed the action (user ID, email)
- What was changed (action type, entity type)
- When it happened (timestamp)
- Where from (IP address, user agent)

View audit logs in Prisma Studio:
```bash
npx prisma studio
# Navigate to AuditLog table
```

### Content Security Policy

The site includes CSP headers to prevent XSS:
- Scripts limited to trusted sources (Stripe, Google, Apple)
- Images allowed from S3 and data URIs
- Frame ancestors restricted

---

## Testing

1. **Test Admin Access**:
   - Sign in as admin
   - Verify "Admin" link appears in header
   - Navigate to `/admin`

2. **Test Product Management**:
   - Create a new product with images
   - Edit the product
   - Delete the product
   - Verify images are removed from S3

3. **Test Order Management**:
   - Place a test order
   - View order in admin panel
   - Test refund flow (with test mode)

4. **Test Review Moderation**:
   - Submit a review as a customer
   - Approve/reject in admin panel
   - Feature a review
   - Verify it appears on homepage

5. **Test S3 Upload**:
   - Upload product images
   - Check S3 bucket for files
   - Delete product, verify images removed

---

## API Endpoints Reference

### Products
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `GET /api/admin/products/[id]` - Get single product
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product

### Orders
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/[id]` - Get order details
- `POST /api/admin/orders/[id]/refund-label` - Generate refund label

### Reviews
- `GET /api/reviews` - List reviews (with filters)
- `PUT /api/reviews/[id]` - Update review
- `DELETE /api/reviews/[id]` - Delete review
- `POST /api/reviews/[id]/approve` - Approve review
- `POST /api/reviews/[id]/featured` - Toggle featured status

### Uploads
- `POST /api/admin/upload` - Upload image to S3
- `DELETE /api/admin/upload/[...path]` - Delete image from S3

### Dashboard
- `GET /api/admin/dashboard` - Get dashboard stats
