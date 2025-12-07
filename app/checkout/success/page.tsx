import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { OrderDetails } from "./order-details";

export const metadata = {
  title: "Order Confirmed | Bad Scandi",
  description: "Your order has been successfully placed.",
};

function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="max-w-md mx-auto text-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-900 mx-auto mb-4" />
        <p className="text-neutral-600">Loading order details...</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderDetails />
    </Suspense>
  );
}
