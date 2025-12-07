"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { useSession, signIn } from "@/lib/auth-client";
import { trackCheckoutStarted } from "@/lib/analytics";
import { events } from "@/lib/event-tracker";

export function CartSummary() {
  const { subtotalCents, items, closeCart, clearCart } = useCart();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    // Track checkout started for analytics and drip
    trackCheckoutStarted({
      items: items.map((item) => ({
        id: item.productId,
        name: item.name,
        price: item.priceCents / 100,
        quantity: item.quantity,
      })),
      totalValue: subtotalCents / 100,
    });
    events.checkoutStarted();

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.code === "SESSION_EXPIRED") {
        setError("Your session has expired. Please sign in again.");
        // Redirect to sign in after a short delay
        setTimeout(() => {
          signIn.social({ provider: "google", callbackURL: window.location.href });
        }, 2000);
      } else if (data.error) {
        setError(data.message || data.error);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
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
        Shipping calculated at checkout
      </p>

      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {session?.user ? (
        <Button
          className="w-full h-12"
          onClick={handleCheckout}
          disabled={isLoading || items.length === 0}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Processing...
            </>
          ) : (
            "Checkout"
          )}
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
