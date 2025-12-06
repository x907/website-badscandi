import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { sendDripEmail, TEMPLATE_KEYS } from "@/lib/email-templates";

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

      const metadata = fullSession.metadata;
      const userId = metadata?.userId;
      const itemsJson = metadata?.items;

      if (!userId) {
        console.error("Missing userId in session metadata");
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 }
        );
      }

      // Parse items from metadata
      let orderItems: Array<{
        productId: string;
        name: string;
        priceCents: number;
        quantity: number;
        imageUrl: string;
      }> = [];

      if (itemsJson) {
        // New multi-item format
        orderItems = JSON.parse(itemsJson);
      } else if (metadata?.productId) {
        // Legacy single-item format (backward compatibility)
        const product = await db.product.findUnique({
          where: { id: metadata.productId },
        });
        if (product) {
          orderItems = [{
            productId: product.id,
            name: product.name,
            priceCents: product.priceCents,
            quantity: 1,
            imageUrl: product.imageUrl,
          }];
        }
      }

      if (orderItems.length === 0) {
        console.error("No items found in order");
        return NextResponse.json(
          { error: "No items in order" },
          { status: 400 }
        );
      }

      // Calculate total and shipping
      const totalCents = fullSession.amount_total || 0;
      const shippingCents = fullSession.total_details?.amount_shipping || 0;

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
          items: orderItems,
        },
      });

      // Update stock for all products
      for (const item of orderItems) {
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
        console.log(`Stock updated for product ${item.productId}: -${item.quantity}`);
      }

      // Clear user's cart after successful order
      await db.cart.delete({
        where: { userId },
      }).catch(() => {
        // Ignore if cart doesn't exist
      });

      console.log(`Order created successfully: ${order.id}`);

      // Send order confirmation email
      const customerEmail = fullSession.customer_details?.email;
      if (customerEmail) {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        const shippingDetails = fullSession.shipping_details;

        try {
          await sendDripEmail(
            {
              to: customerEmail,
              userId,
              templateKey: TEMPLATE_KEYS.ORDER_CONFIRMATION,
              step: 1,
              relatedEntityId: order.id,
            },
            {
              key: "order_confirmation",
              data: {
                firstName: user?.name?.split(" ")[0],
                orderId: order.id,
                items: orderItems.map((item) => ({
                  name: item.name,
                  priceCents: item.priceCents,
                  quantity: item.quantity,
                  imageUrl: item.imageUrl,
                })),
                totalCents,
                shippingAddress: shippingDetails?.address
                  ? {
                      name: shippingDetails.name || undefined,
                      line1: shippingDetails.address.line1 || undefined,
                      line2: shippingDetails.address.line2 || undefined,
                      city: shippingDetails.address.city || undefined,
                      state: shippingDetails.address.state || undefined,
                      postal_code: shippingDetails.address.postal_code || undefined,
                      country: shippingDetails.address.country || undefined,
                    }
                  : undefined,
              },
            }
          );
          console.log(`Order confirmation email sent to ${customerEmail}`);
        } catch (emailError) {
          // Don't fail the webhook if email fails
          console.error("Failed to send order confirmation email:", emailError);
        }
      }

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
