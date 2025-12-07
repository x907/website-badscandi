import EasyPost from "@easypost/api";

// EasyPost client - requires EASYPOST_API_KEY environment variable
const apiKey = process.env.EASYPOST_API_KEY;

if (!apiKey && process.env.NODE_ENV === "production") {
  console.warn("EASYPOST_API_KEY is not configured - shipping calculations will fail");
}

export const easypost = apiKey ? new EasyPost(apiKey) : null;

// Your store's shipping origin address
export const ORIGIN_ADDRESS = {
  company: "Bad Scandi",
  street1: process.env.SHIPPING_ORIGIN_STREET || "123 Main St",
  city: process.env.SHIPPING_ORIGIN_CITY || "Portland",
  state: process.env.SHIPPING_ORIGIN_STATE || "OR",
  zip: process.env.SHIPPING_ORIGIN_ZIP || "97201",
  country: "US",
  phone: process.env.SHIPPING_ORIGIN_PHONE || "",
};

// Default package dimensions for fiber art (in inches and ounces)
// These are estimates - adjust based on your actual products
export const DEFAULT_PARCEL = {
  // Small tapestry
  small: {
    length: 18,
    width: 14,
    height: 4,
    weight: 32, // 2 lbs
  },
  // Medium tapestry
  medium: {
    length: 24,
    width: 18,
    height: 6,
    weight: 48, // 3 lbs
  },
  // Large tapestry
  large: {
    length: 36,
    width: 24,
    height: 8,
    weight: 80, // 5 lbs
  },
};

// Get parcel size based on cart total or product attributes
export function getParcelSize(totalCents: number): keyof typeof DEFAULT_PARCEL {
  // Simple heuristic: higher priced items are typically larger
  if (totalCents < 15000) return "small"; // Under $150
  if (totalCents < 35000) return "medium"; // $150-$350
  return "large"; // Over $350
}

export interface ShippingAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number; // in cents
  deliveryDays: number | null;
  deliveryDate: string | null;
  displayName: string;
}

export async function calculateShippingRates(
  toAddress: ShippingAddress,
  totalCents: number
): Promise<ShippingRate[]> {
  if (!easypost) {
    throw new Error("Shipping service not configured");
  }

  const parcelSize = getParcelSize(totalCents);
  const parcel = DEFAULT_PARCEL[parcelSize];

  try {
    // Create shipment to get rates
    const shipment = await easypost.Shipment.create({
      from_address: ORIGIN_ADDRESS,
      to_address: {
        name: toAddress.name,
        street1: toAddress.street1,
        street2: toAddress.street2 || "",
        city: toAddress.city,
        state: toAddress.state,
        zip: toAddress.zip,
        country: toAddress.country,
        phone: toAddress.phone || "",
      },
      parcel: {
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        weight: parcel.weight,
      },
    });

    // Filter and format rates
    const rates: ShippingRate[] = shipment.rates
      .filter((rate: any) => {
        // Only include common carriers and services
        const allowedCarriers = ["USPS", "UPS", "FedEx"];
        return allowedCarriers.some((c) =>
          rate.carrier.toUpperCase().includes(c)
        );
      })
      .map((rate: any) => ({
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: Math.round(parseFloat(rate.rate) * 100), // Convert to cents
        deliveryDays: rate.delivery_days,
        deliveryDate: rate.delivery_date,
        displayName: formatServiceName(rate.carrier, rate.service),
      }))
      .sort((a: ShippingRate, b: ShippingRate) => a.rate - b.rate);

    return rates;
  } catch (error) {
    console.error("Error calculating shipping rates:", error);
    throw error;
  }
}

function formatServiceName(carrier: string, service: string): string {
  // Create user-friendly service names
  const serviceMap: Record<string, string> = {
    // USPS
    "First": "USPS First Class",
    "Priority": "USPS Priority Mail",
    "Express": "USPS Priority Mail Express",
    "ParcelSelect": "USPS Parcel Select Ground",
    "GroundAdvantage": "USPS Ground Advantage",
    // UPS
    "Ground": "UPS Ground",
    "3DaySelect": "UPS 3 Day Select",
    "2ndDayAir": "UPS 2nd Day Air",
    "NextDayAir": "UPS Next Day Air",
    // FedEx
    "FEDEX_GROUND": "FedEx Ground",
    "FEDEX_EXPRESS_SAVER": "FedEx Express Saver",
    "FEDEX_2_DAY": "FedEx 2 Day",
    "PRIORITY_OVERNIGHT": "FedEx Priority Overnight",
  };

  for (const [key, name] of Object.entries(serviceMap)) {
    if (service.includes(key)) {
      return name;
    }
  }

  return `${carrier} ${service}`;
}
