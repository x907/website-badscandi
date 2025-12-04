import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH - Toggle featured status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { featured } = body;

    const review = await prisma.review.update({
      where: { id: params.id },
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
