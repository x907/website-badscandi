"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCart, CartItem as CartItemType } from "@/contexts/cart-context";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-4 py-4 border-b border-neutral-100">
      <div className="relative w-20 h-20 flex-shrink-0 bg-neutral-50 rounded-lg overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-neutral-900 truncate pr-2">
            {item.name}
          </h3>
          <button
            onClick={() => removeItem(item.productId)}
            className="text-neutral-400 hover:text-neutral-600 p-2 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Remove item"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-amber-900 mt-1">
          {formatPrice(item.priceCents)}
        </p>

        <div className="flex items-center gap-2 mt-2" role="group" aria-label={`Quantity controls for ${item.name}`}>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" aria-hidden="true" />
          </Button>

          <span className="text-sm w-8 text-center" aria-label={`Quantity: ${item.quantity}`}>{item.quantity}</span>

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            disabled={item.quantity >= item.stock}
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </Button>

          {item.quantity >= item.stock && (
            <span className="text-xs text-neutral-500">Max</span>
          )}
        </div>
      </div>
    </div>
  );
}
