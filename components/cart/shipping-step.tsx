"use client";

import { useState } from "react";
import { Loader2, ArrowLeft, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: number;
  deliveryDays: number | null;
  displayName: string;
}

interface ShippingStepProps {
  subtotalCents: number;
  onBack: () => void;
  onSelectRate: (rate: ShippingRate, address: ShippingAddress) => void;
}

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

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const CA_PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

export function ShippingStep({ subtotalCents, onBack, onSelectRate }: ShippingStepProps) {
  const [step, setStep] = useState<"address" | "rates">("address");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

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

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const calculateRates = async () => {
    // Validate required fields
    if (!address.name || !address.street1 || !address.city || !address.state || !address.zip) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          totalCents: subtotalCents,
        }),
      });

      const data = await response.json();

      if (data.rates && data.rates.length > 0) {
        setRates(data.rates);
        setSelectedRate(data.rates[0]); // Select cheapest by default
        setStep("rates");
      } else {
        setError(data.error || "No shipping options available");
      }
    } catch (err) {
      setError("Failed to calculate shipping. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedRate) {
      onSelectRate(selectedRate, address);
    }
  };

  if (step === "rates") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setStep("address")}
          className="flex items-center text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Edit address
        </button>

        <div className="bg-neutral-50 rounded-lg p-3 text-sm">
          <p className="font-medium text-neutral-900">{address.name}</p>
          <p className="text-neutral-600">{address.street1}</p>
          {address.street2 && <p className="text-neutral-600">{address.street2}</p>}
          <p className="text-neutral-600">
            {address.city}, {address.state} {address.zip}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Select Shipping Method</Label>
          {rates.map((rate) => (
            <button
              key={rate.id}
              onClick={() => setSelectedRate(rate)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                selectedRate?.id === rate.id
                  ? "border-amber-900 bg-amber-50"
                  : "border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-neutral-500" />
                  <div>
                    <p className="font-medium text-neutral-900 text-sm">
                      {rate.displayName}
                    </p>
                    {rate.deliveryDays && (
                      <p className="text-xs text-neutral-500">
                        {rate.deliveryDays === 1
                          ? "1 business day"
                          : `${rate.deliveryDays} business days`}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-medium text-neutral-900">
                  {formatPrice(rate.rate)}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-neutral-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Subtotal</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Shipping</span>
            <span>{formatPrice(selectedRate?.rate || 0)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{formatPrice(subtotalCents + (selectedRate?.rate || 0))}</span>
          </div>
        </div>

        <Button
          className="w-full h-12"
          onClick={handleContinue}
          disabled={!selectedRate}
        >
          Continue to Payment
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center text-sm text-neutral-600 hover:text-neutral-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to cart
      </button>

      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-amber-900" />
        <h3 className="font-medium text-neutral-900">Shipping Address</h3>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor="name" className="text-sm">Full Name *</Label>
          <Input
            id="name"
            value={address.name}
            onChange={(e) => handleAddressChange("name", e.target.value)}
            placeholder="John Doe"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="street1" className="text-sm">Address Line 1 *</Label>
          <Input
            id="street1"
            value={address.street1}
            onChange={(e) => handleAddressChange("street1", e.target.value)}
            placeholder="123 Main Street"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="street2" className="text-sm">Address Line 2</Label>
          <Input
            id="street2"
            value={address.street2}
            onChange={(e) => handleAddressChange("street2", e.target.value)}
            placeholder="Apt, Suite, Unit (optional)"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city" className="text-sm">City *</Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              placeholder="City"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="state" className="text-sm">State/Province *</Label>
            <select
              id="state"
              value={address.state}
              onChange={(e) => handleAddressChange("state", e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select...</option>
              {address.country === "US" ? (
                US_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))
              ) : (
                CA_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="zip" className="text-sm">ZIP/Postal Code *</Label>
            <Input
              id="zip"
              value={address.zip}
              onChange={(e) => handleAddressChange("zip", e.target.value)}
              placeholder={address.country === "US" ? "12345" : "A1A 1A1"}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="country" className="text-sm">Country *</Label>
            <select
              id="country"
              value={address.country}
              onChange={(e) => {
                handleAddressChange("country", e.target.value);
                handleAddressChange("state", ""); // Reset state when country changes
              }}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm">Phone (for delivery updates)</Label>
          <Input
            id="phone"
            type="tel"
            value={address.phone}
            onChange={(e) => handleAddressChange("phone", e.target.value)}
            placeholder="(555) 123-4567"
            className="mt-1"
          />
        </div>
      </div>

      <Button
        className="w-full h-12"
        onClick={calculateRates}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Calculating shipping...
          </>
        ) : (
          "Calculate Shipping"
        )}
      </Button>
    </div>
  );
}
