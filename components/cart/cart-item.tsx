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
  const { updateQuantity, removeItem, updatingItemId } = useCart();
  const isUpdating = updatingItemId === item.productId;

  return (
    <div className="flex gap-3 sm:gap-4 py-4 border-b border-neutral-100">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-neutral-50 rounded-lg overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 80px, 96px"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="text-sm sm:text-base font-medium text-neutral-900 truncate pr-2">
            {item.name}
          </h3>
          <button
            onClick={() => removeItem(item.productId)}
            className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full p-2 -m-1 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
            aria-label={`Remove ${item.name} from cart`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm sm:text-base text-amber-900 mt-1">
          {formatPrice(item.priceCents)}
        </p>

        <div className="flex items-center gap-3 mt-3" role="group" aria-label={`Quantity controls for ${item.name}`}>
          <Button
            variant="outline"
            size="icon"
            className={`h-11 w-11 ${isUpdating ? 'opacity-50' : ''}`}
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            disabled={item.quantity <= 1 || isUpdating}
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" aria-hidden="true" />
          </Button>

          <span
            className={`text-base font-medium w-10 text-center tabular-nums ${isUpdating ? 'opacity-50' : ''}`}
            aria-label={`Quantity: ${item.quantity}`}
          >
            {item.quantity}
          </span>

          <Button
            variant="outline"
            size="icon"
            className={`h-11 w-11 ${isUpdating ? 'opacity-50' : ''}`}
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            disabled={item.quantity >= item.stock || isUpdating}
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
