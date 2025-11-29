# Setup Guide - Bad Scandi E-Commerce

Complete step-by-step guide to get your Bad Scandi e-commerce site running.

## Overview

Your site is now on GitHub! Follow these steps to get it running locally and deploy to Vercel.

**Repository**: https://github.com/x907/website-badscandi

## Step 1: Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - Name: `badscandi`
   - Database Password: (generate a strong password - save it!)
   - Region: Choose closest to you
4. Wait for project to be created (~2 minutes)
5. Go to "Project Settings" → "Database"
6. Copy the "Connection string" (URI format)
   - It looks like: `postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres`
7. Save this - you'll need it for `DATABASE_URL`

## Step 2: Set Up Stripe

1. Go to [stripe.com](https://stripe.com) and sign in (or create account)
2. Click "Developers" → "API Keys"
3. Copy your **Publishable key** and **Secret key**
   - For testing, use the "Test mode" toggle
4. Save these keys

### Set Up Stripe Webhook (Do this after deploying to Vercel)

1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Enter your URL: `https://yourdomain.vercel.app/api/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
5. Copy the "Signing secret" (starts with `whsec_`)

## Step 3: Set Up OAuth Providers

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for local)
   - `https://yourdomain.vercel.app/api/auth/callback/google` (for production)
7. Copy Client ID and Client Secret

### Apple OAuth (Optional)

1. Go to [Apple Developer](https://developer.apple.com)
2. Sign in with your Apple ID
3. Go to "Certificates, IDs & Profiles"
4. Create a new "Services ID"
5. Configure Sign in with Apple
6. Add your domain and return URLs
7. Copy Service ID and generate a key

### Facebook OAuth (Optional)

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create a new app
3. Add "Facebook Login" product
4. Add valid OAuth redirect URIs
5. Copy App ID and App Secret

### Microsoft OAuth (Optional)

1. Go to [Azure Portal](https://portal.azure.com)
2. Register a new application
3. Add redirect URIs
4. Create a client secret
5. Copy Application (client) ID and client secret

## Step 4: Local Development Setup

1. Clone the repository (if not already):
```bash
cd /home/piconate/git/website-badscandi
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your values:
```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32

# WebAuthn
RP_NAME="Bad Scandi"
RP_ID="localhost"
RP_ORIGIN="http://localhost:3000"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Optional: Other OAuth providers
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""

# Stripe (from Stripe Dashboard)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET=""  # Leave empty for now, add after deployment
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

5. Generate NextAuth secret:
```bash
openssl rand -base64 32
```

6. Push database schema to Supabase:
```bash
npm run db:push
```

7. Seed sample products:
```bash
npm run db:seed
```

8. Start development server:
```bash
npm run dev
```

9. Open http://localhost:3000 in your browser!

## Step 5: Deploy to Vercel

1. Push to GitHub (already done):
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Go to [vercel.com](https://vercel.com)

3. Click "Add New" → "Project"

4. Import your repository: `x907/website-badscandi`

5. Configure project:
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

6. Add Environment Variables:

Click "Environment Variables" and add all variables from your `.env` file, BUT update these for production:

```env
# Update these for production:
NEXTAUTH_URL="https://your-domain.vercel.app"
RP_ID="your-domain.vercel.app"
RP_ORIGIN="https://your-domain.vercel.app"

# Rest stays the same (copy from .env)
DATABASE_URL="..."
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
# etc...
```

7. Click "Deploy"

8. Wait for deployment (~2 minutes)

## Step 6: Post-Deployment Setup

### Update OAuth Redirect URIs

1. Go back to Google Cloud Console (and other OAuth providers)
2. Add production redirect URI:
   - `https://your-domain.vercel.app/api/auth/callback/google`
3. Save changes

### Set Up Stripe Webhook

1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Add endpoint: `https://your-domain.vercel.app/api/stripe-webhook`
3. Select event: `checkout.session.completed`
4. Copy the webhook signing secret
5. In Vercel, add environment variable:
   - `STRIPE_WEBHOOK_SECRET`: `whsec_...`
6. Redeploy your app in Vercel

### Test Your Site!

1. Visit your Vercel URL
2. Browse products
3. Sign in with Google
4. Enroll a passkey
5. Try purchasing a product (use test card: `4242 4242 4242 4242`)
6. Check your account page for orders
7. Verify webhook worked (order appears in database)

## Step 7: Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate (~5 minutes)
5. Update environment variables:
   - `NEXTAUTH_URL`: `https://yourdomain.com`
   - `RP_ID`: `yourdomain.com`
   - `RP_ORIGIN`: `https://yourdomain.com`
6. Update OAuth redirect URIs with new domain

## Database Management

### View Database
```bash
npm run db:studio
```
Opens Prisma Studio at http://localhost:5555

### Add Products

Use Prisma Studio or add to `prisma/seed.ts` and run:
```bash
npm run db:seed
```

### Update Schema

1. Edit `prisma/schema.prisma`
2. Push changes:
```bash
npm run db:push
```

## Troubleshooting

### "Failed to fetch"
- Check if API routes are accessible
- Verify environment variables are set
- Check Vercel deployment logs

### Passkey not working
- Passkeys require HTTPS (works on localhost or production)
- Check browser compatibility (Chrome, Safari, Edge recommended)
- Verify `RP_ID` matches your domain

### Stripe webhook failing
- Verify webhook secret is set
- Check webhook endpoint is accessible
- View webhook logs in Stripe Dashboard

### Database connection issues
- Check `DATABASE_URL` is correct
- Verify IP allowlist in Supabase (should be disabled for serverless)
- Check connection pooler settings

## Production Checklist

Before launching:

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Switch Stripe to production mode
- [ ] Update Stripe webhook with production URL
- [ ] Update OAuth redirect URIs with production domain
- [ ] Test full purchase flow
- [ ] Test passkey enrollment and login
- [ ] Set up monitoring (Vercel Analytics)
- [ ] Configure custom domain
- [ ] Add real product data
- [ ] Test on mobile devices

## Next Steps

1. **Add More Products**: Edit `prisma/seed.ts` or use Prisma Studio
2. **Customize Design**: Edit Tailwind classes in components
3. **Add More OAuth Providers**: Uncomment in `lib/auth.ts`
4. **Add Email Notifications**: Integrate with Resend or SendGrid
5. **Add Product Images**: Use Cloudinary or Vercel Blob
6. **Analytics**: Add Vercel Analytics or Google Analytics
7. **SEO**: Add metadata to pages
8. **Blog**: Create `/app/blog` for content marketing

## Support

- **Documentation**: See [README.md](./README.md)
- **Issues**: Open a GitHub issue
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **SimpleWebAuthn Docs**: https://simplewebauthn.dev

---

Built with ❤️ using Next.js 15, TypeScript, and native passkey authentication.
