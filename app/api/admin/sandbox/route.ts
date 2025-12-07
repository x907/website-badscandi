import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getSession } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSandboxStatus, setSandboxMode } from "@/lib/sandbox";
import { refreshStripeClient } from "@/lib/stripe";
import { z } from "zod";

// Schema for toggle request
const toggleSchema = z.object({
  enabled: z.boolean(),
});

/**
 * GET /api/admin/sandbox
 * Get the current sandbox mode status
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();

    const status = await getSandboxStatus();

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error fetching sandbox status:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch sandbox status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/sandbox
 * Toggle sandbox mode on or off
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();

    const session = await getSession();
    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = toggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { enabled } = parsed.data;

    // If enabling sandbox, validate that all required sandbox keys are configured
    if (enabled) {
      const missingKeys: string[] = [];

      if (!process.env.STRIPE_SANDBOX_SECRET_KEY) {
        missingKeys.push("STRIPE_SANDBOX_SECRET_KEY");
      }
      if (!process.env.STRIPE_SANDBOX_WEBHOOK_SECRET) {
        missingKeys.push("STRIPE_SANDBOX_WEBHOOK_SECRET");
      }
      if (!process.env.EASYPOST_SANDBOX_API_KEY && !process.env.EASYPOST_API_KEY) {
        missingKeys.push("EASYPOST_SANDBOX_API_KEY");
      }
      if (!process.env.SANDBOX_EMAIL_RECIPIENT) {
        missingKeys.push("SANDBOX_EMAIL_RECIPIENT");
      }

      if (missingKeys.length > 0) {
        return NextResponse.json(
          {
            error: "Cannot enable sandbox mode - missing configuration",
            missingKeys,
            message: `Please configure these environment variables: ${missingKeys.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Get current status for audit log
    const currentStatus = await getSandboxStatus();

    // Toggle sandbox mode
    await setSandboxMode(enabled, session.user.id);

    // Refresh API clients to use new keys
    refreshStripeClient();
    // Note: EasyPost client refresh not needed - it auto-detects mode changes
    // and recreates the client on the next request

    // Create audit log entry
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: enabled ? "enable_sandbox" : "disable_sandbox",
        entityType: "site_settings",
        entityId: "sandbox_mode",
        changes: {
          before: { sandboxMode: currentStatus.enabled },
          after: { sandboxMode: enabled },
        },
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        userAgent: request.headers.get("user-agent") || null,
      },
    });

    console.log(
      `Sandbox mode ${enabled ? "ENABLED" : "DISABLED"} by ${session.user.email}`
    );

    // Get updated status
    const newStatus = await getSandboxStatus();

    return NextResponse.json({
      success: true,
      message: `Sandbox mode ${enabled ? "enabled" : "disabled"}`,
      status: newStatus,
    });
  } catch (error) {
    console.error("Error toggling sandbox mode:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to toggle sandbox mode" },
      { status: 500 }
    );
  }
}
