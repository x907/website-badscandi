import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

// Disable Next.js body parsing so we can verify the webhook signature
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("No Stripe signature found");
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Retrieve the full session with line items
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "line_items.data.price.product"],
      });

      const lineItems = fullSession.line_items?.data || [];
      const metadata = fullSession.metadata;
      const userId = metadata?.userId;
      const productId = metadata?.productId;

      if (!userId || !productId) {
        console.error("Missing userId or productId in session metadata");
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 }
        );
      }

      // Get product details for stock update
      const product = await db.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        console.error(`Product not found: ${productId}`);
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Calculate total and shipping
      const totalCents = fullSession.amount_total || 0;
      const shippingCents = fullSession.total_details?.amount_shipping || 0;

      // Prepare order items
      const items = lineItems.map((item) => ({
        id: productId,
        name: product.name,
        priceCents: product.priceCents,
        quantity: item.quantity || 1,
        imageUrl: product.imageUrl,
      }));

      // Create the order
      const order = await db.order.create({
        data: {
          userId,
          stripeId: session.id,
          totalCents,
          shippingCents,
          status: "completed",
          customerEmail: fullSession.customer_details?.email || null,
          shippingAddress: fullSession.shipping_details
            ? {
                name: fullSession.shipping_details.name,
                address: fullSession.shipping_details.address as any,
              }
            : undefined,
          items: JSON.stringify(items),
        },
      });

      // Update product stock
      await db.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: 1,
          },
        },
      });

      console.log(`Order created successfully: ${order.id}`);
      console.log(`Product stock updated for: ${productId}`);

      return NextResponse.json({ received: true, orderId: order.id });
    } catch (err) {
      console.error("Error processing webhook:", err);
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  }

  // Return success for other event types
  return NextResponse.json({ received: true });
}
