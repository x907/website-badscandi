"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { ArrowLeft, Loader2, Package, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useSession } from "@/lib/auth-client";
import { formatPrice } from "@/lib/utils";
import { trackCheckoutStarted } from "@/lib/analytics";
import { events } from "@/lib/event-tracker";

interface ShippingAddress {
  name: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  deliveryDays: number | null;
}

interface ShippingRatesResponse {
  rates: ShippingRate[];
  shipmentId: string;
}

const SUPPORTED_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SG", name: "Singapore" },
];

export function CheckoutClient() {
  const router = useRouter();
  const { items, subtotalCents, closeCart, isLoading: isCartLoading } = useCart();
  const { data: session, isPending: isSessionLoading } = useSession();

  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    name: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    phone: "",
  });

  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const [step, setStep] = useState<"address" | "shipping" | "payment">("address");
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Stripe
  useEffect(() => {
    fetch("/api/stripe/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
      })
      .catch(console.error);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!isSessionLoading && !session?.user) {
      router.push("/auth/signin?redirect=/checkout");
    }
  }, [session, isSessionLoading, router]);

  // Redirect if cart is empty (only after cart has loaded)
  useEffect(() => {
    if (!isSessionLoading && !isCartLoading && items.length === 0) {
      router.push("/shop");
    }
  }, [items, isSessionLoading, isCartLoading, router]);

  // Track checkout started
  useEffect(() => {
    if (items.length > 0) {
      trackCheckoutStarted({
        items: items.map((item) => ({
          id: item.productId,
          name: item.name,
          price: item.priceCents / 100,
          quantity: item.quantity,
        })),
        totalValue: subtotalCents / 100,
      });
      events.checkoutStarted();
      closeCart();
    }
  }, []);

  // Fetch shipping rates when address is complete
  const fetchShippingRates = useCallback(async () => {
    if (!address.street1 || !address.city || !address.zip || !address.country) {
      return;
    }

    setIsLoadingRates(true);
    setRatesError(null);

    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            name: address.name || "Customer",
            street1: address.street1,
            street2: address.street2 || undefined,
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: address.country,
          },
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get shipping rates");
      }

      setShippingRates(data.rates);
      setShipmentId(data.shipmentId);

      // Auto-select cheapest rate
      if (data.rates.length > 0) {
        setSelectedRate(data.rates[0]);
      }

      setStep("shipping");
    } catch (err) {
      setRatesError(err instanceof Error ? err.message : "Failed to get shipping rates");
    } finally {
      setIsLoadingRates(false);
    }
  }, [address, items]);

  // Create PaymentIntent when shipping is selected
  const createPaymentIntent = async () => {
    if (!selectedRate || !shipmentId) return;

    setIsCreatingIntent(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceCents: item.priceCents,
          })),
          shippingAddress: address,
          shippingRateCents: selectedRate.rate,
          shipmentId,
          selectedRateId: selectedRate.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to create payment");
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create payment");
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShippingRates();
  };

  if (isSessionLoading || isCartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (items.length === 0) {
    return null;
  }

  const totalCents = subtotalCents + (selectedRate?.rate || 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          href="/shop"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Link>

        <h1 className="text-2xl font-semibold text-neutral-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center space-x-4 mb-8">
              <StepIndicator step={1} current={step === "address"} completed={step !== "address"} label="Address" />
              <div className="flex-1 h-px bg-neutral-200" />
              <StepIndicator step={2} current={step === "shipping"} completed={step === "payment"} label="Shipping" />
              <div className="flex-1 h-px bg-neutral-200" />
              <StepIndicator step={3} current={step === "payment"} completed={false} label="Payment" />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1: Address */}
            {step === "address" && (
              <form onSubmit={handleAddressSubmit} className="bg-white rounded-lg border border-neutral-200 p-6">
                <h2 className="text-lg font-medium text-neutral-900 mb-6">Shipping Address</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={address.name}
                      onChange={(e) => setAddress({ ...address, name: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={address.street1}
                      onChange={(e) => setAddress({ ...address, street1: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Apartment, suite, etc. (optional)
                    </label>
                    <input
                      type="text"
                      value={address.street2}
                      onChange={(e) => setAddress({ ...address, street2: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">State / Province</label>
                      <input
                        type="text"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        required
                        value={address.zip}
                        onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Country</label>
                      <select
                        required
                        value={address.country}
                        onChange={(e) => setAddress({ ...address, country: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      >
                        {SUPPORTED_COUNTRIES.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full mt-6 h-12" disabled={isLoadingRates}>
                  {isLoadingRates ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculating Shipping...
                    </>
                  ) : (
                    "Continue to Shipping"
                  )}
                </Button>

                {ratesError && (
                  <p className="mt-4 text-sm text-red-600">{ratesError}</p>
                )}
              </form>
            )}

            {/* Step 2: Shipping Selection */}
            {step === "shipping" && (
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-neutral-900">Select Shipping</h2>
                  <button
                    onClick={() => setStep("address")}
                    className="text-sm text-amber-700 hover:text-amber-800"
                  >
                    Edit Address
                  </button>
                </div>

                <div className="mb-4 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600">
                  <p className="font-medium">{address.name}</p>
                  <p>{address.street1}{address.street2 && `, ${address.street2}`}</p>
                  <p>{address.city}, {address.state} {address.zip}</p>
                  <p>{SUPPORTED_COUNTRIES.find(c => c.code === address.country)?.name}</p>
                </div>

                <div className="space-y-3">
                  {shippingRates.map((rate) => (
                    <label
                      key={rate.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRate?.id === rate.id
                          ? "border-amber-500 bg-amber-50"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="shipping"
                          checked={selectedRate?.id === rate.id}
                          onChange={() => setSelectedRate(rate)}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="ml-3">
                          <p className="font-medium text-neutral-900">
                            {rate.carrier} {rate.service}
                          </p>
                          {rate.deliveryDays && (
                            <p className="text-sm text-neutral-500">
                              {rate.deliveryDays} business day{rate.deliveryDays > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-medium text-neutral-900">
                        {formatPrice(rate.rate)}
                      </span>
                    </label>
                  ))}
                </div>

                <Button
                  onClick={createPaymentIntent}
                  className="w-full mt-6 h-12"
                  disabled={!selectedRate || isCreatingIntent}
                >
                  {isCreatingIntent ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Preparing Payment...
                    </>
                  ) : (
                    "Continue to Payment"
                  )}
                </Button>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === "payment" && clientSecret && stripePromise && (
              <div className="bg-white rounded-lg border border-neutral-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-neutral-900">Payment</h2>
                  <button
                    onClick={() => setStep("shipping")}
                    className="text-sm text-amber-700 hover:text-amber-800"
                  >
                    Change Shipping
                  </button>
                </div>

                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "#78350f",
                        borderRadius: "8px",
                      },
                    },
                  }}
                >
                  <PaymentForm
                    paymentIntentId={paymentIntentId!}
                    totalCents={totalCents}
                  />
                </Elements>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-neutral-200 p-6 sticky top-6">
              <h2 className="text-lg font-medium text-neutral-900 mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-neutral-800 text-white text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{item.name}</p>
                      <p className="text-sm text-neutral-500">{formatPrice(item.priceCents)}</p>
                    </div>
                    <p className="font-medium text-neutral-900">
                      {formatPrice(item.priceCents * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-200 pt-4 space-y-3">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Shipping
                  </span>
                  <span>
                    {selectedRate ? formatPrice(selectedRate.rate) : "Calculated next"}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Total</span>
                  <span>{formatPrice(totalCents)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-amber-700 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Handcrafted with care</p>
                    <p className="mt-1 text-amber-700">
                      Each piece is carefully packaged to ensure safe delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  current,
  completed,
  label,
}: {
  step: number;
  current: boolean;
  completed: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          completed
            ? "bg-amber-600 text-white"
            : current
            ? "bg-amber-100 text-amber-800 border-2 border-amber-600"
            : "bg-neutral-100 text-neutral-400"
        }`}
      >
        {completed ? <CheckCircle2 className="h-5 w-5" /> : step}
      </div>
      <span className={current || completed ? "text-neutral-900 font-medium" : "text-neutral-400"}>
        {label}
      </span>
    </div>
  );
}

function PaymentForm({
  paymentIntentId,
  totalCents,
}: {
  paymentIntentId: string;
  totalCents: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?payment_intent=${paymentIntentId}`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full mt-6 h-12"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formatPrice(totalCents)}`
        )}
      </Button>

      <p className="mt-4 text-xs text-center text-neutral-500">
        Your payment is securely processed by Stripe
      </p>
    </form>
  );
}
