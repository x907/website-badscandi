import { NextResponse } from "next/server";
import { runCartAbandonmentJob } from "@/src/jobs/cart-abandonment";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SHARED_SECRET;
  if (!cronSecret) {
    console.warn("CRON_SHARED_SECRET not configured");
    return false;
  }

  const providedSecret = request.headers.get("X-CRON-KEY");
  return providedSecret === cronSecret;
}

export async function POST(request: Request) {
  // Verify the request is from our cron scheduler
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    // Parse optional dry run flag from request body
    let dryRun = false;
    try {
      const body = await request.json();
      dryRun = body.dryRun === true;
    } catch {
      // No body or invalid JSON - proceed with defaults
    }

    // Run the job
    const result = await runCartAbandonmentJob({
      now: new Date(),
      dryRun,
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      dryRun,
      duration: `${duration}ms`,
      results: {
        step1: {
          sent: result.step1.sent,
          skipped: result.step1.skipped,
          errors: result.step1.errors.length,
        },
        step2: {
          sent: result.step2.sent,
          skipped: result.step2.skipped,
          errors: result.step2.errors.length,
        },
      },
      ...(result.step1.errors.length > 0 || result.step2.errors.length > 0
        ? {
            errorDetails: [
              ...result.step1.errors.map((e) => `[step1] ${e}`),
              ...result.step2.errors.map((e) => `[step2] ${e}`),
            ],
          }
        : {}),
    });
  } catch (error) {
    console.error("Cart abandonment job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron (which uses GET by default)
export async function GET(request: Request) {
  // For GET requests, check Authorization header (Vercel Cron format)
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SHARED_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SHARED_SECRET not configured" }, { status: 500 });
  }

  // Check X-CRON-KEY header or Authorization: Bearer token
  const xCronKey = request.headers.get("X-CRON-KEY");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (xCronKey !== cronSecret && bearerToken !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    const result = await runCartAbandonmentJob({
      now: new Date(),
      dryRun: false,
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      results: {
        step1: {
          sent: result.step1.sent,
          skipped: result.step1.skipped,
          errors: result.step1.errors.length,
        },
        step2: {
          sent: result.step2.sent,
          skipped: result.step2.skipped,
          errors: result.step2.errors.length,
        },
      },
    });
  } catch (error) {
    console.error("Cart abandonment job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
