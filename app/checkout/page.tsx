import { Suspense } from "react";
import { CheckoutClient } from "./checkout-client";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Checkout | Bad Scandi",
  description: "Complete your purchase",
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
