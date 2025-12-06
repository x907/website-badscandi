"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
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

const CART_STORAGE_KEY = "badscandi-cart";
const CART_CLEARED_KEY = "badscandi-cart-cleared";
const CART_CLEARED_TIMEOUT = 30000; // 30 seconds to allow server cleanup

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const hasSynced = useRef(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoading]);

  // Save to server helper - uses ref to avoid stale closures
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

  // Sync with database when user logs in
  useEffect(() => {
    if (session?.user?.id && !isLoading && !hasSynced.current) {
      // Check if cart was recently cleared (e.g., after checkout)
      const cartCleared = localStorage.getItem(CART_CLEARED_KEY);
      if (cartCleared) {
        const clearedTime = parseInt(cartCleared, 10);
        // Only respect the flag for 30 seconds
        if (Date.now() - clearedTime < CART_CLEARED_TIMEOUT) {
          return;
        }
        // Flag expired, remove it
        localStorage.removeItem(CART_CLEARED_KEY);
      }

      hasSynced.current = true;
      syncCartWithDatabase();
    }
  }, [session?.user?.id, isLoading]);

  // Reset sync flag when user logs out
  useEffect(() => {
    if (!session?.user?.id) {
      hasSynced.current = false;
    }
  }, [session?.user?.id]);

  const syncCartWithDatabase = async () => {
    try {
      // Fetch server cart
      const response = await fetch("/api/cart");
      if (!response.ok) return;

      const serverCart = await response.json();
      const serverItems: CartItem[] = serverCart.items || [];

      // Use functional update to get current local items and merge properly
      setItems((localItems) => {
        // If both are empty, nothing to do
        if (localItems.length === 0 && serverItems.length === 0) {
          return localItems;
        }

        // Merge: local items take precedence, add server items that don't exist locally
        const merged = [...localItems];
        for (const serverItem of serverItems) {
          const existsLocally = merged.find(
            (item) => item.productId === serverItem.productId
          );
          if (!existsLocally) {
            merged.push(serverItem);
          }
        }

        // Save merged cart back to server (only if there was a change)
        if (merged.length > 0 && merged.length !== localItems.length) {
          fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: merged }),
          }).catch((err) => console.error("Failed to save merged cart:", err));
        }

        return merged;
      });
    } catch (error) {
      console.error("Failed to sync cart:", error);
    }
  };

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
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
    [saveToServer]
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
    (productId: string, quantity: number) => {
      if (quantity < 1) {
        removeItem(productId);
        return;
      }

      setItems((prev) => {
        const newItems = prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.min(quantity, i.stock) }
            : i
        );
        saveToServer(newItems);
        return newItems;
      });
    },
    [removeItem, saveToServer]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    // Set a flag to prevent syncing from server (cart was intentionally cleared)
    localStorage.setItem(CART_CLEARED_KEY, Date.now().toString());
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
