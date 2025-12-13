import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getStripeClientForMode } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const paymentIntentId = searchParams.get("payment_intent");

  // Require authentication to view order details
  const authSession = await auth.api.getSession({
    headers: await headers(),
  });

  if (!authSession?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  // Handle PaymentIntent flow (new Stripe Elements checkout)
  if (paymentIntentId) {
    try {
      // Look up the order in our database by the PaymentIntent ID (stripeId)
      const order = await db.order.findUnique({
        where: { stripeId: paymentIntentId },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      });

      if (!order) {
        // Order might not be created yet (webhook delay) - give a helpful message
        return NextResponse.json(
          {
            error: "Order is being processed. Please check your email for confirmation.",
            pending: true
          },
          { status: 202 }
        );
      }

      // Verify the authenticated user owns this order
      if (order.userId !== authSession.user.id) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      // Parse the items and shipping address from the order
      const items = order.items as Array<{
        name: string;
        priceCents: number;
        quantity: number;
        imageUrl: string;
      }>;

      const shippingAddress = order.shippingAddress as {
        name: string;
        address: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          postal_code: string;
          country: string;
        };
      } | null;

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          email: order.customerEmail || order.user.email,
          name: shippingAddress?.name || order.user.name,
          amountTotal: order.totalCents,
          currency: "usd",
          shippingCost: order.shippingCents,
          shippingMethod: order.shippingService || "Standard Shipping",
          items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            amountTotal: item.priceCents * item.quantity,
          })),
          shippingAddress: shippingAddress?.address,
          createdAt: order.createdAt.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error verifying PaymentIntent order:", error);
      return NextResponse.json(
        { error: "Could not verify order" },
        { status: 400 }
      );
    }
  }

  // Handle legacy Checkout Session flow
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id or payment_intent" },
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

    // Verify the authenticated user owns this checkout session
    if (session.metadata?.userId !== authSession.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
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
