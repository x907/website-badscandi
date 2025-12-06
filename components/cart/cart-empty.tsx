"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";

export function CartEmpty() {
  const { closeCart } = useCart();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
        <ShoppingBag className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        Your cart is empty
      </h3>
      <p className="text-sm text-neutral-500 mb-6">
        Add some items to get started
      </p>
      <Button asChild onClick={closeCart}>
        <Link href="/shop">Browse Shop</Link>
      </Button>
    </div>
  );
}
