import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getProductById } from "@/lib/products";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.description,
              images: [product.imageUrl],
            },
            unit_amount: product.priceCents,
          },
          quantity: 1,
        },
      ],
      shipping_address_collection: {
        allowed_countries: ["US", "CA"], // US and Canada shipping
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0, // Free shipping
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
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}?canceled=true`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        productId: product.id,
        productName: product.name,
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
