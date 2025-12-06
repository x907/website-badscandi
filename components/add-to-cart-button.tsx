"use client";

import { useState, useRef, useEffect } from "react";
import { ShoppingBag, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useSession } from "@/lib/auth-client";
import { trackAddToCart } from "@/lib/analytics";
import { events } from "@/lib/event-tracker";
import Link from "next/link";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    priceCents: number;
    imageUrl: string;
    stock: number;
  };
  showQuantitySelector?: boolean;
}

export function AddToCartButton({
  product,
  showQuantitySelector = true,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const isMounted = useRef(true);

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAddToCart = () => {
    // If not logged in, show sign-in prompt
    if (!session?.user) {
      setShowSignInPrompt(true);
      return;
    }

    setIsAdding(true);

    addItem(
      {
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        stock: product.stock,
      },
      quantity
    );

    // Track for external analytics (GA, Meta, Pinterest)
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.priceCents / 100,
      quantity,
    });

    // Track for internal drip email system
    events.addToCart(product.id, product.name);

    // Reset quantity after adding
    setQuantity(1);

    // Brief visual feedback - only update state if still mounted
    setTimeout(() => {
      if (isMounted.current) {
        setIsAdding(false);
      }
    }, 500);
  };

  if (product.stock <= 0) {
    return (
      <Button disabled className="w-full">
        Sold Out
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {showQuantitySelector && (
        <div className="flex items-center justify-center gap-4">
          <span className="text-sm text-neutral-600">Quantity:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" aria-hidden="true" />
            </Button>

            <span className="w-10 text-center font-medium" aria-live="polite">
              {quantity}
            </span>

            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock}
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <Button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="w-full"
        size="lg"
      >
        <ShoppingBag className="w-5 h-5 mr-2" />
        {isAdding ? "Added!" : "Add to Cart"}
      </Button>

      {product.stock <= 5 && product.stock > 0 && (
        <p className="text-sm text-amber-700 text-center">
          Only {product.stock} left in stock
        </p>
      )}

      {showSignInPrompt && (
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
          <p className="text-sm text-neutral-700 mb-2">
            Sign in to add items to your cart
          </p>
          <Link
            href="/auth/signin"
            className="text-sm font-medium text-neutral-900 underline hover:no-underline"
          >
            Sign in or create account
          </Link>
        </div>
      )}
    </div>
  );
}
