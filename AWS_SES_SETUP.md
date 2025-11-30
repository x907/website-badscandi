# AWS SES Setup Guide

This guide will help you set up AWS SES (Simple Email Service) for sending magic link authentication emails.

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

Add the credentials to your `.env` file:

```env
# AWS SES (for Magic Link emails)
AWS_REGION="us-east-1"                     # The region where you set up SES
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"   # Your Access Key ID from Step 3
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI..."   # Your Secret Access Key from Step 3
EMAIL_FROM="noreply@badscandi.com"         # Your verified email from Step 2
```

## Step 5: Test the Setup

### Local Testing

1. Make sure both sender AND recipient emails are verified in SES
2. Start your dev server: `npm run dev`
3. Go to http://localhost:3000/auth/signin
4. Enter a verified email address
5. Click "Continue with Email"
6. Check your email for the magic link

### Production Testing

1. Complete "Request production access" (Step 2.3)
2. Verify your domain in SES (optional but recommended)
3. Deploy your application
4. Test with any email address

## Costs

AWS SES Pricing (as of 2024):
- **First 62,000 emails/month:** FREE (if sent from EC2)
- **After that:** $0.10 per 1,000 emails

For a typical e-commerce site:
- 1,000 users signing in = ~$0.10
- 10,000 users = ~$1.00
- Very affordable!

## Troubleshooting

### "Email address is not verified"
- Make sure you verified the sender email in SES Console
- In Sandbox mode, also verify the recipient email

### "User not authorized to perform: ses:SendEmail"
- Check that your IAM user has `AmazonSESFullAccess` policy
- Verify the Access Key ID and Secret Access Key are correct

### "MessageRejected: Email address is not verified"
- You're in Sandbox mode
- Either verify the recipient's email OR request production access

### Magic link not arriving
- Check spam/junk folder
- Verify AWS region matches in `.env` and SES Console
- Check CloudWatch logs in AWS Console for errors

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

## Support

- AWS SES Documentation: https://docs.aws.amazon.com/ses/
- AWS SES Pricing: https://aws.amazon.com/ses/pricing/
- AWS Support: https://console.aws.amazon.com/support/
