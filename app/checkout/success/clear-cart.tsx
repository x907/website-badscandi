"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/contexts/cart-context";

export function ClearCart() {
  const { clearCart } = useCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    // Only clear once per mount - clearCart handles localStorage and server sync
    if (!hasCleared.current) {
      hasCleared.current = true;
      clearCart();
    }
  }, [clearCart]);

  return null;
}
