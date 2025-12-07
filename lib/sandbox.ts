/**
 * Sandbox Mode Configuration
 *
 * Centralized configuration for toggling between production and sandbox/test mode.
 * When sandbox mode is enabled:
 * - Stripe uses test API keys (sk_test_*, pk_test_*)
 * - EasyPost uses sandbox API key
 * - Emails are redirected to TEST_EMAIL_RECIPIENT
 * - Orders are marked with isSandbox: true
 *
 * Security: Only admins can toggle sandbox mode via the admin API.
 */

import { db } from "./db";

// In-memory cache with TTL to avoid hitting DB on every request
let cachedSandboxMode: boolean | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * Get the current sandbox mode state from database (with caching)
 * Falls back to ENABLE_SANDBOX_MODE env var if DB not accessible
 */
export async function isSandboxMode(): Promise<boolean> {
  // Check cache first
  const now = Date.now();
  if (cachedSandboxMode !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSandboxMode;
  }

  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: "settings" },
      select: { sandboxMode: true },
    });

    const mode = settings?.sandboxMode ?? false;
    cachedSandboxMode = mode;
    cacheTimestamp = now;
    return mode;
  } catch (error) {
    // If DB fails, fall back to env var
    console.warn("Failed to get sandbox mode from DB, using env var:", error);
    return process.env.ENABLE_SANDBOX_MODE === "true";
  }
}

/**
 * Synchronous check for sandbox mode (uses cache or env var)
 * Use this in places where async isn't possible (like module initialization)
 */
export function isSandboxModeSync(): boolean {
  if (cachedSandboxMode !== null && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSandboxMode;
  }
  return process.env.ENABLE_SANDBOX_MODE === "true";
}

/**
 * Invalidate the cache (call after toggling sandbox mode)
 */
export function invalidateSandboxCache(): void {
  cachedSandboxMode = null;
  cacheTimestamp = 0;
}

/**
 * Set sandbox mode (admin only - this should be called from admin API)
 */
export async function setSandboxMode(enabled: boolean, userId: string): Promise<void> {
  await db.siteSettings.upsert({
    where: { id: "settings" },
    create: {
      id: "settings",
      sandboxMode: enabled,
      updatedBy: userId,
    },
    update: {
      sandboxMode: enabled,
      updatedBy: userId,
    },
  });

  // Invalidate cache immediately
  invalidateSandboxCache();

  // Update cache with new value
  cachedSandboxMode = enabled;
  cacheTimestamp = Date.now();
}

/**
 * Configuration for sandbox mode services
 */
export const sandboxConfig = {
  // Stripe keys based on mode
  getStripeSecretKey: (isSandbox: boolean): string => {
    if (isSandbox) {
      return process.env.STRIPE_SANDBOX_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "";
    }
    return process.env.STRIPE_SECRET_KEY || "";
  },

  getStripePublishableKey: (isSandbox: boolean): string => {
    if (isSandbox) {
      return process.env.STRIPE_SANDBOX_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || "";
    }
    return process.env.STRIPE_PUBLISHABLE_KEY || "";
  },

  getStripeWebhookSecret: (isSandbox: boolean): string => {
    if (isSandbox) {
      return process.env.STRIPE_SANDBOX_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
    }
    return process.env.STRIPE_WEBHOOK_SECRET || "";
  },

  // EasyPost API key based on mode
  getEasyPostApiKey: (isSandbox: boolean): string => {
    if (isSandbox) {
      return process.env.EASYPOST_SANDBOX_API_KEY || process.env.EASYPOST_API_KEY || "";
    }
    return process.env.EASYPOST_API_KEY || "";
  },

  // Email redirect for sandbox mode
  getEmailRecipient: (isSandbox: boolean, originalRecipient: string): string => {
    if (isSandbox && process.env.SANDBOX_EMAIL_RECIPIENT) {
      return process.env.SANDBOX_EMAIL_RECIPIENT;
    }
    return originalRecipient;
  },

  // Get the sandbox email recipient (for logging/display)
  getSandboxEmailRecipient: (): string | undefined => {
    return process.env.SANDBOX_EMAIL_RECIPIENT;
  },
};

/**
 * Type for sandbox mode status response
 */
export interface SandboxStatus {
  enabled: boolean;
  stripeMode: "test" | "live";
  easypostMode: "test" | "live";
  emailRedirect: string | null;
  lastUpdatedBy?: string;
}

/**
 * Get comprehensive sandbox status for admin display
 */
export async function getSandboxStatus(): Promise<SandboxStatus> {
  const settings = await db.siteSettings.findUnique({
    where: { id: "settings" },
  });

  const enabled = settings?.sandboxMode ?? false;
  const stripeKey = sandboxConfig.getStripeSecretKey(enabled);
  const easypostKey = sandboxConfig.getEasyPostApiKey(enabled);

  return {
    enabled,
    stripeMode: stripeKey.startsWith("sk_test_") ? "test" : "live",
    easypostMode: easypostKey.startsWith("EZAK") ? "live" : "test", // EasyPost test keys have different format
    emailRedirect: enabled ? (process.env.SANDBOX_EMAIL_RECIPIENT || null) : null,
    lastUpdatedBy: settings?.updatedBy || undefined,
  };
}
