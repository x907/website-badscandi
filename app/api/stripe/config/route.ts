import { NextResponse } from "next/server";
import { getStripePublishableKey } from "@/lib/stripe";

export async function GET() {
  try {
    const publishableKey = await getStripePublishableKey();

    if (!publishableKey) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({ publishableKey });
  } catch (error) {
    console.error("Error getting Stripe config:", error);
    return NextResponse.json(
      { error: "Failed to get Stripe configuration" },
      { status: 500 }
    );
  }
}
