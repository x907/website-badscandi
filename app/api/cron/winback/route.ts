import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { runWinbackJob } from "@/src/jobs/winback";

// Verify cron secret using timing-safe comparison to prevent timing attacks
function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SHARED_SECRET;
  if (!cronSecret) {
    console.warn("CRON_SHARED_SECRET not configured");
    return false;
  }

  const providedSecret = request.headers.get("X-CRON-KEY");
  if (!providedSecret) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  const secretBuffer = Buffer.from(cronSecret);
  const providedBuffer = Buffer.from(providedSecret);

  if (secretBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(secretBuffer, providedBuffer);
}

// Helper for timing-safe token comparison
function timingSafeCompare(a: string | null, b: string): boolean {
  if (!a) return false;
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    let dryRun = false;
    try {
      const body = await request.json();
      dryRun = body.dryRun === true;
    } catch {
      // No body or invalid JSON
    }

    const result = await runWinbackJob({
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
    console.error("Winback job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SHARED_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SHARED_SECRET not configured" }, { status: 500 });
  }

  const xCronKey = request.headers.get("X-CRON-KEY");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  // Use timing-safe comparison for both checks
  if (!timingSafeCompare(xCronKey, cronSecret) && !timingSafeCompare(bearerToken, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startTime = Date.now();

    const result = await runWinbackJob({
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
    console.error("Winback job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
