import { isSandboxMode, sandboxConfig } from "./sandbox";

// EasyPost client type - use any to avoid importing the module at build time
type EasyPostClient = any;

// Track which mode the current EasyPost client is using
let currentEasyPostMode: "sandbox" | "production" | null = null;
let easypostClient: EasyPostClient | null = null;
let EasyPostClass: any = null;

/**
 * Lazily load the EasyPost library
 */
async function loadEasyPost(): Promise<any> {
  if (!EasyPostClass) {
    const module = await import("@easypost/api");
    EasyPostClass = module.default;
  }
  return EasyPostClass;
}

/**
 * Create an EasyPost client with the appropriate API key based on sandbox mode
 */
async function createEasyPostClient(isSandbox: boolean): Promise<EasyPostClient | null> {
  const apiKey = sandboxConfig.getEasyPostApiKey(isSandbox);
  const mode = isSandbox ? "SANDBOX" : "PRODUCTION";

  if (!apiKey) {
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      console.warn(`EasyPost API key not configured for ${mode} mode - automatic label purchasing disabled`);
    }
    return null;
  }

  try {
    const EasyPost = await loadEasyPost();
    // Log which mode we're using
    const keyType = apiKey.startsWith("EZAK") ? "production" : "test";
    console.log(`EasyPost initialized in ${mode} mode (using ${keyType} key)`);

    return new EasyPost(apiKey);
  } catch (error) {
    console.error(`Failed to initialize EasyPost client for ${mode} mode:`, error);
    return null;
  }
}

/**
 * Get the EasyPost client for the current mode
 */
export async function getEasyPostClient(): Promise<EasyPostClient | null> {
  const isSandbox = await isSandboxMode();
  const newMode = isSandbox ? "sandbox" : "production";

  // Recreate client if mode changed
  if (easypostClient === null || currentEasyPostMode !== newMode) {
    easypostClient = await createEasyPostClient(isSandbox);
    currentEasyPostMode = newMode;
  }

  return easypostClient;
}

/**
 * Force refresh the EasyPost client (call after sandbox mode change)
 */
export function refreshEasyPostClient(): void {
  easypostClient = null;
  currentEasyPostMode = null;
}

// Your store's shipping origin
const ORIGIN_ADDRESS = {
  company: "Bad Scandi",
  street1: "5555 Yellowstone Trl",
  city: "Minnetrista",
  state: "MN",
  zip: "55331",
  country: "US",
  phone: "",
};

// Default parcel size for fiber art
const DEFAULT_PARCEL = {
  length: 60,
  width: 6,
  height: 6,
  weight: 80, // 5 lbs in ounces
};

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

export interface PurchasedLabel {
  shipmentId: string; // EasyPost shipment ID for refunds
  trackingNumber: string;
  trackingUrl: string;
  labelUrl: string;
  carrier: string;
  service: string;
  ratePaid: number; // in cents
}

export interface ParcelDimensions {
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightOz: number;
}

export interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number; // in cents
  currency: string;
  deliveryDays: number | null;
  deliveryDate: string | null;
  deliveryDateGuaranteed: boolean;
}

export interface ShippingRatesResult {
  rates: ShippingRate[];
  shipmentId: string; // Need this to purchase later
}

/**
 * Get shipping rates for a destination address and parcel
 * Returns available rates sorted by price (cheapest first)
 */
export async function getShippingRates(
  toAddress: ShippingAddress,
  parcel?: ParcelDimensions
): Promise<ShippingRatesResult | null> {
  const client = await getEasyPostClient();
  if (!client) {
    console.warn("EasyPost not configured - cannot get shipping rates");
    return null;
  }

  // Use provided dimensions or fall back to defaults
  const parcelData = parcel
    ? {
        length: parcel.lengthIn,
        width: parcel.widthIn,
        height: parcel.heightIn,
        weight: parcel.weightOz,
      }
    : DEFAULT_PARCEL;

  try {
    // Create shipment to get rates (don't purchase yet)
    const shipment = await client.Shipment.create({
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
      parcel: parcelData,
    });

    if (!shipment.rates || shipment.rates.length === 0) {
      console.warn("No shipping rates returned for address:", toAddress);
      return null;
    }

    // Sort rates by price and map to our interface
    const sortedRates = shipment.rates
      .sort((a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate))
      .map((rate: any) => ({
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: Math.round(parseFloat(rate.rate) * 100), // Convert to cents
        currency: rate.currency || "USD",
        deliveryDays: rate.delivery_days,
        deliveryDate: rate.delivery_date,
        deliveryDateGuaranteed: rate.delivery_date_guaranteed || false,
      }));

    return {
      rates: sortedRates,
      shipmentId: shipment.id,
    };
  } catch (error: any) {
    console.error("Error getting shipping rates:", error);
    // Return more specific error info if available
    if (error.message?.includes("address")) {
      throw new Error("Invalid shipping address. Please check your address and try again.");
    }
    throw new Error("Unable to calculate shipping rates. Please try again.");
  }
}

