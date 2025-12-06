// Analytics event tracking utilities

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    pintrk?: (...args: any[]) => void;
  }
}

// Google Analytics Events
export const trackGAEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
};

// Meta Pixel Events
export const trackMetaEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
};

// Pinterest Tag Events
export const trackPinterestEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window !== "undefined" && window.pintrk) {
    window.pintrk("track", eventName, params);
  }
};

// Track product view
export const trackProductView = (product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}) => {
  // Google Analytics
  trackGAEvent("view_item", {
    currency: "USD",
    value: product.price / 100,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price / 100,
      },
    ],
  });

  // Meta Pixel
  trackMetaEvent("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price / 100,
    currency: "USD",
  });

  // Pinterest
  trackPinterestEvent("pagevisit", {
    product_id: product.id,
    product_name: product.name,
    product_price: product.price / 100,
  });
};

// Track add to cart (if you add cart functionality later)
export const trackAddToCart = (product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) => {
  // Google Analytics
  trackGAEvent("add_to_cart", {
    currency: "USD",
    value: (product.price * product.quantity) / 100,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price / 100,
        quantity: product.quantity,
      },
    ],
  });

  // Meta Pixel
  trackMetaEvent("AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: (product.price * product.quantity) / 100,
    currency: "USD",
  });

  // Pinterest
  trackPinterestEvent("addtocart", {
    value: (product.price * product.quantity) / 100,
    order_quantity: product.quantity,
    currency: "USD",
  });
};

// Track checkout started
export const trackCheckoutStarted = (checkout: {
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalValue: number;
}) => {
  // Google Analytics
  trackGAEvent("begin_checkout", {
    currency: "USD",
    value: checkout.totalValue,
    items: checkout.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });

  // Meta Pixel
  trackMetaEvent("InitiateCheckout", {
    content_ids: checkout.items.map((item) => item.id),
    content_type: "product",
    value: checkout.totalValue,
    currency: "USD",
    num_items: checkout.items.reduce((sum, item) => sum + item.quantity, 0),
  });

  // Pinterest
  trackPinterestEvent("checkout", {
    value: checkout.totalValue,
    order_quantity: checkout.items.reduce((sum, item) => sum + item.quantity, 0),
    currency: "USD",
  });
};

// Track purchase completion
export const trackPurchase = (order: {
  id: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity?: number;
  }>;
}) => {
  // Google Analytics
  trackGAEvent("purchase", {
    transaction_id: order.id,
    value: order.total / 100,
    currency: "USD",
    items: order.items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price / 100,
      quantity: item.quantity || 1,
    })),
  });

  // Meta Pixel
  trackMetaEvent("Purchase", {
    content_ids: order.items.map((item) => item.id),
    content_type: "product",
    value: order.total / 100,
    currency: "USD",
  });

  // Pinterest
  trackPinterestEvent("checkout", {
    value: order.total / 100,
    order_quantity: order.items.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    ),
    currency: "USD",
  });
};
