# Disaster Recovery Guide

Complete step-by-step guide to restore Bad Scandi from scratch if all infrastructure is lost.

## Prerequisites

Before starting, you need access to:
- This GitHub repository
- A credit card for cloud services (most have free tiers)
- 2-4 hours of uninterrupted time

## Recovery Order

Follow these sections in order:

1. [Database (Supabase)](#1-database-supabase)
2. [AWS Services (S3, SES)](#2-aws-services-s3-ses)
3. [Upstash Redis (Rate Limiting)](#3-upstash-redis-rate-limiting)
4. [Stripe (Payments)](#4-stripe-payments)
5. [OAuth Providers](#5-oauth-providers)
6. [Vercel (Hosting)](#6-vercel-hosting)
7. [Post-Deployment Verification](#7-post-deployment-verification)

---

## 1. Database (Supabase)

### Create New Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Configure:
   - **Name**: `badscandi`
   - **Database Password**: Generate strong password and **SAVE IT**
   - **Region**: `us-west-2` (or closest to your users)
4. Wait 2-3 minutes for project creation

### Get Connection Strings

1. Go to **Settings** → **Database**
2. Copy the **Connection string** (URI format):
   - Replace `[YOUR-PASSWORD]` with your database password
   - This is your `DATABASE_URL`
3. For `DIRECT_URL`:
   - Same connection string but use port `5432` instead of `6543`
   - Remove `?pgbouncer=true` if present

**Example:**
```
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-us-west-2.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.xxxx:password@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

### Push Schema

```bash
cd /path/to/website-badscandi
npm install
npx prisma db push
```

### Seed Sample Data (Optional)

```bash
npm run db:seed
```

### Data Recovery Notes

**UNRECOVERABLE DATA:**
- User accounts and authentication credentials
- Order history and customer data
- Review submissions and images
- Shopping cart contents
- Audit logs

**RECOVERABLE FROM STRIPE:**
- Payment records (via Stripe Dashboard → Payments)
- Customer email addresses (via Stripe Dashboard → Customers)

---

## 2. AWS Services (S3, SES)

### Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam/)
2. **Users** → **Create user**
3. Name: `badscandi-app`
4. **Attach policies directly**:
   - `AmazonS3FullAccess` (or custom policy below)
   - `AmazonSESFullAccess` (or custom policy below)
5. **Create access key**:
   - Select "Application running outside AWS"
   - **SAVE** the Access Key ID and Secret Access Key immediately

**Custom IAM Policy (Recommended - Least Privilege):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::badscandi-assets/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

### Create S3 Bucket

1. Go to [S3 Console](https://s3.console.aws.amazon.com/)
2. **Create bucket**:
   - Name: `badscandi-assets` (must be globally unique)
   - Region: `us-east-1` (or your preferred region)
   - **Uncheck** "Block all public access"
   - Acknowledge the warning
3. After creation, go to bucket → **Permissions** → **Bucket policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadProducts",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::badscandi-assets/products/*"
    },
    {
      "Sid": "PublicReadReviews",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::badscandi-assets/reviews/*"
    }
  ]
}
```

4. Go to **Permissions** → **CORS**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://badscandi.com", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Configure SES

1. Go to [SES Console](https://console.aws.amazon.com/ses/)
2. **Verified identities** → **Create identity**
3. Select **Domain** and enter your domain (e.g., `badscandi.com`)
4. Add the DNS records to your domain provider
5. Wait for verification (up to 72 hours, usually faster)

**For immediate testing (Sandbox mode):**
- Verify individual email addresses
- Can only send TO verified addresses

**For production:**
1. Go to **Account dashboard** → **Request production access**
2. Fill out the form explaining your use case
3. Wait for approval (usually 24 hours)

---

## 3. Upstash Redis (Rate Limiting)

1. Go to [upstash.com](https://upstash.com) and sign in
2. **Create database**:
   - Name: `badscandi-ratelimit`
   - Region: Closest to your users
   - Type: Regional
3. Go to database → **REST API**
4. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 4. Stripe (Payments)

### Recover or Create Account

1. Go to [stripe.com](https://stripe.com)
2. If existing account: Sign in and get API keys
3. If new account: Complete onboarding

### Get API Keys

1. **Developers** → **API keys**
2. Copy:
   - Publishable key (`pk_live_...` or `pk_test_...`)
   - Secret key (`sk_live_...` or `sk_test_...`)

### Create Webhook

1. **Developers** → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the **Signing secret** (`whsec_...`)

---

## 5. OAuth Providers

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project or select existing
3. **APIs & Services** → **Credentials** → **Create OAuth client ID**
4. Type: Web application
5. Authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret

### Apple OAuth (Optional)

1. Go to [Apple Developer](https://developer.apple.com)
2. Create Services ID for Sign in with Apple
3. Configure redirect URLs
4. Generate private key

### Other Providers

See [Better Auth documentation](https://www.better-auth.com/docs/authentication/social-sign-in) for Facebook and Microsoft setup.

---

## 6. Vercel (Hosting)

### Deploy Project

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Add New** → **Project**
3. Import `website-badscandi` repository
4. Configure environment variables (see below)
5. Deploy

### Environment Variables

Add ALL of these in Vercel project settings:

```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Better Auth / WebAuthn
RP_NAME=Bad Scandi
RP_ID=badscandi.com
RP_ORIGIN=https://badscandi.com

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=badscandi-assets
EMAIL_FROM=noreply@badscandi.com
CONTACT_EMAIL=hello@badscandi.com

# Upstash
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional
EASYPOST_API_KEY=...
CRON_SHARED_SECRET=... (generate with: openssl rand -hex 32)

# Site
NEXT_PUBLIC_SITE_URL=https://badscandi.com
```

### Configure Cron Jobs

Add `vercel.json` to project root (already in repo after this recovery guide):

```json
{
  "crons": [
    {
      "path": "/api/cron/cart-abandonment",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/review-request",
      "schedule": "0 11 * * *"
    },
    {
      "path": "/api/cron/winback",
      "schedule": "0 12 * * *"
    }
  ]
}
```

### Configure Domain

1. Vercel project → **Settings** → **Domains**
2. Add `badscandi.com`
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

---

## 7. Post-Deployment Verification

### Checklist

Run through this checklist after deployment:

- [ ] Homepage loads correctly
- [ ] Product pages display (images may be missing)
- [ ] Sign in with Google works
- [ ] Passkey enrollment works
- [ ] Test Stripe checkout (use test mode first)
- [ ] Contact form sends emails
- [ ] Admin panel accessible at `/admin`
- [ ] API endpoints return 200 (not 500)

### Test Commands

```bash
# Test homepage
curl -I https://badscandi.com

# Test API health
curl https://badscandi.com/api/health

# Test email (replace with verified email)
npm run test:ses your-email@example.com
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 errors | Missing env vars | Check Vercel logs, add missing vars |
| Images not loading | S3 not configured | Check bucket policy and CORS |
| Emails not sending | SES not verified | Verify domain or request production access |
| OAuth fails | Wrong redirect URI | Update in provider console |
| Payments fail | Webhook secret wrong | Regenerate in Stripe dashboard |

---

## Data Recovery from Stripe

If you had active customers, you can recover some data from Stripe:

1. **Stripe Dashboard** → **Payments** - See all historical transactions
2. **Stripe Dashboard** → **Customers** - Export customer emails
3. Use Stripe API to export order details:

```bash
stripe payments list --limit 100 > payments.json
stripe customers list --limit 100 > customers.json
```

---

## Backup Recommendations

To prevent future data loss:

### Database Backups

1. **Supabase automatic backups**: Available on Pro plan
2. **Manual backup script**:

```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Import database
psql $DATABASE_URL < backup.sql
```

3. **Schedule regular backups**: Use GitHub Actions or cron job

### S3 Backups

1. Enable S3 versioning on the bucket
2. Use AWS Backup for automated snapshots
3. Or sync to another bucket:

```bash
aws s3 sync s3://badscandi-assets s3://badscandi-backups
```

### Secrets Management

1. Store a copy of all API keys in a password manager (1Password, Bitwarden)
2. Document which accounts hold which credentials
3. Set calendar reminders for key rotation

---

## Emergency Contacts

Document these for your team:

| Service | Dashboard URL | Account Email |
|---------|--------------|---------------|
| Supabase | supabase.com/dashboard | your-email |
| AWS | console.aws.amazon.com | your-email |
| Stripe | dashboard.stripe.com | your-email |
| Vercel | vercel.com/dashboard | your-email |
| Google Cloud | console.cloud.google.com | your-email |
| Domain Registrar | (your registrar) | your-email |

---

## Recovery Time Estimates

| Component | Time to Restore | Blocking Issues |
|-----------|-----------------|-----------------|
| Database schema | 15 minutes | None |
| Database data | PERMANENT LOSS | Cannot recover customer data |
| AWS IAM + S3 | 30 minutes | None |
| AWS SES | 30 min - 72 hours | Domain verification |
| Stripe | 15 minutes | Need account access |
| OAuth | 30 minutes | None |
| Vercel deploy | 15 minutes | None |
| Product images | PERMANENT LOSS | Must re-upload |
| **Total (code only)** | **2-4 hours** | |
| **Total (with data)** | **INCOMPLETE** | Customer/order data unrecoverable |

---

## Prevention Checklist

Implement these to make future recovery easier:

- [ ] Enable Supabase automatic backups (Pro plan)
- [ ] Enable S3 versioning
- [ ] Store all credentials in password manager
- [ ] Document all account logins
- [ ] Test backup restoration quarterly
- [ ] Set up monitoring/alerts for downtime
