"use client";

import { useEffect } from "react";
import { trackProductView } from "@/lib/analytics";

interface ProductViewTrackerProps {
  product: {
    id: string;
    name: string;
    priceCents: number;
  };
}

export function ProductViewTracker({ product }: ProductViewTrackerProps) {
  useEffect(() => {
    trackProductView({
      id: product.id,
      name: product.name,
      price: product.priceCents,
    });
  }, [product.id, product.name, product.priceCents]);

  return null;
}
