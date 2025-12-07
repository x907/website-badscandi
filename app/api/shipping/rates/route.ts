import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { calculateShippingRates, ShippingAddress, easypost } from "@/lib/easypost";
import { checkRateLimit } from "@/lib/rate-limit";

// Static fallback rates when EasyPost is not configured
function getStaticRates(country: string) {
  const isCanada = country.toUpperCase() === "CA";
  return [
    {
      id: "static_standard",
      carrier: "Standard",
      service: "Ground",
      rate: isCanada ? 1499 : 999, // $14.99 for Canada, $9.99 for US
      deliveryDays: isCanada ? 10 : 7,
      deliveryDate: null,
      displayName: "Standard Shipping",
    },
    {
      id: "static_expedited",
      carrier: "Expedited",
      service: "Express",
      rate: isCanada ? 2499 : 1999, // $24.99 for Canada, $19.99 for US
      deliveryDays: isCanada ? 5 : 3,
      deliveryDate: null,
      displayName: "Expedited Shipping",
    },
  ];
}

export async function POST(request: Request) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, "checkout");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { address, totalCents } = body as {
      address: ShippingAddress;
      totalCents: number;
    };

    // Validate required fields
    if (!address?.street1 || !address?.city || !address?.state || !address?.zip || !address?.country) {
      return NextResponse.json(
        { error: "Missing required address fields" },
        { status: 400 }
      );
    }

    if (!totalCents || totalCents < 50) {
      return NextResponse.json(
        { error: "Invalid cart total" },
        { status: 400 }
      );
    }

    // Only allow US and Canada for now
    if (!["US", "CA"].includes(address.country.toUpperCase())) {
      return NextResponse.json(
        { error: "We currently only ship to the United States and Canada" },
        { status: 400 }
      );
    }

    // If EasyPost is not configured, return static rates
    if (!easypost) {
      console.log("EasyPost not configured, returning static rates");
      return NextResponse.json({ rates: getStaticRates(address.country) });
    }

    const rates = await calculateShippingRates(address, totalCents);

    if (rates.length === 0) {
      // Fall back to static rates if no carrier rates available
      return NextResponse.json({ rates: getStaticRates(address.country) });
    }

    return NextResponse.json({ rates });
  } catch (error) {
    console.error("Error calculating shipping rates:", error);

    // Check for EasyPost specific errors
    if (error instanceof Error) {
      if (error.message.includes("Invalid address")) {
        return NextResponse.json(
          { error: "Please check your address and try again" },
          { status: 400 }
        );
      }

      // For shipping service errors, fall back to static rates
      if (error.message.includes("Shipping service not configured")) {
        const body = await request.clone().json();
        return NextResponse.json({ rates: getStaticRates(body.address?.country || "US") });
      }
    }

    return NextResponse.json(
      { error: "Unable to calculate shipping rates. Please try again." },
      { status: 500 }
    );
  }
}
