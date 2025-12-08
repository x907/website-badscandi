"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { useSession } from "@/lib/auth-client";

export function CartSummary() {
  const { subtotalCents, items, closeCart, clearCart } = useCart();
  const { data: session } = useSession();

  const handleCheckout = () => {
    // Navigate to the custom checkout page
    closeCart();
    window.location.href = "/checkout";
  };

  return (
    <div className="border-t border-neutral-200 pt-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm sm:text-base text-neutral-600">Subtotal</span>
        <span className="text-lg sm:text-xl font-medium text-neutral-900">
          {formatPrice(subtotalCents)}
        </span>
      </div>

      <p className="text-xs sm:text-sm text-neutral-500 mb-4">
        Shipping &amp; taxes calculated at checkout
      </p>

      {session?.user ? (
        <Button
          className="w-full h-12"
          onClick={handleCheckout}
          disabled={items.length === 0}
        >
          Checkout
        </Button>
      ) : (
        <Button asChild className="w-full h-12" onClick={closeCart}>
          <Link href="/auth/signin">Sign in to Checkout</Link>
        </Button>
      )}

      <button
        onClick={clearCart}
        className="w-full mt-3 py-2 text-sm text-neutral-500 hover:text-neutral-700 min-h-[44px]"
      >
        Clear cart
      </button>
    </div>
  );
}
