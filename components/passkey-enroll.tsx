"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint } from "lucide-react";

// Helper to convert base64url to Uint8Array
function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert Uint8Array to base64url
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function PasskeyEnroll() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleEnroll() {
    try {
      setLoading(true);
      setError("");

      // Step 1: Get registration options from Better Auth
      const optionsRes = await fetch('/api/auth/passkey/generate-register-options', {
        method: 'GET',
        credentials: 'include',
      });

      if (!optionsRes.ok) {
        throw new Error('Failed to get registration options');
      }

      const options = await optionsRes.json();

      // Step 2: Configure authenticator options
      // Let the browser/OS decide the best authenticator - don't force cross-platform
      // This allows mobile users to store passkeys on their device
      const publicKeyOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64UrlToUint8Array(options.challenge) as BufferSource,
        rp: options.rp,
        user: {
          id: base64UrlToUint8Array(options.user.id) as BufferSource,
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout,
        // Allow any authenticator type - the OS will prompt the user to choose
        authenticatorSelection: {
          requireResidentKey: true,
          residentKey: "required",
          userVerification: "required",
        },
        attestation: options.attestation || "none",
      };

      // Step 3: Trigger browser's WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('No credential created');
      }

      // Step 4: Prepare response for Better Auth
      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialID = uint8ArrayToBase64Url(new Uint8Array(credential.rawId));

      // Get transports if available (USB, NFC, BLE, internal)
      const transports = (response as any).getTransports ? (response as any).getTransports() : [];

      const registrationResponse = {
        id: credential.id,
        rawId: credentialID,
        credentialID: credentialID, // Better Auth requires this field
        response: {
          clientDataJSON: uint8ArrayToBase64Url(new Uint8Array(response.clientDataJSON)),
          attestationObject: uint8ArrayToBase64Url(new Uint8Array(response.attestationObject)),
          transports: transports, // Transport methods supported by the authenticator
        },
        type: credential.type,
      };

      // Step 5: Verify with Better Auth
      const verifyRes = await fetch('/api/auth/passkey/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          response: registrationResponse, // Better Auth expects it wrapped in "response"
          name: passkeyName.trim() || undefined, // Send name if provided
        }),
      });

      if (!verifyRes.ok) {
        throw new Error('Failed to verify passkey registration');
      }

      setSuccess(true);
      // Store timeout ref for cleanup on unmount
      timeoutRef.current = setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      // User cancelled the passkey creation - don't show error
      if (err.name === 'NotAllowedError' || err.message?.includes('timed out or was not allowed')) {
        console.log("Passkey registration cancelled by user");
      } else {
        setError(err.message || "Failed to enroll passkey");
        console.error("Passkey enrollment error:", err);
      }
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

            <div>
              <label htmlFor="passkey-name" className="block text-sm font-medium text-neutral-700 mb-1">
                Passkey Name (optional)
              </label>
              <input
                id="passkey-name"
                type="text"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                placeholder="e.g., My iPhone, Work Laptop"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                disabled={loading}
              />
            </div>

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
