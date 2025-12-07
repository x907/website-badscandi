import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripeClient, getStripeWebhookSecret, getStripeWebhookSecretForMode } from "@/lib/stripe";
import { isSandboxMode } from "@/lib/sandbox";
import { db } from "@/lib/db";
import { sendDripEmail, TEMPLATE_KEYS } from "@/lib/email-templates";
import { purchaseShippingLabel } from "@/lib/shipping";
import { sendEmail } from "@/lib/email";

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

  // Get the webhook secret for the current mode (sandbox or production)
  const webhookSecret = await getStripeWebhookSecret();
  if (!webhookSecret) {
    console.error("Stripe webhook secret not configured for current mode");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the Stripe client for the current mode
  const stripe = await getStripeClient();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    // If signature fails, try the OTHER mode's secret (handles race condition during mode switch)
    const altWebhookSecret = getStripeWebhookSecretForMode(!await isSandboxMode());
    if (altWebhookSecret && altWebhookSecret !== webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, altWebhookSecret);
        console.log("Webhook verified with alternate mode secret (mode switch race condition)");
      } catch {
        console.error("Webhook signature verification failed for both modes:", err);
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    } else {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }
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

      // Use Stripe's authoritative livemode field, NOT metadata (which could be tampered)
      // event.livemode === false means this is a test/sandbox transaction
      const isSandboxOrder = event.livemode === false;

      if (isSandboxOrder) {
        console.log(`Processing SANDBOX order from session ${session.id} (livemode=${event.livemode})`);
      }

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
        // New multi-item format - wrap in try-catch for safety
        try {
          orderItems = JSON.parse(itemsJson);
        } catch (parseError) {
          console.error("Failed to parse items from metadata:", parseError);
          return NextResponse.json(
            { error: "Invalid items metadata" },
            { status: 400 }
          );
        }
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

      // Idempotency check: See if order already exists for this Stripe session
      const existingOrder = await db.order.findUnique({
        where: { stripeId: session.id },
      });

      if (existingOrder) {
        console.log(`Order already exists for session ${session.id}, skipping duplicate`);
        return NextResponse.json({ received: true, orderId: existingOrder.id, duplicate: true });
      }

      // Calculate total and shipping
      const totalCents = fullSession.amount_total || 0;
      const shippingCents = fullSession.total_details?.amount_shipping || 0;

      // Use a transaction to ensure order creation and stock updates are atomic
      // This prevents partial updates if something fails mid-operation
      const order = await db.$transaction(async (tx) => {
        // First, validate stock for all items before creating order
        for (const item of orderItems) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { id: true, name: true, stock: true },
          });

          if (!product) {
            throw new Error(`Product ${item.productId} not found`);
          }

          if (product.stock < item.quantity) {
            console.warn(`Insufficient stock for ${product.name}: requested ${item.quantity}, available ${product.stock}`);
            // Don't throw - payment already completed, we need to fulfill
            // Log for manual intervention but continue
          }
        }

        // Create the order (mark as sandbox if it was a test order)
        const newOrder = await tx.order.create({
          data: {
            userId,
            stripeId: session.id,
            totalCents,
            shippingCents,
            status: "completed",
            customerEmail: fullSession.customer_details?.email || null,
            shippingAddress: fullSession.collected_information?.shipping_details
              ? {
                  name: fullSession.collected_information.shipping_details.name,
                  address: fullSession.collected_information.shipping_details.address as any,
                }
              : undefined,
            items: orderItems,
            isSandbox: isSandboxOrder,
          },
        });

        // Update stock for all products atomically within the transaction
        // SKIP stock updates for sandbox orders to preserve real inventory
        if (isSandboxOrder) {
          console.log("Sandbox order - skipping stock decrement to preserve inventory");
        } else {
          for (const item of orderItems) {
            const result = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: { gte: item.quantity }, // Only decrement if enough stock
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });

            if (result.count === 0) {
              console.warn(`Stock update skipped for product ${item.productId} - insufficient stock`);
            } else {
              console.log(`Stock updated for product ${item.productId}: -${item.quantity}`);
            }
          }
        }

        // Clear user's cart within the transaction
        await tx.cart.deleteMany({
          where: { userId },
        });

        return newOrder;
      });

      console.log(`Order created successfully: ${order.id}`);

      // Purchase shipping label automatically
      const shippingDetails = fullSession.collected_information?.shipping_details;
      let labelInfo: {
        shipmentId: string;
        trackingNumber: string;
        trackingUrl: string;
        labelUrl: string;
        carrier: string;
        service: string;
        ratePaid: number;
      } | null = null;

      if (shippingDetails?.address) {
        try {
          labelInfo = await purchaseShippingLabel({
            name: shippingDetails.name || "Customer",
            street1: shippingDetails.address.line1 || "",
            street2: shippingDetails.address.line2 || undefined,
            city: shippingDetails.address.city || "",
            state: shippingDetails.address.state || "",
            zip: shippingDetails.address.postal_code || "",
            country: shippingDetails.address.country || "US",
          });

          if (labelInfo) {
            // Update order with tracking info
            await db.order.update({
              where: { id: order.id },
              data: {
                shipmentId: labelInfo.shipmentId,
                trackingNumber: labelInfo.trackingNumber,
                trackingUrl: labelInfo.trackingUrl,
                labelUrl: labelInfo.labelUrl,
                carrier: labelInfo.carrier,
                shippingService: labelInfo.service,
                labelCostCents: labelInfo.ratePaid,
              },
            });
            console.log(`Shipping label purchased for order ${order.id}: ${labelInfo.trackingNumber}`);

            // Email the label to store owner
            try {
              await sendEmail({
                to: "hello@badscandi.com",
                subject: `New Order ${order.id} - Shipping Label Ready`,
                html: `
                  <h2>New Order Received!</h2>
                  <p><strong>Order ID:</strong> ${order.id}</p>
                  <p><strong>Customer:</strong> ${shippingDetails.name}</p>
                  <p><strong>Shipping Address:</strong><br>
                    ${shippingDetails.address.line1}<br>
                    ${shippingDetails.address.line2 ? shippingDetails.address.line2 + "<br>" : ""}
                    ${shippingDetails.address.city}, ${shippingDetails.address.state} ${shippingDetails.address.postal_code}<br>
                    ${shippingDetails.address.country}
                  </p>
                  <p><strong>Carrier:</strong> ${labelInfo.carrier} ${labelInfo.service}</p>
                  <p><strong>Tracking Number:</strong> ${labelInfo.trackingNumber}</p>
                  <p><strong>Label Cost:</strong> $${(labelInfo.ratePaid / 100).toFixed(2)}</p>
                  <p><strong>Items:</strong></p>
                  <ul>
                    ${orderItems.map(item => `<li>${item.name} (x${item.quantity})</li>`).join("")}
                  </ul>
                  <p><a href="${labelInfo.labelUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:4px;">Download Shipping Label</a></p>
                  <p><a href="${labelInfo.trackingUrl}">Track Package</a></p>
                `,
              });
              console.log(`Label email sent to store owner for order ${order.id}`);
            } catch (emailError) {
              console.error("Failed to send label email to store owner:", emailError);
            }
          }
        } catch (labelError) {
          // Don't fail the webhook if label purchase fails
          console.error("Failed to purchase shipping label:", labelError);
        }
      }

      // Send order confirmation email
      const customerEmail = fullSession.customer_details?.email;
      if (customerEmail) {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        const shippingDetails = fullSession.collected_information?.shipping_details;

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
