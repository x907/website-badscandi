import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { getShippingRates, ShippingAddress, ParcelDimensions } from "@/lib/shipping";

interface CartItem {
  productId: string;
  quantity: number;
}

interface ShippingRatesRequest {
  address: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: CartItem[];
}

// Countries we support shipping to
const SUPPORTED_COUNTRIES = new Set([
  "US", "CA",
  "GB", "IE", "FR", "DE", "NL", "BE", "AT", "CH", "IT", "ES", "PT",
  "SE", "NO", "DK", "FI", "PL", "CZ",
  "AU", "NZ",
  "JP", "KR", "SG",
]);

export async function POST(request: Request) {
  // Rate limiting - 20 requests per minute for shipping rate lookups
  const rateLimitResponse = await checkRateLimit(request, "shipping");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Require authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await request.json() as ShippingRatesRequest;
    const { address, items } = body;

    // Validate address
    if (!address || !address.street1 || !address.city || !address.zip || !address.country) {
      return NextResponse.json(
        { error: "Incomplete address", code: "INVALID_ADDRESS" },
        { status: 400 }
      );
    }

    // Validate country is supported
    if (!SUPPORTED_COUNTRIES.has(address.country)) {
      return NextResponse.json(
        {
          error: "Shipping not available to this country",
          code: "COUNTRY_NOT_SUPPORTED",
          supportedCountries: Array.from(SUPPORTED_COUNTRIES),
        },
        { status: 400 }
      );
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided", code: "NO_ITEMS" },
        { status: 400 }
      );
    }

    // Fetch products and calculate combined parcel dimensions
    const productIds = items.map(item => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        shippingWeightOz: true,
        shippingLengthIn: true,
        shippingWidthIn: true,
        shippingHeightIn: true,
      },
    });

    // Check for missing products
    const foundProductIds = new Set(products.map(p => p.id));
    const missingProducts = productIds.filter(id => !foundProductIds.has(id));
    if (missingProducts.length > 0) {
      return NextResponse.json(
        { error: "Some products not found", code: "PRODUCTS_NOT_FOUND", productIds: missingProducts },
        { status: 400 }
      );
    }

    // Calculate combined parcel dimensions
    // Strategy: Stack items vertically, use max length/width, sum weights
    let totalWeightOz = 0;
    let maxLengthIn = 0;
    let maxWidthIn = 0;
    let totalHeightIn = 0;

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      const quantity = item.quantity || 1;

      // Use product dimensions or defaults for fiber art (60x6x6 inches, 5lbs)
      const weightOz = product.shippingWeightOz || 80; // 5lbs default
      const lengthIn = product.shippingLengthIn || 60;
      const widthIn = product.shippingWidthIn || 6;
      const heightIn = product.shippingHeightIn || 6;

      totalWeightOz += weightOz * quantity;
      maxLengthIn = Math.max(maxLengthIn, lengthIn);
      maxWidthIn = Math.max(maxWidthIn, widthIn);
      totalHeightIn += heightIn * quantity;
    }

    // Ensure minimum dimensions
    const parcel: ParcelDimensions = {
      weightOz: Math.max(totalWeightOz, 1), // At least 1 oz
      lengthIn: Math.max(maxLengthIn, 1),
      widthIn: Math.max(maxWidthIn, 1),
      heightIn: Math.max(totalHeightIn, 1),
    };

    // Build shipping address
    const shippingAddress: ShippingAddress = {
      name: address.name || "Customer",
      street1: address.street1,
      street2: address.street2,
      city: address.city,
      state: address.state || "",
      zip: address.zip,
      country: address.country,
    };

    // Get shipping rates from EasyPost
    const result = await getShippingRates(shippingAddress, parcel);

    if (!result) {
      return NextResponse.json(
        { error: "Unable to calculate shipping rates", code: "RATES_UNAVAILABLE" },
        { status: 503 }
      );
    }

    // Return rates and shipment ID (needed to purchase later)
    return NextResponse.json({
      rates: result.rates,
      shipmentId: result.shipmentId,
      parcel, // Include for transparency/debugging
    });
  } catch (error) {
    console.error("Error fetching shipping rates:", error);

    if (error instanceof Error) {
      // Return user-friendly error messages
      if (error.message.includes("address")) {
        return NextResponse.json(
          { error: error.message, code: "INVALID_ADDRESS" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to calculate shipping rates", code: "SHIPPING_ERROR" },
      { status: 500 }
    );
  }
}
