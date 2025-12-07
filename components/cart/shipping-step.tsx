"use client";

import { useState } from "react";
import { Loader2, ArrowLeft, MapPin, Truck } from "lucide-react";
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
  onSelectRate: (rate: ShippingRate, zip: string, country: string) => void;
}

export function ShippingStep({ subtotalCents, onBack, onSelectRate }: ShippingStepProps) {
  const [step, setStep] = useState<"zip" | "rates">("zip");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("US");

  const calculateRates = async () => {
    if (!zip) {
      setError("Please enter your ZIP/postal code");
      return;
    }

    // Basic ZIP validation
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    const caPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

    if (country === "US" && !usZipRegex.test(zip)) {
      setError("Please enter a valid US ZIP code (e.g., 12345)");
      return;
    }
    if (country === "CA" && !caPostalRegex.test(zip)) {
      setError("Please enter a valid Canadian postal code (e.g., A1A 1A1)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            zip,
            country,
            // Minimal address for rate estimation
            street1: "123 Main St",
            city: "City",
            state: country === "US" ? "NY" : "ON",
          },
          totalCents: subtotalCents,
        }),
      });

      const data = await response.json();

      if (data.rates && data.rates.length > 0) {
        setRates(data.rates);
        setSelectedRate(data.rates[0]);
        setStep("rates");
      } else {
        setError(data.error || "No shipping options available for this location");
      }
    } catch (err) {
      setError("Failed to calculate shipping. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedRate) {
      onSelectRate(selectedRate, zip, country);
    }
  };

  if (step === "rates") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setStep("zip")}
          className="flex items-center text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Change location
        </button>

        <div className="bg-neutral-50 rounded-lg p-3 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-neutral-500" />
          <span className="text-neutral-700">
            Shipping to <span className="font-medium">{zip}</span>, {country === "US" ? "United States" : "Canada"}
          </span>
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

        <p className="text-xs text-neutral-500 text-center">
          You'll enter your full address at checkout
        </p>
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

      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-amber-900" />
        <h3 className="font-medium text-neutral-900">Where are we shipping to?</h3>
      </div>

      <p className="text-sm text-neutral-500">
        Enter your ZIP code to see shipping options
      </p>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor="country" className="text-sm">Country</Label>
          <select
            id="country"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setZip("");
              setError(null);
            }}
            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
          </select>
        </div>

        <div>
          <Label htmlFor="zip" className="text-sm">
            {country === "US" ? "ZIP Code" : "Postal Code"}
          </Label>
          <Input
            id="zip"
            value={zip}
            onChange={(e) => {
              setZip(e.target.value);
              setError(null);
            }}
            placeholder={country === "US" ? "12345" : "A1A 1A1"}
            className="mt-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                calculateRates();
              }
            }}
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
            Getting rates...
          </>
        ) : (
          "See Shipping Options"
        )}
      </Button>
    </div>
  );
}
