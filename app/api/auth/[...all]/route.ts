import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { checkRateLimit, checkRateLimitByKey } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const authHandler = toNextJsHandler(auth);

export const GET = authHandler.GET;

export async function POST(req: NextRequest) {
  // Rate limit all auth POST requests by IP
  const ipRateLimit = await checkRateLimit(req, "auth");
  if (ipRateLimit) return ipRateLimit;

  // Extra per-email rate limiting for magic link to prevent email bombing
  const pathname = req.nextUrl.pathname;
  if (pathname.includes("magic-link")) {
    try {
      const body = await req.clone().json();
      const email = body?.email;
      if (email) {
        const allowed = await checkRateLimitByKey(email.toLowerCase(), "magicLink");
        if (!allowed) {
          return NextResponse.json(
            { error: "Too many sign-in attempts for this email. Please wait an hour before trying again." },
            { status: 429 }
          );
        }
      }
    } catch {
      // If we can't parse the body, let Better Auth handle it
    }
  }

  return authHandler.POST(req);
}
