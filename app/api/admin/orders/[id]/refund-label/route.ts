import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { refundShippingLabel } from "@/lib/shipping";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await checkRateLimit(request, "admin");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await requireAdmin();

    const { id } = await params;

    // Get the order
    const order = await db.order.findUnique({
      where: { id },
      select: {
        id: true,
        shipmentId: true,
        labelRefunded: true,
        trackingNumber: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.shipmentId) {
      return NextResponse.json(
        { error: "No shipping label to refund" },
        { status: 400 }
      );
    }

    if (order.labelRefunded) {
      return NextResponse.json(
        { error: "Label already refunded" },
        { status: 400 }
      );
    }

    // Request refund from EasyPost
    const result = await refundShippingLabel(order.shipmentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to refund label" },
        { status: 500 }
      );
    }

    // Update order to mark label as refunded
    await db.order.update({
      where: { id },
      data: {
        labelRefunded: true,
      },
    });

    return NextResponse.json({
      success: true,
      status: result.status,
      message: `Refund ${result.status} for tracking ${order.trackingNumber}`,
    });
  } catch (error) {
    console.error("Error refunding label:", error);
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to refund label" },
      { status: 500 }
    );
  }
}
