"use client";

import { useEffect } from "react";
import { trackProductView } from "@/lib/analytics";
import { events } from "@/lib/event-tracker";

interface ProductViewTrackerProps {
  product: {
    id: string;
    name: string;
    priceCents: number;
  };
}

export function ProductViewTracker({ product }: ProductViewTrackerProps) {
  useEffect(() => {
    // Track for external analytics (GA, Meta, Pinterest)
    trackProductView({
      id: product.id,
      name: product.name,
      price: product.priceCents,
    });

    // Track for internal drip email system
    events.productView(product.id, product.name);
  }, [product.id, product.name, product.priceCents]);

  return null;
}
