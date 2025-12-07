# Deployment Checklist - Bad Scandi

Complete step-by-step guide to get your fiber art e-commerce site live!

## 📋 Overview

**Time to complete**: 2-3 hours
**Cost**: Free tier available for everything except domain ($10-15/year)

---

## Phase 1: Set Up Required Services (45 mins)

### ✅ 1. Supabase (Database) - FREE

**What**: PostgreSQL database for your products, users, orders

**Steps**:
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign in with GitHub
3. Create new project:
   - Name: `badscandi`
   - Database Password: **Generate strong password & save it!**
   - Region: Choose closest to your users
4. Wait 2-3 minutes for setup
5. Go to Settings → Database
6. Copy **Connection String** (looks like: `postgresql://postgres:[password]@...`)
7. **Save this** - you'll need it for `DATABASE_URL`

**Cost**: FREE (up to 500MB database)

---

### ✅ 2. Stripe (Payments) - FREE

**What**: Process credit card payments

**Steps**:
1. Go to [stripe.com](https://stripe.com)
2. Sign up for account
3. **Skip** "Activate your account" for now (test mode is fine)
4. Click "Developers" → "API Keys"
5. Toggle "Viewing test data" ON (top right)
6. Copy these keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (click "Reveal")
7. **Save both keys**

**Note**: You'll set up webhooks AFTER deploying to Vercel

**Cost**: FREE (2.9% + 30¢ per transaction)

---

### ✅ 3. Google OAuth (Sign In with Google) - FREE

**What**: Let customers sign in with Google accounts

**Steps**:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: "Bad Scandi"
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Configure consent screen (first time):
   - User Type: External
   - App name: "Bad Scandi"
   - User support email: your email
   - Developer contact: your email
   - Save
6. Create OAuth client ID:
   - Application type: "Web application"
   - Name: "Bad Scandi Web"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for local dev)
     - `https://your-site.vercel.app/api/auth/callback/google` (add after deploying)
7. Copy **Client ID** and **Client Secret**
8. **Save both**

**Cost**: FREE

---

### ✅ 4. Optional Services (Skip for now, add later)

