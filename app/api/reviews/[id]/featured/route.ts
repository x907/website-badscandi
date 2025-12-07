import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const featuredSchema = z.object({
  featured: z.boolean(),
});

// PATCH - Toggle featured status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Check admin authorization
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const { featured } = featuredSchema.parse(body);

    const review = await db.review.update({
      where: { id },
      data: { featured },
    });

    // Log audit event
    await logAuditEvent({
      action: featured ? "feature" : "unfeature",
      entityType: "review",
      entityId: id,
      changes: { customerName: review.customerName, featured },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Error updating featured status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input: featured must be a boolean" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update featured status" },
      { status: 500 }
    );
  }
}
