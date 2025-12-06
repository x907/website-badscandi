import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
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

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "usd",
            },
            display_name: "Free Standard Shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 5,
              },
              maximum: {
                unit: "business_day",
                value: 7,
              },
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop?canceled=true`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        items: JSON.stringify(itemsMetadata),
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
