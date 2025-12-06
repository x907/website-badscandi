import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClearCart } from "./clear-cart";

export const metadata = {
  title: "Order Confirmed | Bad Scandi",
  description: "Your order has been successfully placed.",
};

export default function CheckoutSuccessPage() {
  return (
    <>
      <ClearCart />
    <div className="container mx-auto px-6 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-semibold text-neutral-900 mb-3">
          Thank you for your order!
        </h1>

        <p className="text-neutral-600 mb-8">
          Your order has been confirmed and is being prepared. You&apos;ll
          receive an email confirmation shortly.
        </p>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/account">View Order Details</Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>

        <p className="text-sm text-neutral-500 mt-8">
          Questions about your order?{" "}
          <Link href="/contact" className="text-amber-900 hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
