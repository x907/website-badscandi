import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth-utils";

// PATCH - Toggle featured status (admin only)
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
    const body = await request.json();
    const { featured } = body;

    const review = await db.review.update({
      where: { id },
      data: { featured },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Error updating featured status:", error);
    return NextResponse.json(
      { error: "Failed to update featured status" },
      { status: 500 }
    );
  }
}
