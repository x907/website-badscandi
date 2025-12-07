# AWS SES Setup Guide

This guide will help you set up AWS SES (Simple Email Service) for sending transactional emails via the **AWS SDK** (not SMTP).

## ⚠️ IMPORTANT: AWS SDK vs SMTP

**This application uses the AWS SES API via the AWS SDK, NOT SMTP.**

- **We use:** IAM Access Keys with `@aws-sdk/client-ses` (HTTPS API on port 443)
- **We do NOT use:** SMTP credentials or email server ports (25/587/465)
- **Why this matters:** SMTP credentials from AWS SES Console will NOT work with this application

If you have SMTP credentials, you need to create IAM Access Keys instead (see Step 3 below).

## What AWS SES is Used For

This application uses AWS SES to send:
1. **Magic link authentication emails** (passwordless login)
2. **Contact form submissions** (forwarded to your email)
3. **Welcome emails** (sent when new users sign up)
4. **Order confirmation emails** (after successful purchase)
5. **Drip campaign emails**:
   - Cart abandonment reminders (24 hours after cart creation)
   - Review request emails (7 days after order delivery)
   - Win-back campaigns (30/60/90 days after last purchase)

## Prerequisites

- AWS Account
- A domain name (for production) or use AWS SES Sandbox for testing

## Step 1: Create AWS Account

If you don't have an AWS account:
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the signup process

## Step 2: Set Up AWS SES

### 2.1 Access SES Console

1. Log in to AWS Console
2. Search for "SES" or "Simple Email Service"
3. Select your preferred region (e.g., us-east-1)

### 2.2 Verify Your Email Address (Sandbox Mode - For Testing)

1. In SES Console, go to **"Verified identities"**
2. Click **"Create identity"**
3. Select **"Email address"**
4. Enter your email (e.g., `noreply@yourdomain.com`)
5. Click **"Create identity"**
6. Check your email for a verification link from AWS
7. Click the verification link

**Important:** In Sandbox mode, you can only send emails TO verified addresses. Add your personal email as a verified identity for testing.

### 2.3 Request Production Access (Optional - For Production)

To send emails to any address:
1. In SES Console, click **"Account dashboard"**
2. Click **"Request production access"**
3. Fill out the form explaining your use case
4. AWS typically approves within 24 hours

## Step 3: Create IAM User with SES Permissions

### 3.1 Create IAM User

1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click **"Users"** → **"Add users"**
3. Enter username: `better-auth-ses`
4. Click **"Next"**

### 3.2 Set Permissions

1. Select **"Attach policies directly"**
2. Search for and select **"AmazonSESFullAccess"**
3. Click **"Next"** → **"Create user"**

### 3.3 Create Access Keys

1. Click on the created user
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"**
4. Click **"Create access key"**
5. Select **"Application running outside AWS"**
6. Click **"Next"** → **"Create access key"**
7. **IMPORTANT:** Copy the **Access Key ID** and **Secret Access Key** immediately
   - You won't be able to see the secret key again!

## Step 4: Configure Your Application

Add the IAM credentials (NOT SMTP credentials) to your `.env` file:

```env
# AWS SES - Uses AWS SDK API (NOT SMTP)
AWS_REGION="us-east-1"                     # The region where you set up SES
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"   # Your IAM Access Key ID from Step 3 (NOT SMTP username)
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI..."   # Your IAM Secret Access Key from Step 3 (NOT SMTP password)
EMAIL_FROM="noreply@badscandi.com"         # Your verified email from Step 2 (sender for magic links)
CONTACT_EMAIL="hello@badscandi.com"        # Where contact form submissions are sent
```

**Remember:** These are IAM Access Keys, NOT SMTP credentials. SMTP credentials will not work.

## Step 5: Test the Setup

### Test AWS SES Connection

First, test that your AWS credentials work:

```bash
npm run test:ses your-email@example.com
```

