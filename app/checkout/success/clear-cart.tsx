"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/contexts/cart-context";

const CART_STORAGE_KEY = "badscandi-cart";
const CART_CLEARED_KEY = "badscandi-cart-cleared";

export function ClearCart() {
  const { clearCart } = useCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    // Only clear once per mount
    if (!hasCleared.current) {
      hasCleared.current = true;

      // Clear localStorage directly to ensure it's gone
      localStorage.removeItem(CART_STORAGE_KEY);

      // Set flag to prevent re-syncing from server
      localStorage.setItem(CART_CLEARED_KEY, Date.now().toString());

      // Also clear via context (which syncs to server)
      clearCart();
    }
  }, [clearCart]);

  return null;
}
