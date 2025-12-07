"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { formatPrice } from "@/lib/utils";

interface OrderItem {
  name: string;
  quantity: number;
  amountTotal: number;
}

interface Order {
  id: string;
  email: string;
  name: string;
  phone?: string;
  amountTotal: number;
  currency: string;
  shippingCost: number;
  shippingMethod: string;
  items: OrderItem[];
  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  createdAt: string;
}

export function OrderDetails() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear cart once on mount
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!sessionId) {
      setError("No order information found. Please check your email for order confirmation.");
      setLoading(false);
      return;
    }

    async function verifyOrder() {
      try {
        const response = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "Could not verify order. Please check your email for confirmation.");
        }
      } catch (err) {
        setError("Could not verify order. Please check your email for confirmation.");
      } finally {
        setLoading(false);
      }
    }

    verifyOrder();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-md mx-auto text-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-900 mx-auto mb-4" />
          <p className="text-neutral-600">Confirming your order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5 sm:mb-6">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
            Order Verification
          </h1>
          <p className="text-neutral-600 mb-8">{error}</p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/account">View Your Orders</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5 sm:mb-6">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
            Thank you for your order!
          </h1>
          <p className="text-neutral-600">
            A confirmation email has been sent to <strong>{order?.email}</strong>
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-neutral-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-neutral-900 mb-4">Order Summary</h2>

          {/* Items */}
          <div className="space-y-3 mb-4">
            {order?.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-neutral-600">
                  {item.name} × {item.quantity}
                </span>
                <span className="text-neutral-900 font-medium">
                  {formatPrice(item.amountTotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Shipping ({order?.shippingMethod})</span>
              <span className="text-neutral-900">
                {order?.shippingCost ? formatPrice(order.shippingCost) : "Free"}
              </span>
            </div>
            <div className="flex justify-between text-base font-medium">
              <span className="text-neutral-900">Total</span>
              <span className="text-neutral-900">
                {formatPrice(order?.amountTotal || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order?.shippingAddress && (
          <div className="bg-neutral-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-neutral-900 mb-4">Shipping To</h2>
            <div className="text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">{order.name}</p>
              {order.shippingAddress.line1 && <p>{order.shippingAddress.line1}</p>}
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postal_code}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.phone && <p className="mt-2">{order.phone}</p>}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/account">View Order Details</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>

        <p className="text-sm text-neutral-500 mt-8 text-center">
          Questions about your order?{" "}
          <Link href="/contact" className="text-amber-900 hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
