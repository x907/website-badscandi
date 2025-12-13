import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripeClient, getStripeWebhookSecret, getStripeWebhookSecretForMode } from "@/lib/stripe";
import { isSandboxMode } from "@/lib/sandbox";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { sendDripEmail, TEMPLATE_KEYS } from "@/lib/email-templates";
import { purchaseShippingLabel, purchaseShippingLabelWithRate } from "@/lib/shipping";
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

      // Validate shipping rate matches customer's country
      const shippingCountry = fullSession.collected_information?.shipping_details?.address?.country;
      let shippingMismatch = false;
      let expectedShippingCents = shippingCents;

      if (shippingCountry && fullSession.shipping_cost?.shipping_rate) {
        // Get the shipping rate to check its metadata
        const shippingRateId = typeof fullSession.shipping_cost.shipping_rate === 'string'
          ? fullSession.shipping_cost.shipping_rate
          : fullSession.shipping_cost.shipping_rate.id;

        try {
          const shippingRate = await stripe.shippingRates.retrieve(shippingRateId);
          const allowedCountries = shippingRate.metadata?.allowed_countries?.split(',') || [];

          if (allowedCountries.length > 0 && !allowedCountries.includes(shippingCountry)) {
            shippingMismatch = true;

            // Calculate what the correct shipping should have been
            const shippingRates: Record<string, number> = {
              'US': 3000,
              'CA': 5500,
            };
            // Default to international for countries not in US/CA
            expectedShippingCents = shippingRates[shippingCountry] || 9500;

            console.warn(`SHIPPING MISMATCH: Customer in ${shippingCountry} selected rate for ${allowedCountries.join(',')}. ` +
              `Paid: $${(shippingCents / 100).toFixed(2)}, Expected: $${(expectedShippingCents / 100).toFixed(2)}`);
          }
        } catch (rateError) {
          console.warn("Could not retrieve shipping rate for validation:", rateError);
        }
      }

      // Use a transaction to ensure order creation and stock updates are atomic
      // This prevents partial updates if something fails mid-operation
      const order = await db.$transaction(async (tx: Prisma.TransactionClient) => {
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
                subtotalCents: totalCents - shippingCents,
                shippingCents,
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

  // Handle payment_intent.succeeded for custom Stripe Elements checkout
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      const metadata = paymentIntent.metadata;
      const userId = metadata?.userId;
      const userEmail = metadata?.userEmail;
      const itemsJson = metadata?.items;
      const shippingAddressJson = metadata?.shippingAddress;
      const shippingRateCents = parseInt(metadata?.shippingRateCents || "0", 10);
      const shipmentId = metadata?.shipmentId;
      const selectedRateId = metadata?.selectedRateId;
      const subtotalCents = parseInt(metadata?.subtotalCents || "0", 10);

      // Use Stripe's authoritative livemode field
      const isSandboxOrder = event.livemode === false;

      if (isSandboxOrder) {
        console.log(`Processing SANDBOX PaymentIntent order ${paymentIntent.id} (livemode=${event.livemode})`);
      }

      // Extract 3D Secure authentication status
      // This is available on the payment method details after payment succeeds
      const charges = paymentIntent.latest_charge;
      let threeDSecureStatus: string | null = null;

      if (charges && typeof charges === 'string') {
        // Need to retrieve the charge to get payment method details
        const stripe = await getStripeClient();
        try {
          const charge = await stripe.charges.retrieve(charges);
          const card = charge.payment_method_details?.card;
          if (card?.three_d_secure) {
            // Result can be: authenticated, attempted, not_supported, or failed
            threeDSecureStatus = card.three_d_secure.result || null;
            console.log(`3D Secure result for ${paymentIntent.id}: ${threeDSecureStatus}`);
          } else {
            // Card didn't use 3DS
            threeDSecureStatus = "not_used";
            console.log(`3D Secure not used for ${paymentIntent.id}`);
          }
        } catch (chargeError) {
          console.error(`Failed to retrieve charge for 3DS status:`, chargeError);
        }
      }

      if (!userId || !itemsJson || !shippingAddressJson) {
        console.error("Missing required metadata in PaymentIntent");
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 }
        );
      }

      // Parse metadata
      let orderItems: Array<{
        productId: string;
        name: string;
        priceCents: number;
        quantity: number;
        imageUrl: string;
      }> = [];

      let shippingAddress: {
        name: string;
        street1: string;
        street2?: string;
        city: string;
        state: string;
        zip: string;
        country: string;
        phone?: string;
      };

      try {
        orderItems = JSON.parse(itemsJson);
        shippingAddress = JSON.parse(shippingAddressJson);
      } catch (parseError) {
        console.error("Failed to parse PaymentIntent metadata:", parseError);
        return NextResponse.json(
          { error: "Invalid metadata" },
          { status: 400 }
        );
      }

      if (orderItems.length === 0) {
        console.error("No items found in PaymentIntent order");
        return NextResponse.json(
          { error: "No items in order" },
          { status: 400 }
        );
      }

      // Idempotency check
      const existingOrder = await db.order.findUnique({
        where: { stripeId: paymentIntent.id },
      });

      if (existingOrder) {
        console.log(`Order already exists for PaymentIntent ${paymentIntent.id}, skipping duplicate`);
        return NextResponse.json({ received: true, orderId: existingOrder.id, duplicate: true });
      }

      const totalCents = paymentIntent.amount;

      // Create order in transaction
      const order = await db.$transaction(async (tx: Prisma.TransactionClient) => {
        // Validate stock
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
          }
        }

        // Create order
        const newOrder = await tx.order.create({
          data: {
            userId,
            stripeId: paymentIntent.id,
            totalCents,
            shippingCents: shippingRateCents,
            status: "completed",
            customerEmail: userEmail || null,
            shippingAddress: {
              name: shippingAddress.name,
              address: {
                line1: shippingAddress.street1,
                line2: shippingAddress.street2 || "",
                city: shippingAddress.city,
                state: shippingAddress.state,
                postal_code: shippingAddress.zip,
                country: shippingAddress.country,
              },
            },
            items: orderItems,
            isSandbox: isSandboxOrder,
            threeDSecureStatus,
          },
        });

        // Update stock (skip for sandbox)
        if (isSandboxOrder) {
          console.log("Sandbox order - skipping stock decrement");
        } else {
          for (const item of orderItems) {
            const result = await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: { gte: item.quantity },
              },
              data: {
                stock: { decrement: item.quantity },
              },
            });

            if (result.count === 0) {
              console.warn(`Stock update skipped for product ${item.productId}`);
            } else {
              console.log(`Stock updated for product ${item.productId}: -${item.quantity}`);
            }
          }
        }

        // Clear cart
        await tx.cart.deleteMany({
          where: { userId },
        });

        return newOrder;
      });

      console.log(`Order created from PaymentIntent: ${order.id}`);

      // Purchase shipping label using the pre-selected rate
      let labelInfo: {
        shipmentId: string;
        trackingNumber: string;
        trackingUrl: string;
        labelUrl: string;
        carrier: string;
        service: string;
        ratePaid: number;
      } | null = null;

      if (shipmentId && selectedRateId) {
        try {
          labelInfo = await purchaseShippingLabelWithRate(shipmentId, selectedRateId);

          if (labelInfo) {
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

            // Email label to store owner
            try {
              await sendEmail({
                to: "hello@badscandi.com",
                subject: `New Order ${order.id} - Shipping Label Ready`,
                html: `
                  <h2>New Order Received!</h2>
                  <p><strong>Order ID:</strong> ${order.id}</p>
                  <p><strong>Customer:</strong> ${shippingAddress.name}</p>
                  <p><strong>Shipping Address:</strong><br>
                    ${shippingAddress.street1}<br>
                    ${shippingAddress.street2 ? shippingAddress.street2 + "<br>" : ""}
                    ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip}<br>
                    ${shippingAddress.country}
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
              console.error("Failed to send label email:", emailError);
            }
          }
        } catch (labelError) {
          console.error("Failed to purchase shipping label with rate:", labelError);
        }
      }

      // Send order confirmation email
      if (userEmail) {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        try {
          await sendDripEmail(
            {
              to: userEmail,
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
                subtotalCents,
                shippingCents: shippingRateCents,
                totalCents,
                shippingAddress: {
                  name: shippingAddress.name,
                  line1: shippingAddress.street1,
                  line2: shippingAddress.street2,
                  city: shippingAddress.city,
                  state: shippingAddress.state,
                  postal_code: shippingAddress.zip,
                  country: shippingAddress.country,
                },
              },
            }
          );
          console.log(`Order confirmation email sent to ${userEmail}`);
        } catch (emailError) {
          console.error("Failed to send order confirmation email:", emailError);
        }
      }

      return NextResponse.json({ received: true, orderId: order.id });
    } catch (err) {
      console.error("Error processing PaymentIntent webhook:", err);
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  }

  // Return success for other event types
  return NextResponse.json({ received: true });
}
