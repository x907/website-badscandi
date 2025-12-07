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

    try {
      const rates = await calculateShippingRates(address, totalCents);

      if (rates.length === 0) {
        // Fall back to static rates if no carrier rates available
        console.log("No carrier rates returned, using static rates");
        return NextResponse.json({ rates: getStaticRates(address.country) });
      }

      return NextResponse.json({ rates });
    } catch (easypostError) {
      // EasyPost failed (invalid address, API error, etc.) - fall back to static rates
      console.error("EasyPost rate calculation failed, using static rates:", easypostError);
      return NextResponse.json({ rates: getStaticRates(address.country) });
    }
  } catch (error) {
    console.error("Error in shipping rates endpoint:", error);

    // For any unexpected errors, still try to return static rates
    return NextResponse.json({ rates: getStaticRates("US") });
  }
}
