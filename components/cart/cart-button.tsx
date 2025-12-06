"use client";

import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";

export function CartButton() {
  const { openCart, totalItems, isLoading } = useCart();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openCart}
      className="relative"
      aria-label={`Shopping cart with ${totalItems} items`}
    >
      <ShoppingBag className="h-5 w-5" />
      {!isLoading && totalItems > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-900 text-white text-xs flex items-center justify-center font-medium">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
    </Button>
  );
}
