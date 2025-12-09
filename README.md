# Bad Scandi E-Commerce

A modern, minimalist e-commerce platform built with Next.js 15, featuring native passkey authentication, comprehensive theming, and Stripe payments.

## Features

### Core Features
- **Modern Stack**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS
- **Native Passkey Auth**: WebAuthn/Passkeys via Better Auth for phishing-resistant authentication
- **Social Login**: Google, Apple, Facebook, Microsoft OAuth
- **Payments**: Stripe Checkout integration with 3D Secure support
- **Shipping**: Real-time shipping rate calculation with flat-rate options

### Admin Dashboard
- **Product Management**: Full CRUD with multi-image support, SEO fields, shipping dimensions
- **Order Management**: View orders, shipping labels, tracking info, label refunds
- **Review Moderation**: Approve, reject, and feature customer reviews
- **Theme Customization**: 11 font themes, 6 accent colors, dark mode support

### Design System
- **11 Font Themes**: System, Classic, Nordic, Artisan, Elegant, Modern, Warm, Editorial, Handcraft, Minimalist, Bold
- **6 Accent Colors**: Amber, Rose, Teal, Slate, Forest, Indigo
- **Dark Mode**: System, Light, Dark preferences
- **CSS Variables**: Fully customizable theming system

### Infrastructure
- **Email Integration**: AWS SES for transactional emails & drip campaigns
- **Image Storage**: AWS S3 for product and review images
- **Database**: Supabase PostgreSQL with Prisma ORM
- **Rate Limiting**: Upstash Redis for API protection
- **Analytics**: Google Analytics 4, Meta Pixel, Pinterest Tag (optional)
- **Auto-Deploy**: Vercel with GitHub integration

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Authentication | Better Auth v1.0 with Passkey plugin |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| Payments | Stripe |
| Email | AWS SES |
| Storage | AWS S3 |
| Rate Limiting | Upstash Redis |
| Hosting | Vercel |

## Documentation

### Getting Started
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment guide

### Technical Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API documentation
- **[DATABASE.md](./DATABASE.md)** - Database schema documentation
- **[SECURITY.md](./SECURITY.md)** - Security practices guide

### Feature Guides
- **[THEMING.md](./THEMING.md)** - Theme customization guide
- **[ADMIN_SETUP.md](./ADMIN_SETUP.md)** - Admin dashboard & S3 setup
- **[AWS_SES_SETUP.md](./AWS_SES_SETUP.md)** - Email configuration
- **[STRIPE_WEBHOOK_SETUP.md](./STRIPE_WEBHOOK_SETUP.md)** - Payment webhooks

### Operations
- **[AUTOMATION_SETUP.md](./AUTOMATION_SETUP.md)** - CI/CD & GitHub Actions
- **[DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md)** - Backup & recovery procedures
- **[SEO_GUIDE.md](./SEO_GUIDE.md)** - SEO optimization guide
- **[ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md)** - Tracking setup

### Development
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (PostgreSQL database)
- Stripe account (payment processing)
- AWS account (for SES email and S3 storage)
- OAuth credentials (Google, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/x907/website-badscandi.git
cd website-badscandi

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Push database schema
npm run db:push

# Seed sample products
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
website-badscandi/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── shop/              # Shop pages
│   ├── checkout/          # Checkout flow
│   └── ...                # Other pages
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   ├── layout/           # Header, Footer, Nav
│   └── admin-*-client.tsx # Admin page clients
├── lib/                   # Shared utilities
│   ├── auth.ts           # Better Auth config
│   ├── themes.ts         # Theme definitions
│   ├── stripe.ts         # Stripe client
│   └── ...               # Other utilities
├── prisma/                # Database schema
└── scripts/               # Utility scripts
```

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed sample products |
| `npm run test:ses` | Test email configuration |

## Authentication Flow

### Social Login + Passkey
1. User signs in with Google/Apple/Facebook/Microsoft
2. Better Auth creates account and links by email
3. User is prompted to enroll a passkey (optional)
4. Passkey created via WebAuthn API (Touch ID, Face ID, etc.)

### Passkey-Only Login
1. User clicks "Sign in with passkey"
2. Browser prompts for biometric authentication
3. Passkey verified via Better Auth
4. Session created

## Payment Flow

1. User adds items to cart
2. Checkout validates stock and prices
3. Stripe Checkout Session created
4. User completes payment on Stripe
5. Webhook creates order in database
6. Confirmation email sent

## Theming

The site supports comprehensive theming via the admin dashboard:

### Font Themes
- **System**: Device native fonts (fastest loading)
- **Classic**: Inter (highly readable)
- **Nordic**: Karla (Scandinavian feel)
- **Artisan**: Lora + DM Sans (craft-focused)
- **Elegant**: Playfair Display + DM Sans (premium)
- **Modern**: Plus Jakarta Sans (contemporary)
- **Warm**: Nunito Sans (friendly)
- **Editorial**: Cormorant Garamond + Source Sans 3 (magazine style)
- **Handcraft**: Caveat + Quicksand (artisan maker)
- **Minimalist**: Work Sans (clean geometric)
- **Bold**: Archivo Black + Archivo (statement)

### Style Options
- Border radius: Sharp, Default, Rounded, Pill
- Button style: Solid, Outline, Soft
- Heading style: Normal, Uppercase, Small Caps
- Font scale: Compact, Default, Spacious

### Dark Mode
- System (follows device preference)
- Light (always light)
- Dark (always dark)

## Security

- Session-based authentication with HTTP-only cookies
- Passkey support for phishing-resistant auth
- Rate limiting on all API endpoints
- Input validation with Zod schemas
- Audit logging for admin actions
- Stripe webhook signature verification
- Content Security Policy headers

See [SECURITY.md](./SECURITY.md) for details.

## License

MIT

## Support

- **Documentation**: See guides above
- **Issues**: Open a GitHub issue
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Better Auth Docs**: https://www.better-auth.com/docs
- **Stripe Docs**: https://stripe.com/docs
