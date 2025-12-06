"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { CartItem } from "./cart-item";
import { CartEmpty } from "./cart-empty";
import { CartSummary } from "./cart-summary";

export function CartDrawer() {
  const { isOpen, closeCart, items } = useCart();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300">
          <div className="flex items-center justify-between p-4 border-b border-neutral-100">
            <Dialog.Title className="text-lg font-medium text-neutral-900">
              Your Cart
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-2 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <CartEmpty />
            ) : (
              <div>
                {items.map((item) => (
                  <CartItem key={item.productId} item={item} />
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="p-4 bg-neutral-50">
              <CartSummary />
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
