import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getStripeClient, getStripePublishableKey } from "@/lib/stripe";
import { isSandboxMode } from "@/lib/sandbox";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimits } from "@/lib/rate-limit";

interface CartItemInput {
  productId: string;
  quantity: number;
  priceCents?: number; // Optional - if provided, will validate against current price
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

    const body = await request.json();
    const { items } = body as { items: CartItemInput[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in cart" }, { status: 400 });
    }

    // Fetch all products
    const productIds = items.map((item) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    // Check for missing or unavailable products
    const missingProducts: string[] = [];
    const unavailableProducts: { id: string; name: string }[] = [];
    const priceChangedProducts: { id: string; name: string; oldPrice: number; newPrice: number }[] = [];
    const insufficientStockProducts: { id: string; name: string; requested: number; available: number }[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        missingProducts.push(item.productId);
        continue;
      }

      // Check if product was deleted/unpublished (stock === -1 convention or missing)
      if (product.stock < 0) {
        unavailableProducts.push({ id: product.id, name: product.name });
        continue;
      }

      // Validate price if provided in cart
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

    // Return appropriate error responses
    if (missingProducts.length > 0) {
      return NextResponse.json(
        {
          error: "Products not found",
          code: "PRODUCTS_NOT_FOUND",
          productIds: missingProducts,
        },
        { status: 410 } // 410 Gone - products no longer exist
      );
    }

    if (unavailableProducts.length > 0) {
      return NextResponse.json(
        {
          error: "Some products are no longer available",
          code: "PRODUCTS_UNAVAILABLE",
          products: unavailableProducts,
        },
        { status: 410 }
      );
    }

    if (priceChangedProducts.length > 0) {
      return NextResponse.json(
        {
          error: "Prices have changed since items were added to cart",
          code: "PRICE_CHANGED",
          products: priceChangedProducts,
        },
        { status: 409 } // 409 Conflict
      );
    }

    if (insufficientStockProducts.length > 0) {
      return NextResponse.json(
        {
          error: "Insufficient stock for some products",
          code: "INSUFFICIENT_STOCK",
          products: insufficientStockProducts,
        },
        { status: 400 }
      );
    }

    // Calculate total to validate minimum amount (Stripe requires at least $0.50)
    const totalCents = items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + product.priceCents * item.quantity;
    }, 0);

    if (totalCents < 50) {
      return NextResponse.json(
        {
          error: "Order total must be at least $0.50",
          code: "AMOUNT_TOO_SMALL",
          message: "The minimum order amount is $0.50. Please add more items to your cart.",
        },
        { status: 400 }
      );
    }

    // Create line items for Stripe
    const lineItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
            images: [product.imageUrl],
          },
          unit_amount: product.priceCents,
        },
        quantity: item.quantity,
      };
    });

    // Create metadata with all items info
    const itemsMetadata = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return {
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
      };
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://badscandi.com";

    // Check if we're in sandbox mode
    const isSandbox = await isSandboxMode();
    if (isSandbox) {
      console.log("Creating checkout session in SANDBOX mode");
    }

    // Build checkout session options
    const checkoutOptions: any = {
      mode: "payment",
      line_items: lineItems,
      allow_promotion_codes: true,
      phone_number_collection: { enabled: true },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop?canceled=true`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        items: JSON.stringify(itemsMetadata),
        isSandbox: isSandbox ? "true" : "false",
      },
    };

    // Shipping options - flat rates by region
    // US: $30, Canada: $55, International: $95
    checkoutOptions.shipping_address_collection = {
      allowed_countries: [
        // North America
        "US", "CA",
        // Europe
        "GB", "IE", "FR", "DE", "NL", "BE", "AT", "CH", "IT", "ES", "PT",
        "SE", "NO", "DK", "FI", "PL", "CZ",
        // Pacific
        "AU", "NZ",
        // Asia
        "JP", "KR", "SG",
      ],
    };

    checkoutOptions.shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 3000, currency: "usd" },
          display_name: "United States",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 4 },
            maximum: { unit: "business_day", value: 7 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 5500, currency: "usd" },
          display_name: "Canada",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 7 },
            maximum: { unit: "business_day", value: 14 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 9500, currency: "usd" },
          display_name: "International (Europe, Australia, Asia)",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 10 },
            maximum: { unit: "business_day", value: 21 },
          },
        },
      },
    ];

    const stripe = await getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.create(checkoutOptions);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    // Log detailed error info for debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);

      // Check if it's a Stripe error with more details
      const stripeError = error as any;
      if (stripeError.type) {
        console.error("Stripe error type:", stripeError.type);
        console.error("Stripe error code:", stripeError.code);
        console.error("Stripe error param:", stripeError.param);
      }

      const message = error.message;

      // Check for common Stripe errors
      if (message.includes("Invalid API Key")) {
        return NextResponse.json(
          { error: "Payment system configuration error", code: "STRIPE_CONFIG_ERROR", message },
          { status: 500 }
        );
      }

      if (message.includes("No such")) {
        return NextResponse.json(
          { error: "Payment configuration error", code: "STRIPE_NOT_FOUND", message },
          { status: 500 }
        );
      }

      if (message.includes("amount")) {
        return NextResponse.json(
          { error: "Invalid order amount", code: "AMOUNT_ERROR", message },
          { status: 400 }
        );
      }

      // Return the actual error message for debugging
      return NextResponse.json(
        { error: "Failed to create checkout session", code: "CHECKOUT_ERROR", message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session", code: "CHECKOUT_ERROR" },
      { status: 500 }
    );
  }
}
