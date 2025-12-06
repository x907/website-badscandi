"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Mail } from "lucide-react";

interface MarketingPreferencesProps {
  initialConsent: boolean;
}

export function MarketingPreferences({ initialConsent }: MarketingPreferencesProps) {
  const [marketingConsent, setMarketingConsent] = useState(initialConsent);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMarketingConsent(initialConsent);
  }, [initialConsent]);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingConsent: checked }),
      });

      const data = await response.json();

      if (data.success) {
        setMarketingConsent(checked);
      } else {
        // Revert on error
        console.error("Failed to update preferences:", data.error);
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Preferences
        </CardTitle>
        <CardDescription>
          Manage your email communication preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Marketing emails</p>
            <p className="text-xs text-neutral-500">
              Receive product updates, special offers, and promotions
            </p>
          </div>
          <Switch
            checked={marketingConsent}
            onCheckedChange={handleToggle}
            disabled={isLoading}
          />
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          You will always receive order confirmations and shipping updates regardless of this setting.
        </p>
      </CardContent>
    </Card>
  );
}
