"use client";

import { useState } from "react";
import { ShoppingBag, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { trackAddToCart } from "@/lib/analytics";
import { events } from "@/lib/event-tracker";

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
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
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

    // Brief visual feedback
    setTimeout(() => setIsAdding(false), 500);
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
              className="h-8 w-8"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>

            <span className="w-8 text-center font-medium">{quantity}</span>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock}
            >
              <Plus className="w-4 h-4" />
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
    </div>
  );
}