This will send a test email to verify your credentials are configured correctly. In Sandbox mode, make sure the recipient email is verified in AWS SES Console.

### Test Magic Link Authentication

1. Make sure both sender AND recipient emails are verified in SES (Sandbox mode)
2. Start your dev server: `npm run dev`
3. Go to http://localhost:3000/auth/signin
4. Enter a verified email address
5. Click "Continue with Email"
6. Check your email for the magic link

### Test Contact Form

1. Go to http://localhost:3000/contact (or your contact page)
2. Fill out the contact form
3. Submit the form
4. Check the email address specified in `CONTACT_EMAIL` for the submission

### Production Testing

1. Complete "Request production access" (Step 2.3)
2. Verify your domain in SES (optional but recommended)
3. Deploy your application
4. Update environment variables in your hosting platform
5. Test with any email address

## Costs

AWS SES Pricing (as of 2024):
- **First 62,000 emails/month:** FREE (if sent from EC2)
- **After that:** $0.10 per 1,000 emails

For a typical e-commerce site:
- 1,000 users signing in = ~$0.10
- 10,000 users = ~$1.00
- Very affordable!

## Troubleshooting

### "SignatureDoesNotMatch" or Authentication Errors
- **Most common issue:** You're using SMTP credentials instead of IAM Access Keys
- Solution: Generate IAM Access Keys following Step 3 above
- SMTP credentials (username/password format) will NOT work with this application
- You need IAM credentials (starts with `AKIA...`)

### "Email address is not verified"
- Make sure you verified the sender email in SES Console
- In Sandbox mode, also verify the recipient email

### "User not authorized to perform: ses:SendEmail"
- Check that your IAM user has `AmazonSESFullAccess` policy
- Verify the Access Key ID and Secret Access Key are correct
- Make sure you're using IAM credentials, not SMTP credentials

### "MessageRejected: Email address is not verified"
- You're in Sandbox mode
- Either verify the recipient's email OR request production access

### Magic link or contact form emails not arriving
- Check spam/junk folder
- Verify AWS region matches in `.env` and SES Console
- Test with `npm run test:ses your-email@example.com` first
- Check CloudWatch logs in AWS Console for errors
- In Sandbox mode, verify BOTH sender and recipient emails

## Security Best Practices

1. **Never commit credentials to Git**
   - `.env` file is already in `.gitignore`

2. **Use different credentials for development and production**
   - Create separate IAM users for each environment

3. **Rotate access keys regularly**
   - Every 90 days is recommended

4. **Use least privilege permissions**
   - `AmazonSESFullAccess` works, but you could create a more restrictive policy

## Alternative: Using Your Custom Domain

For a more professional setup:

1. **Verify your domain in SES:**
   - Go to SES Console → "Verified identities"
   - Create identity → Select "Domain"
   - Enter your domain (e.g., `badscandi.com`)
   - Add the DNS records to your domain provider

2. **Use any email address from your domain:**
   - `noreply@badscandi.com`
   - `hello@badscandi.com`
   - `orders@badscandi.com`

## Drip Campaign Cron Jobs

The application includes automated email campaigns that run via Vercel cron jobs:

### Available Cron Endpoints

- `/api/cron/cart-abandonment` - Sends reminders for abandoned carts (24h old)
- `/api/cron/review-request` - Requests reviews for delivered orders (7 days)
- `/api/cron/winback` - Re-engages inactive customers (30/60/90 days)

### Setting Up Cron Jobs

Add to your `vercel.json`:

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

### Email Templates

Email templates are defined in `lib/email-templates.ts` and include:
- Welcome email (sent automatically on signup)
- Cart abandonment reminders
- Review request emails
- Win-back campaigns

Each template uses the site's branding and includes an unsubscribe link.

---

## Support

- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- AWS SES Pricing: https://aws.amazon.com/ses/pricing/
- AWS Support: https://console.aws.amazon.com/support/
