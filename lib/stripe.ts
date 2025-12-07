import Stripe from "stripe";
import { isSandboxMode, sandboxConfig, isSandboxModeSync } from "./sandbox";

// Track which mode the current Stripe client is using
let currentStripeMode: "sandbox" | "production" | null = null;
let stripeClient: Stripe | null = null;

/**
 * Create a Stripe client with the appropriate API key based on sandbox mode
 */
function createStripeClient(isSandbox: boolean): Stripe {
  const secretKey = sandboxConfig.getStripeSecretKey(isSandbox);
  const mode = isSandbox ? "SANDBOX" : "PRODUCTION";

  if (!secretKey) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      console.error(`CRITICAL: Stripe secret key not configured for ${mode} mode`);
    }
    return new Stripe("", {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }

  // Log which mode we're using (only once per mode switch)
  const keyType = secretKey.startsWith("sk_test_") ? "test" : "live";
  console.log(`Stripe initialized in ${mode} mode (using ${keyType} key)`);

  return new Stripe(secretKey, {
    apiVersion: "2025-11-17.clover",
    typescript: true,
  });
}

/**
 * Get the Stripe client for the current mode
 * This is an async function that checks the current sandbox mode
 */
export async function getStripeClient(): Promise<Stripe> {
  const isSandbox = await isSandboxMode();
  const newMode = isSandbox ? "sandbox" : "production";

  // Recreate client if mode changed
  if (!stripeClient || currentStripeMode !== newMode) {
    stripeClient = createStripeClient(isSandbox);
    currentStripeMode = newMode;
  }

  return stripeClient;
}

/**
 * Get Stripe client synchronously (uses cached mode or env var)
 * Use this for module-level initialization only
 */
export function getStripeClientSync(): Stripe {
  const isSandbox = isSandboxModeSync();
  const newMode = isSandbox ? "sandbox" : "production";

  if (!stripeClient || currentStripeMode !== newMode) {
    stripeClient = createStripeClient(isSandbox);
    currentStripeMode = newMode;
  }

  return stripeClient;
}

/**
 * Get the webhook secret for the current mode
 */
export async function getStripeWebhookSecret(): Promise<string> {
  const isSandbox = await isSandboxMode();
  return sandboxConfig.getStripeWebhookSecret(isSandbox);
}

/**
 * Get the webhook secret for a specific mode (used for race condition handling)
 */
export function getStripeWebhookSecretForMode(isSandbox: boolean): string {
  return sandboxConfig.getStripeWebhookSecret(isSandbox);
}

/**
 * Get a Stripe client for a specific mode (used when mode is known from context, e.g., session ID prefix)
 */
export function getStripeClientForMode(isSandbox: boolean): Stripe {
  return createStripeClient(isSandbox);
}

/**
 * Get the publishable key for the current mode (for client-side)
 */
export async function getStripePublishableKey(): Promise<string> {
  const isSandbox = await isSandboxMode();
  return sandboxConfig.getStripePublishableKey(isSandbox);
}

/**
 * Force refresh the Stripe client (call after sandbox mode change)
 */
export function refreshStripeClient(): void {
  stripeClient = null;
  currentStripeMode = null;
}

// Export a default client for backward compatibility
// This uses sync mode detection for initial load
export const stripe = getStripeClientSync();
