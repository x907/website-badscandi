# Stripe Webhook Setup Guide

This guide walks you through setting up Stripe webhooks so orders are automatically created in your database when customers complete payment.

## Why This Is Critical

Without the webhook configured, customers can pay successfully BUT no order will be created in your database. The webhook is the bridge that connects Stripe payments to your order system.

## What You Need

- Stripe account with payment processing enabled
- Your site deployed and accessible (or use Stripe CLI for local testing)
- Access to your environment variables

---

## Step 1: Get Your Webhook Secret

### Option A: Production (Live Site)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```
4. Select events to listen to:
   - ✅ `checkout.session.completed`
5. Click "Add endpoint"
6. Click "Reveal" next to "Signing secret"
7. Copy the secret (starts with `whsec_`)

### Option B: Local Development (Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret from the output (starts with `whsec_`)

---

## Step 2: Add Webhook Secret to Environment Variables

Add the webhook secret to your `.env.local` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

For production, add this to your hosting platform's environment variables:
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Railway**: Variables tab

---

## Step 3: Deploy and Test

### Deploy Your Code

Make sure your latest code with the webhook handler is deployed:

```bash
git add .
git commit -m "Add Stripe webhook handler"
git push
```

### Test the Webhook

1. Make a test purchase on your site
2. Use Stripe's test card: `4242 4242 4242 4242`
3. Complete the checkout flow
4. Check your database - you should see a new order created!

### Verify in Stripe Dashboard

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your webhook endpoint
3. View recent webhook attempts
4. Check for successful deliveries (200 response)

---

## Troubleshooting

### No Orders Created

**Check webhook logs in Stripe Dashboard:**
- Are webhooks being sent? (Check "Attempted" count)
- What's the response status? (Should be 200)
- Any error messages?

**Common issues:**
- Webhook secret not added to environment variables
- Wrong URL in Stripe dashboard
- Site not deployed/accessible

### Webhook Signature Failed

**Error:** `Invalid signature`

**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard
- Make sure you're using the correct secret for test/live mode
- Redeploy after adding the environment variable

### 500 Internal Server Error

**Check your server logs for:**
- Database connection issues
- Missing product in database
- Invalid metadata in checkout session

---

## What the Webhook Does

When a customer completes payment, Stripe sends a `checkout.session.completed` event to your webhook. The webhook handler:

1. ✅ Verifies the webhook signature (security)
2. ✅ Retrieves the full checkout session
3. ✅ Creates an order in your database with:
   - User ID
   - Stripe session ID
   - Order total
   - Shipping cost
   - Shipping address
   - Customer email
   - Product details
4. ✅ Decrements product stock
5. ✅ Sets order status to "completed"

---

## Files Created/Modified

- `/app/api/webhooks/stripe/route.ts` - Webhook handler
- `/app/api/checkout/route.ts` - Updated with shipping and metadata
- `/prisma/schema.prisma` - Order model updated with shipping fields

---

## Security Notes

- The webhook secret authenticates requests from Stripe
- NEVER commit webhook secrets to git
- Use different webhook secrets for test and live mode
- Stripe automatically retries failed webhooks

---

## Next Steps

After webhook setup is complete:
1. Test with real test payments
2. Verify orders appear in your account page
3. Check email notifications work (if configured)
4. Switch to live mode when ready for real customers

---

## Support

If you encounter issues:
1. Check Stripe webhook logs
2. Check your server/deployment logs
3. Verify environment variables are set
4. Use Stripe CLI to test locally first
