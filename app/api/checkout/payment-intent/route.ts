import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getStripeClient } from "@/lib/stripe";
import { isSandboxMode } from "@/lib/sandbox";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

interface CartItemInput {
  productId: string;
  quantity: number;
  priceCents?: number; // For price validation
}

interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

interface PaymentIntentRequest {
  items: CartItemInput[];
  shippingAddress: ShippingAddress;
  shippingRateCents: number;
  shipmentId: string; // EasyPost shipment ID for purchasing label
  selectedRateId: string; // EasyPost rate ID
}

export async function POST(request: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, "checkout");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        {
          error: "Session expired",
          code: "SESSION_EXPIRED",
          message: "Your session has expired. Please sign in again to complete your purchase."
        },
        { status: 401 }
      );
    }

    const body = await request.json() as PaymentIntentRequest;
    const { items, shippingAddress, shippingRateCents, shipmentId, selectedRateId } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in cart", code: "EMPTY_CART" }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.street1 || !shippingAddress.city || !shippingAddress.zip) {
      return NextResponse.json({ error: "Invalid shipping address", code: "INVALID_ADDRESS" }, { status: 400 });
    }

    if (!shippingRateCents || shippingRateCents < 0) {
      return NextResponse.json({ error: "Invalid shipping rate", code: "INVALID_SHIPPING" }, { status: 400 });
    }

    if (!shipmentId || !selectedRateId) {
      return NextResponse.json({ error: "Missing shipping details", code: "MISSING_SHIPPING_DETAILS" }, { status: 400 });
    }

    // Fetch all products and validate
    const productIds = items.map(item => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    // Check for missing or unavailable products
    const missingProducts: string[] = [];
    const unavailableProducts: { id: string; name: string }[] = [];
    const priceChangedProducts: { id: string; name: string; oldPrice: number; newPrice: number }[] = [];
    const insufficientStockProducts: { id: string; name: string; requested: number; available: number }[] = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);

      if (!product) {
        missingProducts.push(item.productId);
        continue;
      }

      if (product.stock < 0) {
        unavailableProducts.push({ id: product.id, name: product.name });
        continue;
      }

      // Validate price if provided
      if (item.priceCents !== undefined && item.priceCents !== product.priceCents) {
        priceChangedProducts.push({
          id: product.id,
          name: product.name,
          oldPrice: item.priceCents,
          newPrice: product.priceCents,
        });
      }

      // Validate stock
      if (product.stock < item.quantity) {
        insufficientStockProducts.push({
          id: product.id,
          name: product.name,
          requested: item.quantity,
          available: product.stock,
        });
      }
    }

    // Return error responses
    if (missingProducts.length > 0) {
      return NextResponse.json(
        { error: "Products not found", code: "PRODUCTS_NOT_FOUND", productIds: missingProducts },
        { status: 410 }
      );
    }

    if (unavailableProducts.length > 0) {
      return NextResponse.json(
        { error: "Some products are no longer available", code: "PRODUCTS_UNAVAILABLE", products: unavailableProducts },
        { status: 410 }
      );
    }

    if (priceChangedProducts.length > 0) {
      return NextResponse.json(
        { error: "Prices have changed since items were added to cart", code: "PRICE_CHANGED", products: priceChangedProducts },
        { status: 409 }
      );
    }

    if (insufficientStockProducts.length > 0) {
      return NextResponse.json(
        { error: "Insufficient stock for some products", code: "INSUFFICIENT_STOCK", products: insufficientStockProducts },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotalCents = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)!;
      return sum + product.priceCents * item.quantity;
    }, 0);

    const totalCents = subtotalCents + shippingRateCents;

    // Validate minimum amount (Stripe requires $0.50 minimum)
    if (totalCents < 50) {
      return NextResponse.json(
        { error: "Order total must be at least $0.50", code: "AMOUNT_TOO_SMALL" },
        { status: 400 }
      );
    }

    // Prepare order items metadata
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      return {
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
      };
    });

    // Check sandbox mode
    const isSandbox = await isSandboxMode();
    if (isSandbox) {
      console.log("Creating PaymentIntent in SANDBOX mode");
    }

    const stripe = await getStripeClient();

    // Create PaymentIntent with all order details in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      // Request 3D Secure authentication when available for liability shift
      payment_method_options: {
        card: {
          request_three_d_secure: "any",
        },
      },
      metadata: {
        userId: session.user.id,
        userEmail: session.user.email,
        items: JSON.stringify(orderItems),
        shippingAddress: JSON.stringify(shippingAddress),
        shippingRateCents: String(shippingRateCents),
        shipmentId,
        selectedRateId,
        subtotalCents: String(subtotalCents),
        isSandbox: isSandbox ? "true" : "false",
      },
      receipt_email: session.user.email,
      shipping: {
        name: shippingAddress.name,
        phone: shippingAddress.phone || "",
        address: {
          line1: shippingAddress.street1,
          line2: shippingAddress.street2 || "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.zip,
          country: shippingAddress.country,
        },
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalCents,
      subtotal: subtotalCents,
      shipping: shippingRateCents,
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);

    if (error instanceof Error) {
      const message = error.message;

      if (message.includes("Invalid API Key")) {
        return NextResponse.json(
          { error: "Payment system configuration error", code: "STRIPE_CONFIG_ERROR" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create payment", code: "PAYMENT_ERROR", message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment", code: "PAYMENT_ERROR" },
      { status: 500 }
    );
  }
}
