import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client - works across all serverless instances
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiters for different endpoints using sliding window algorithm
const rateLimiters = {
  // Contact form: 5 requests per minute
  contact: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "ratelimit:contact",
  }),
  // Checkout: 10 requests per minute
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "ratelimit:checkout",
  }),
  // Reviews: 3 submissions per hour
  reviewSubmit: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"),
    prefix: "ratelimit:review",
  }),
  // Events tracking: 60 requests per minute
  events: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"),
    prefix: "ratelimit:events",
  }),
  // Auth attempts: 10 per minute
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "ratelimit:auth",
  }),
  // General API: 30 requests per minute
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "ratelimit:general",
  }),
  // Admin API: 30 requests per minute
  admin: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "ratelimit:admin",
  }),
  // Shipping rates: 20 requests per minute (rate quote lookups)
  shipping: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "ratelimit:shipping",
  }),
  // Cart operations: 30 requests per minute
  cart: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "ratelimit:cart",
  }),
};

type RateLimitType = keyof typeof rateLimiters;

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
 * Check rate limit for a request using Upstash Redis
 * Returns null if allowed, or a NextResponse if rate limited
 */
export async function checkRateLimit(
  request: Request,
  identifier: RateLimitType = "general"
): Promise<NextResponse | null> {
  // Skip rate limiting if Redis is not configured (local dev without env vars)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const ip = getClientIp(request);
  const limiter = rateLimiters[identifier];

  try {
    const { success, limit, remaining, reset } = await limiter.limit(ip);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
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
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
          },
        }
      );
    }

    return null;
  } catch (error) {
    // For security-sensitive endpoints (auth, checkout), fail closed
    // For other endpoints, fail open to avoid blocking legitimate traffic
    console.error("Rate limit check failed:", error);
    const securityEndpoints: RateLimitType[] = ["auth", "checkout"];
    if (securityEndpoints.includes(identifier)) {
      return NextResponse.json(
        { error: "Service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }
    return null;
  }
}

// Export rate limit types for backwards compatibility
export const rateLimits = {
  contact: "contact" as const,
  checkout: "checkout" as const,
  reviewSubmit: "reviewSubmit" as const,
  events: "events" as const,
  auth: "auth" as const,
  general: "general" as const,
  admin: "admin" as const,
  shipping: "shipping" as const,
  cart: "cart" as const,
};
