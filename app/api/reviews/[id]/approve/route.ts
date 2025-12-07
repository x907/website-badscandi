import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth-utils";

// PATCH - Approve a review (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const review = await db.review.update({
      where: { id },
      data: { approved: true },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Error approving review:", error);
    return NextResponse.json(
      { error: "Failed to approve review" },
      { status: 500 }
    );
  }
}
