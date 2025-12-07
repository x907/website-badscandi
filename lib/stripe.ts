import Stripe from "stripe";

// Stripe client initialization - requires STRIPE_SECRET_KEY in runtime
// Build-time: Returns a minimal client that will fail gracefully if used
// Runtime: Uses the actual secret key from environment
function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    // During build, Next.js imports this module but we don't need a real client
    // Return a client with empty key - it will fail on actual API calls which is correct
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      console.error("CRITICAL: STRIPE_SECRET_KEY is not configured in production");
    }
    // Use empty string - Stripe constructor requires a string but API calls will fail
    return new Stripe("", {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }

  return new Stripe(secretKey, {
    apiVersion: "2025-11-17.clover",
    typescript: true,
  });
}

export const stripe = createStripeClient();