**Google Analytics** (tracking):
- Sign up at [analytics.google.com](https://analytics.google.com)
- Create property → Get Measurement ID (`G-XXXXXXXXXX`)

**Meta Pixel** (Facebook/Instagram ads):
- Sign up at [business.facebook.com](https://business.facebook.com/events_manager2)
- Create pixel → Get Pixel ID

**Pinterest Tag** (Pinterest ads):
- Sign up at [ads.pinterest.com](https://ads.pinterest.com)
- Create tag → Get Tag ID

**AWS SES** (transactional emails):
- See AWS_SES_SETUP.md for detailed instructions
- Create IAM user with SES permissions
- Verify your email/domain in SES Console

---

## Phase 2: Local Setup (15 mins)

### ✅ 5. Install Dependencies

```bash
cd /home/piconate/git/website-badscandi
npm install
```

---

### ✅ 6. Set Up Environment Variables

Create `.env` file:

```bash
cp .env.example .env
nano .env
```

Fill in your values:

```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Better Auth - WebAuthn (Passkeys) Configuration
RP_NAME="Bad Scandi"
RP_ID="localhost"
RP_ORIGIN="http://localhost:3000"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Leave these empty for now (optional OAuth)
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""

# Stripe (from Stripe Dashboard - TEST MODE)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET=""  # Leave empty for now, add after Vercel deploy
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."  # Same as above

# AWS SES Email (See AWS_SES_SETUP.md for details)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""  # IAM Access Key ID (NOT SMTP credentials)
AWS_SECRET_ACCESS_KEY=""  # IAM Secret Access Key
EMAIL_FROM="noreply@yourdomain.com"  # Verified sender email
CONTACT_EMAIL="hello@yourdomain.com"  # Where contact form goes

# Analytics (Optional - leave empty to disable)
NEXT_PUBLIC_GA_ID=""
NEXT_PUBLIC_META_PIXEL_ID=""
NEXT_PUBLIC_PINTEREST_TAG_ID=""

# Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**Save the file** (Ctrl+X, Y, Enter)

---

### ✅ 7. Set Up Database

Push schema to Supabase:

```bash
npm run db:push
```

You should see: ✅ "Database schema synchronized"

---

### ✅ 8. Seed Sample Products

Add 6 fiber art products:

```bash
npm run db:seed
```

You should see:
```
Created/Updated product: Neutral Boho Wall Hanging Tapestry - Hand Dyed
Created/Updated product: Large Macrame Wall Hanging for Living Room
...
Seeding completed!
```

---

### ✅ 9. Test Locally

Start dev server:

```bash
npm run dev
```

Visit: http://localhost:3000

**Test these**:
- ✅ Homepage loads with fiber art copy
- ✅ Shop page shows 6 products
- ✅ Click a product → Product detail page
- ✅ Contact form works
- ✅ Sign in with Google (should work!)

**Don't test checkout yet** - Stripe webhooks need Vercel URL

---

## Phase 3: Deploy to Vercel (30 mins)

### ✅ 10. Push Latest Code to GitHub

```bash
cd /home/piconate/git/website-badscandi
git add .
git status  # Check what's being committed
git commit -m "Ready for production deployment"
git push origin main
```

---

### ✅ 11. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import `x907/website-badscandi`
5. Configure:
   - Framework Preset: Next.js (auto-detected) ✅
   - Root Directory: `./` ✅
   - Build Command: `npm run build` ✅

**Don't click Deploy yet!**

---

### ✅ 12. Add Environment Variables in Vercel

Click "Environment Variables" tab

Add each variable from your `.env` file, but **UPDATE THESE**:

```env
# Use production values!
RP_ID="your-project-name.vercel.app"
RP_ORIGIN="https://your-project-name.vercel.app"
NEXT_PUBLIC_SITE_URL="https://your-project-name.vercel.app"

# Everything else: copy from your .env file
DATABASE_URL="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
STRIPE_SECRET_KEY="..."
STRIPE_PUBLISHABLE_KEY="..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="..."
AWS_REGION="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
EMAIL_FROM="..."
CONTACT_EMAIL="..."
```

**Tip**: Leave `STRIPE_WEBHOOK_SECRET` empty for now

---

### ✅ 13. Deploy!

Click "Deploy"

Wait 2-3 minutes...

**Success!** You'll see: ✅ "Your project has been deployed"

**Copy your URL**: `https://your-project-name.vercel.app`

---

## Phase 4: Post-Deployment Setup (30 mins)

### ✅ 14. Update Google OAuth

1. Go back to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Click your OAuth client
4. Add redirect URI:
   - `https://your-project-name.vercel.app/api/auth/callback/google`
5. Save

---

### ✅ 15. Set Up Stripe Webhook

**Why**: So completed orders get saved to your database

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure "Viewing test data" is ON (top right)
3. Click "Developers" → "Webhooks"
4. Click "Add endpoint"
5. Endpoint URL: `https://your-project-name.vercel.app/api/stripe-webhook`
6. Select events to listen for:
   - Click "Select events"
   - Check: `checkout.session.completed`
   - Click "Add events"
7. Click "Add endpoint"
8. Click your new webhook
9. Copy "Signing secret" (starts with `whsec_`)
10. Go to Vercel → Your Project → Settings → Environment Variables
11. Add new variable:
    - Key: `STRIPE_WEBHOOK_SECRET`
    - Value: `whsec_...`
    - Environment: Production
12. Click "Save"
13. Redeploy your site (Vercel → Deployments → ⋯ → "Redeploy")

---

### ✅ 16. Test Your Live Site!

Visit: `https://your-project-name.vercel.app`

**Test everything**:

1. **Homepage**: ✅ Loads properly
2. **Shop**: ✅ Shows fiber art products
3. **Product page**: ✅ Images, details, pricing
4. **Sign in with Google**: ✅ Works
5. **Enroll passkey** (after signing in): ✅ Works (use fingerprint/face ID)
6. **Contact form**: ✅ Submits (won't send email yet without Resend)
7. **Test purchase**:
   - Sign in
   - Click product → "Purchase Now"
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete purchase
   - Go to Account page → See order! ✅

---

## Phase 5: Optional Enhancements

### ✅ 17. Add Custom Domain (Optional - $10-15/year)

**Buy domain**:
- Namecheap, Google Domains, Cloudflare, etc.
- Search for: `badscandi.com` or similar

**Add to Vercel**:
1. Vercel → Your Project → Settings → Domains
2. Add domain: `badscandi.com`
3. Follow DNS instructions
4. Wait 5-30 minutes for DNS to propagate
5. **Update environment variables**:
   - `RP_ID="badscandi.com"`
   - `RP_ORIGIN="https://badscandi.com"`
   - `NEXT_PUBLIC_SITE_URL="https://badscandi.com"`
6. Redeploy
7. **Update Google OAuth** redirect URI with new domain

**SSL**: Automatic via Vercel (free Let's Encrypt) ✅

---

### ✅ 18. Set Up Google Search Console (Free SEO)

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property → Your domain
3. Verify ownership (DNS or HTML file)
4. Submit sitemap: `https://yourdomain.com/sitemap.xml`
5. Wait 1-2 weeks → See traffic in Google Search!

---

### ✅ 19. Enable Contact Form Emails

**With AWS SES** (see AWS_SES_SETUP.md for details):

1. Create IAM user with SES permissions
2. Verify your sender email in AWS SES Console
3. Add to Vercel environment variables:
   - `AWS_REGION="us-east-1"`
   - `AWS_ACCESS_KEY_ID="AKIA..."`
   - `AWS_SECRET_ACCESS_KEY="..."`
   - `EMAIL_FROM="noreply@badscandi.com"`
   - `CONTACT_EMAIL="hello@badscandi.com"`
4. Request SES production access (to send to any email)
5. Redeploy

Now contact form and magic link emails work! ✅

---

### ✅ 20. Add Analytics (Optional - Free)

**Google Analytics**:
1. Get Measurement ID from analytics.google.com
2. Add to Vercel: `NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"`
3. Redeploy

**Meta Pixel** (for Facebook/Instagram ads):
1. Get Pixel ID from business.facebook.com
2. Add to Vercel: `NEXT_PUBLIC_META_PIXEL_ID="123456789"`
3. Redeploy

**Pinterest Tag**:
1. Get Tag ID from ads.pinterest.com
2. Add to Vercel: `NEXT_PUBLIC_PINTEREST_TAG_ID="123456789"`
3. Redeploy

---

## Phase 6: Replace Sample Products (Anytime)

### ✅ 21. Add Your Real Products

**Option 1: Via Prisma Studio** (Easy, visual):

```bash
npm run db:studio
```

Opens: http://localhost:5555

- Click "Product" table
- Click "Add record"
- Fill in your fiber art details
- Click "Save"

**Option 2: Edit seed file**:

1. Edit `/prisma/seed.ts`
2. Replace products with your real ones
3. Run: `npm run db:seed`

**Required fields**:
- `slug` - URL-friendly (e.g., "my-wall-hanging")
- `name` - Product name
- `description` - SEO-optimized description
- `priceCents` - Price in cents (e.g., 14900 = $149.00)
- `imageUrl` - Full URL to image
- `stock` - Inventory count

**Optional but recommended for SEO**:
- `metaTitle` - Custom Google title
- `metaDescription` - Search snippet
- `altText` - Image description
- `category` - wall-hanging, tapestry, macrame
- `tags` - boho,hand-dyed,neutral (comma-separated)
- `materials` - "100% cotton yarn"
- `colors` - cream,beige,natural
- `dimensions` - "24 x 36 inches"
- `room` - living-room,bedroom

---

## ✅ Completion Checklist

Use this to track your progress:

### Services
- [ ] Supabase account created
- [ ] Database connection string saved
- [ ] Stripe account created (test mode)
- [ ] Stripe API keys saved
- [ ] Google OAuth configured
- [ ] OAuth redirect URIs added

### Local Development
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created and filled
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Sample products seeded (`npm run db:seed`)
- [ ] Local site tested (`npm run dev`)

### Deployment
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added to Vercel
- [ ] Site deployed successfully
- [ ] Google OAuth updated with Vercel URL
- [ ] Stripe webhook configured
- [ ] Webhook secret added to Vercel
- [ ] Site redeployed after webhook setup

### Testing
- [ ] Homepage loads
- [ ] Shop shows products
- [ ] Product pages work
- [ ] Google sign-in works
- [ ] Passkey enrollment works
- [ ] Test purchase completes
- [ ] Order appears in account
- [ ] Contact form submits

### Optional
- [ ] Custom domain added
- [ ] DNS configured
- [ ] Environment variables updated for domain
- [ ] Google Search Console set up
- [ ] Sitemap submitted
- [ ] Analytics added (GA4/Meta/Pinterest)
- [ ] AWS SES configured for emails
- [ ] Real products added

---

## 🎉 Success!

Once you've completed the main checklist, your site is LIVE!

**Your fiber art e-commerce store is now**:
- ✅ Accepting orders via Stripe
- ✅ Secure authentication (Google + passkeys)
- ✅ SEO-optimized for Google
- ✅ Mobile responsive
- ✅ Analytics ready
- ✅ Professional contact form

---

## 🆘 Troubleshooting

### "Can't connect to database"
- Check `DATABASE_URL` is correct
- Check Supabase project is active
- Verify password has no special chars that need escaping

### "OAuth error"
- Check redirect URI exactly matches (trailing slash matters!)
- Verify Google OAuth consent screen is configured
- Make sure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### "Stripe webhook not working"
- Check webhook endpoint URL is exact
- Verify `STRIPE_WEBHOOK_SECRET` is set in Vercel
- Make sure you selected `checkout.session.completed` event
- Check Stripe dashboard → Webhooks → Your webhook → "Requests" tab for errors

### "Passkeys not working"
- Passkeys require HTTPS (works on localhost or deployed Vercel)
- Check `RP_ID` matches your domain
- Verify `RP_ORIGIN` is full URL with https://

### Build fails in Vercel
- Check all environment variables are set
- Verify `DATABASE_URL` is accessible from Vercel
- Check build logs for specific error

---

## 📚 Documentation

- **README.md** - Project overview
- **SETUP_GUIDE.md** - Detailed setup
- **AWS_SES_SETUP.md** - Email setup (magic links, contact form)
- **ADMIN_SETUP.md** - Admin dashboard & S3 storage
- **SEO_GUIDE.md** - SEO strategy & keywords
- **ANALYTICS_SETUP.md** - Tracking pixels
- **AUTOMATION_SETUP.md** - GitHub Actions & auto-deploys
- **DEPLOYMENT_CHECKLIST.md** ← You are here

---

## 🎯 Next Steps After Launch

1. **Week 1**: Monitor orders, fix any issues
2. **Week 2**: Add real product photos
3. **Week 3**: Start Instagram marketing
4. **Month 2**: Run first Meta ads campaign
5. **Ongoing**: Add new products, blog posts for SEO

---

**Questions?** Check the other guides or open a GitHub issue!

**Ready to launch?** Let's do this! 🚀
