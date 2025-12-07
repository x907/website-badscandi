import { NextResponse } from "next/server";
import { getStripeClientForMode } from "@/lib/stripe";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id" },
      { status: 400 }
    );
  }

  try {
    // Detect if this is a test or live session from the ID prefix
    // cs_test_ = sandbox/test mode, cs_live_ = production mode
    const isTestSession = sessionId.startsWith("cs_test_");
    const stripe = getStripeClientForMode(isTestSession);

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details", "shipping_cost"],
    });

    // Verify the session is completed
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed", status: session.payment_status },
        { status: 400 }
      );
    }

    // Return order details
    return NextResponse.json({
      success: true,
      order: {
        id: session.id,
        email: session.customer_details?.email,
        name: session.customer_details?.name,
        phone: session.customer_details?.phone,
        amountTotal: session.amount_total,
        currency: session.currency,
        shippingCost: session.shipping_cost?.amount_total,
        shippingMethod: session.shipping_cost?.shipping_rate
          ? "Expedited Shipping"
          : "Standard Shipping",
        items: session.line_items?.data.map((item) => ({
          name: item.description,
          quantity: item.quantity,
          amountTotal: item.amount_total,
        })),
        shippingAddress: session.collected_information?.shipping_details?.address,
        createdAt: new Date(session.created * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error("Error verifying checkout session:", error);
    return NextResponse.json(
      { error: "Invalid session" },
      { status: 400 }
    );
  }
}
