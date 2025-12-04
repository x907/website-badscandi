# Bad Scandi E-Commerce

A modern, minimalist e-commerce platform built with Next.js 15, featuring native passkey authentication and Stripe payments.

## Features

- **Modern Stack**: Next.js 15 App Router, TypeScript, Tailwind CSS
- **Native Passkey Auth**: WebAuthn/Passkeys via SimpleWebAuthn (no third-party auth service)
- **Social Login**: Google, Apple, Facebook, Microsoft OAuth via NextAuth
- **Payments**: Stripe Checkout integration with automatic order creation
- **Email Integration**: AWS SES for magic link authentication & contact form
- **Database**: Supabase PostgreSQL with Prisma ORM
- **UI Components**: shadcn/ui with Scandinavian minimalist design
- **Analytics**: Google Analytics 4, Meta Pixel, Pinterest Tag (optional)
- **Auto-Deploy**: Vercel with GitHub integration

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: NextAuth.js v5 + SimpleWebAuthn
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Payments**: Stripe
- **Email**: AWS SES (via AWS SDK, not SMTP)
- **Analytics**: Google Analytics 4, Meta Pixel, Pinterest Tag
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (PostgreSQL database)
- Stripe account (payment processing)
- AWS account (for SES email service - uses IAM credentials, not SMTP)
- OAuth credentials (Google, Apple, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/x907/website-badscandi.git
cd website-badscandi
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:
- `DATABASE_URL`: Your Supabase PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- OAuth provider credentials (Google, etc.)
- Stripe API keys
- AWS SES credentials (IAM Access Keys - see `AWS_SES_SETUP.md`)

4. Set up the database:
```bash
npm run db:push
```

5. Seed sample products:
```bash
npx tsx prisma/seed.ts
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
app/
├── layout.tsx                 # Root layout with Header/Footer
├── page.tsx                   # Home page with hero + featured products
├── shop/page.tsx              # Product grid
├── product/[slug]/page.tsx    # Product details
├── account/page.tsx           # User orders + passkey management
├── auth/signin/page.tsx       # Sign in page
└── api/
    ├── auth/[...nextauth]/    # NextAuth endpoints
    ├── passkey/               # Passkey registration/authentication
    ├── checkout/              # Stripe checkout session
    ├── webhooks/stripe/       # Payment confirmations
    └── contact/               # Contact form email handler

components/
├── ui/                        # shadcn/ui components
├── layout/                    # Header, Footer
├── passkey-enroll.tsx         # Passkey enrollment UI
├── product-card.tsx           # Product display card
├── product-grid.tsx           # Product grid layout
└── checkout-button.tsx        # Stripe checkout button

lib/
├── db.ts                      # Prisma client
├── auth.ts                    # NextAuth configuration
├── webauthn.ts                # SimpleWebAuthn helpers
├── email.ts                   # AWS SES email helpers
├── products.ts                # Product queries
├── stripe.ts                  # Stripe client
└── utils.ts                   # Utility functions

prisma/
├── schema.prisma              # Database schema
└── seed.ts                    # Sample data seeder
```

## Authentication Flow

### New User (Social Login → Passkey)
1. User signs in with Google/Apple/Facebook/Microsoft
2. NextAuth creates account and links by email
3. User is prompted to enroll a passkey (optional)
4. Passkey created via WebAuthn API

### Passkey Login
1. User clicks "Sign in with passkey"
2. Browser prompts for biometric/PIN authentication
3. Passkey verified via SimpleWebAuthn
4. Session created

### Passkey Reset
1. User signs in with social login or email link
2. Old passkey can be removed
3. New passkey can be enrolled

## Database Schema

See `prisma/schema.prisma` for the complete schema.

Key models:
- **User**: User accounts
- **Passkey**: WebAuthn credentials
- **Account**: OAuth provider accounts
- **Session**: User sessions
- **Product**: Store products
- **Order**: Purchase orders

## Deployment

### Deploy to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Import to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy

3. Set up Stripe webhook:
   - Get your Vercel deployment URL
   - Add webhook endpoint: `https://yourdomain.com/api/stripe-webhook`
   - Add webhook secret to environment variables

### Environment Variables for Production

Add these in Vercel:
- All variables from `.env.example`
- Update `NEXTAUTH_URL` to your production URL
- Update `RP_ID` to your domain (e.g., `yourdomain.com`)
- Update `RP_ORIGIN` to your full URL

## Development

### Database Commands

```bash
# Push schema changes
npm run db:push

# Open Prisma Studio
npm run db:studio

# Seed database
npx tsx prisma/seed.ts
```

### Email Testing

```bash
# Test AWS SES credentials
npm run test:ses your-email@example.com
```

### Stripe Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

### WebAuthn Testing

Passkeys work best on:
- macOS: Touch ID
- iOS: Face ID / Touch ID
- Android: Fingerprint / Face Unlock
- Windows: Windows Hello

## Design System

### Colors
- Background: `bg-neutral-50` (off-white)
- Text: `text-neutral-900` (near-black)
- Accent: `text-amber-900` (oak brown)
- Border: `border-neutral-100`

### Typography
- Clean sans-serif (Inter font)
- Generous whitespace
- Large headings with tight tracking

### Components
- Rounded corners: `rounded-xl`
- Subtle shadows: `shadow-sm`
- Hover states with smooth transitions

## License

MIT

## Support

For issues, please open a GitHub issue or contact support.
