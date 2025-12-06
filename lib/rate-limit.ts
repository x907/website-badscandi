import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting (per serverless instance)
// NOTE: This is NOT distributed - each Vercel serverless instance has its own Map.
// For true rate limiting at scale, use Redis/Upstash with @upstash/ratelimit.
// Current implementation provides basic protection but can be bypassed by hitting
// different serverless instances. Suitable for low-traffic sites.
const rateLimitStore = new Map<string, RateLimitEntry>();

// Track last cleanup time to avoid cleaning on every request
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60000; // 1 minute

// Lazy cleanup - only runs when checking rate limits, not via setInterval
// This avoids memory leaks in serverless environments
function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return; // Don't clean up too frequently
  }
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

interface RateLimitConfig {
  limit: number; // Max requests
  windowMs: number; // Time window in milliseconds
}

const defaultConfig: RateLimitConfig = {
  limit: 10,
  windowMs: 60000, // 1 minute
};

/**
 * Get client IP from request headers
 */
function getClientIp(request: Request): string {
  // Vercel/Cloudflare headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback
  return "unknown";
}

/**
 * Check rate limit for a request
 * Returns null if allowed, or a NextResponse if rate limited
 */
export function checkRateLimit(
  request: Request,
  identifier?: string,
  config: Partial<RateLimitConfig> = {}
): NextResponse | null {
  // Lazy cleanup of expired entries
  cleanupExpiredEntries();

  const { limit, windowMs } = { ...defaultConfig, ...config };
  const ip = getClientIp(request);
  const key = identifier ? `${identifier}:${ip}` : ip;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (entry.count >= limit) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  // Increment counter
  entry.count++;
  return null;
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimits = {
  // Contact form: 5 requests per minute
  contact: { limit: 5, windowMs: 60000 },
  // Checkout: 10 requests per minute
  checkout: { limit: 10, windowMs: 60000 },
  // Reviews: 3 submissions per hour
  reviewSubmit: { limit: 3, windowMs: 3600000 },
  // Events tracking: 60 requests per minute
  events: { limit: 60, windowMs: 60000 },
  // Auth attempts: 10 per minute
  auth: { limit: 10, windowMs: 60000 },
  // General API: 30 requests per minute
  general: { limit: 30, windowMs: 60000 },
};
