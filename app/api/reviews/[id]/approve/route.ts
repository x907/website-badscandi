import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH - Approve a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.update({
      where: { id: params.id },
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
