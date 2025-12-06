"use client";

// Client-side event tracking utility
// Sends events to /api/events for drip email segmentation

const ANONYMOUS_ID_KEY = "badscandi_anon_id";

// Generate a unique anonymous ID for tracking pre-signup users
function generateAnonymousId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Get or create anonymous ID from cookie/localStorage
export function getAnonymousId(): string {
  if (typeof window === "undefined") return "";

  // Try localStorage first (persists longer)
  let anonId = localStorage.getItem(ANONYMOUS_ID_KEY);

  if (!anonId) {
    anonId = generateAnonymousId();
    localStorage.setItem(ANONYMOUS_ID_KEY, anonId);
  }

  return anonId;
}

// Clear anonymous ID (call after successful login to link events)
export function clearAnonymousId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ANONYMOUS_ID_KEY);
}

export type EventType =
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_started"
  | "checkout_completed"
  | "order_placed"
  | "email_open"
  | "email_click"
  | "page_view"
  | "signup";

export interface EventProperties {
  productId?: string;
  productName?: string;
  cartId?: string;
  orderId?: string;
  emailId?: string;
  url?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  [key: string]: string | number | boolean | undefined;
}

// Track an event
export async function trackEvent(
  eventType: EventType,
  properties?: EventProperties
): Promise<void> {
  try {
    const anonymousId = getAnonymousId();

    // Add current URL if not provided
    if (typeof window !== "undefined" && !properties?.url) {
      properties = {
        ...properties,
        url: window.location.pathname,
      };
    }

    // Extract UTM parameters from URL if present
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const utm_source = params.get("utm_source");
      const utm_medium = params.get("utm_medium");
      const utm_campaign = params.get("utm_campaign");

      if (utm_source || utm_medium || utm_campaign) {
        properties = {
          ...properties,
          ...(utm_source && { utm_source }),
          ...(utm_medium && { utm_medium }),
          ...(utm_campaign && { utm_campaign }),
        };
      }
    }

    await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType,
        anonymousId,
        properties,
      }),
    });
  } catch (error) {
    // Silently fail - event tracking should never break the user experience
    console.debug("Event tracking failed:", error);
  }
}

// Link anonymous events to authenticated user after login
export async function linkEventsToUser(): Promise<void> {
  try {
    const anonymousId = getAnonymousId();
    if (!anonymousId) return;

    const response = await fetch("/api/events", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ anonymousId }),
    });

    if (response.ok) {
      // Clear the anonymous ID after successful linking
      clearAnonymousId();
    }
  } catch (error) {
    console.debug("Failed to link events:", error);
  }
}

// Convenience methods for common events
export const events = {
  productView: (productId: string, productName?: string) =>
    trackEvent("product_view", { productId, productName }),

  addToCart: (productId: string, productName?: string) =>
    trackEvent("add_to_cart", { productId, productName }),

  removeFromCart: (productId: string) =>
    trackEvent("remove_from_cart", { productId }),

  checkoutStarted: (cartId?: string) =>
    trackEvent("checkout_started", { cartId }),

  checkoutCompleted: (orderId: string) =>
    trackEvent("checkout_completed", { orderId }),

  orderPlaced: (orderId: string) =>
    trackEvent("order_placed", { orderId }),

  pageView: (url?: string) =>
    trackEvent("page_view", { url }),

  signup: () => trackEvent("signup"),
};