/**
 * Purchase a shipping label using a pre-created shipment and rate
 */
export async function purchaseShippingLabelWithRate(
  shipmentId: string,
  rateId: string
): Promise<PurchasedLabel | null> {
  const client = await getEasyPostClient();
  if (!client) {
    console.warn("EasyPost not configured - skipping label purchase");
    return null;
  }

  try {
    const purchasedShipment = await client.Shipment.buy(shipmentId, rateId);

    // Get rate info from the purchased shipment
    const selectedRate = purchasedShipment.selected_rate;

    return {
      shipmentId: purchasedShipment.id,
      trackingNumber: purchasedShipment.tracking_code,
      trackingUrl: purchasedShipment.tracker?.public_url || `https://track.easypost.com/${purchasedShipment.tracking_code}`,
      labelUrl: purchasedShipment.postage_label?.label_url || "",
      carrier: selectedRate?.carrier || "Unknown",
      service: selectedRate?.service || "Unknown",
      ratePaid: Math.round(parseFloat(selectedRate?.rate || "0") * 100),
    };
  } catch (error) {
    console.error("Error purchasing shipping label with rate:", error);
    return null;
  }
}

/**
 * Purchase a shipping label for an order
 * Returns label URL, tracking number, and tracking URL
 */
export async function purchaseShippingLabel(
  toAddress: ShippingAddress
): Promise<PurchasedLabel | null> {
  const client = await getEasyPostClient();
  if (!client) {
    console.warn("EasyPost not configured - skipping label purchase");
    return null;
  }

  try {
    // Create shipment
    const shipment = await client.Shipment.create({
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
      parcel: DEFAULT_PARCEL,
    });

    // Find cheapest rate
    const rates = shipment.rates.sort(
      (a: any, b: any) => parseFloat(a.rate) - parseFloat(b.rate)
    );

    if (rates.length === 0) {
      console.error("No shipping rates available for address:", toAddress);
      return null;
    }

    const cheapestRate = rates[0];

    // Purchase the label
    const purchasedShipment = await client.Shipment.buy(shipment.id, cheapestRate.id);

    return {
      shipmentId: purchasedShipment.id,
      trackingNumber: purchasedShipment.tracking_code,
      trackingUrl: purchasedShipment.tracker?.public_url || `https://track.easypost.com/${purchasedShipment.tracking_code}`,
      labelUrl: purchasedShipment.postage_label?.label_url || "",
      carrier: cheapestRate.carrier,
      service: cheapestRate.service,
      ratePaid: Math.round(parseFloat(cheapestRate.rate) * 100),
    };
  } catch (error) {
    console.error("Error purchasing shipping label:", error);
    return null;
  }
}

/**
 * Request a refund for a shipping label
 * Returns true if refund was successfully submitted
 * Note: Refunds typically take 5-7 business days to process
 */
export async function refundShippingLabel(shipmentId: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  const client = await getEasyPostClient();
  if (!client) {
    return { success: false, error: "EasyPost not configured" };
  }

  try {
    // Use the static refund method with shipment ID
    const refundedShipment = await client.Shipment.refund(shipmentId);

    // EasyPost refund statuses: submitted, refunded, rejected
    return {
      success: true,
      status: refundedShipment.refund_status,
    };
  } catch (error: any) {
    console.error("Error refunding shipping label:", error);
    return {
      success: false,
      error: error.message || "Failed to refund label",
    };
  }
}
