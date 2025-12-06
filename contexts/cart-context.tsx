"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useSession } from "@/lib/auth-client";

export interface CartItem {
  productId: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  updatingItemId: string | null;
  totalItems: number;
  subtotalCents: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const { data: session } = useSession();

  // Load cart from database when user logs in
  useEffect(() => {
    if (session?.user?.id) {
      loadCartFromServer();
    } else {
      // Not logged in - clear cart state
      setItems([]);
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  const loadCartFromServer = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cart");
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToServer = useCallback(
    async (newItems: CartItem[]) => {
      if (session?.user?.id) {
        try {
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: newItems }),
          });
        } catch (error) {
          console.error("Failed to save cart to server:", error);
        }
      }
    },
    [session?.user?.id]
  );

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      if (!session?.user?.id) {
        // User must be logged in to add items
        return;
      }

      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.productId);
        let newItems: CartItem[];

        if (existing) {
          newItems = prev.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: Math.min(i.quantity + quantity, i.stock) }
              : i
          );
        } else {
          newItems = [...prev, { ...item, quantity: Math.min(quantity, item.stock) }];
        }

        saveToServer(newItems);
        return newItems;
      });
      setIsOpen(true);
    },
    [session?.user?.id, saveToServer]
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const newItems = prev.filter((i) => i.productId !== productId);
        saveToServer(newItems);
        return newItems;
      });
    },
    [saveToServer]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity < 1) {
        removeItem(productId);
        return;
      }

      setUpdatingItemId(productId);
      setItems((prev) => {
        const newItems = prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(quantity, i.stock) }
            : i
        );
        saveToServer(newItems);
        return newItems;
      });
      setTimeout(() => setUpdatingItemId(null), 200);
    },
    [removeItem, saveToServer]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    saveToServer([]);
  }, [saveToServer]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      isOpen,
      isLoading,
      updatingItemId,
      totalItems,
      subtotalCents,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
    }),
    [
      items,
      isOpen,
      isLoading,
      updatingItemId,
      totalItems,
      subtotalCents,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
