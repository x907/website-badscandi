"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint } from "lucide-react";

export function PasskeyEnroll() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleEnroll() {
    try {
      setLoading(true);
      setError("");

      const optionsResponse = await fetch("/api/passkey/register-options", {
        method: "POST",
      });

      if (!optionsResponse.ok) {
        throw new Error("Failed to get registration options");
      }

      const options = await optionsResponse.json();

      const attResp = await startRegistration(options);

      const verifyResponse = await fetch("/api/passkey/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: attResp,
          expectedChallenge: options.challenge,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Failed to verify passkey");
      }

      setSuccess(true);
      window.location.href = "/account";
    } catch (err: any) {
      setError(err.message || "Failed to enroll passkey");
      console.error("Passkey enrollment error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Set up Passkey
        </CardTitle>
        <CardDescription>
          Secure your account with biometric authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="text-sm text-green-600">
            Passkey enrolled successfully! Redirecting...
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Passkeys let you sign in securely using your fingerprint, face, or device PIN.
              No passwords needed!
            </p>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              onClick={handleEnroll}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Setting up..." : "Create Passkey"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
