"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

interface CheckoutButtonProps {
  productId: string;
}

export function CheckoutButton({ productId }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    try {
      setLoading(true);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Button
      size="lg"
      onClick={handleCheckout}
      disabled={loading}
      className="w-full gap-2"
    >
      <ShoppingBag className="h-5 w-5" />
      {loading ? "Processing..." : "Purchase Now"}
    </Button>
  );
}
