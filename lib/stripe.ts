import Stripe from "stripe";

// Use a placeholder during build time when env var is not set
// At runtime, the actual API routes will have the env var configured
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_for_build";

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production") {
  console.warn("Warning: STRIPE_SECRET_KEY is not set. Using placeholder for build.");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});
