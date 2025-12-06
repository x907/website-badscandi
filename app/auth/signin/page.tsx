"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Fingerprint, Mail, Loader2 } from "lucide-react";

export default function SignInPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handlePasskeySignIn() {
    try {
      setLoading("passkey");
      setError("");

      const { error } = await signIn.passkey({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/account";
          },
          onError: (context) => {
            // User-friendly error messages
            const message = context.error.message || "";
            if (message.includes("No credential") || message.includes("not found") || message.includes("cancelled")) {
              // No passkey found or user cancelled - show helpful message
              setError("No passkey found for this site.");
            } else {
              setError(message || "Failed to sign in with passkey");
            }
            setLoading(null);
          },
        },
      });

      if (error) {
        setError(error.message || "Failed to sign in with passkey");
        setLoading(null);
      }
    } catch (err: any) {
      // User cancelled or no passkey found
      if (err.name === "NotAllowedError" || err.message?.includes("cancelled")) {
        setError("No passkey found for this site.");
        setLoading(null);
        return;
      }
      setError(err.message || "Failed to sign in with passkey");
      setLoading(null);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading("email");
      setError("");

      await signIn.magicLink({
        email,
        callbackURL: "/account",
      });

      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send magic link");
    } finally {
      setLoading(null);
    }
  }

  async function handleSocialSignIn(provider: "google") {
    try {
      setLoading(provider);
      setError("");

      await signIn.social({
        provider,
        callbackURL: "/account",
      });
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setLoading(null);
    }
  }

  return (
    <div className="container mx-auto px-6 py-24">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome</h1>
          <p className="text-neutral-600">Sign in or create an account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Choose your preferred sign-in method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Helpful hint when no passkey exists */}
            {error?.includes("No passkey") && (
              <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 p-4 rounded-lg -mt-2">
                <p className="font-medium mb-1">New to Bad Scandi?</p>
                <p>Sign in with email or Google first. You can create a passkey afterwards for one-tap sign-ins.</p>
              </div>
            )}

            {emailSent ? (
              <>
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="font-medium mb-2">Check your email!</p>
                  <p className="text-neutral-600 text-sm mb-4">
                    We sent a sign-in link to <strong>{email}</strong>
                  </p>
                  <p className="text-xs text-neutral-500">
                    Didn't receive it? Check your spam folder.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  disabled={loading !== null}
                >
                  Use a different email
                </Button>
              </>
            ) : (
              <>
                {/* Primary: Passkey Sign-In */}
                <Button
                  className="w-full h-12"
                  onClick={handlePasskeySignIn}
                  disabled={loading !== null}
                >
                  <Fingerprint className="h-5 w-5 mr-2" />
                  {loading === "passkey" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign in with Passkey"
                  )}
                </Button>
                <p className="text-xs text-center text-neutral-500 -mt-2">
                  Use your fingerprint, face, or device PIN
                </p>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-neutral-500">or</span>
                  </div>
                </div>

                {/* Email Sign-In */}
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading !== null}
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full"
                    disabled={loading !== null}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {loading === "email" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Continue with Email"
                    )}
                  </Button>
                </form>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-neutral-500">or</span>
                  </div>
                </div>

                {/* Google Sign-In */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialSignIn("google")}
                  disabled={loading !== null}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {loading === "google" ? "Signing in..." : "Continue with Google"}
                </Button>
              </>
            )}

            <p className="text-xs text-center text-neutral-500 mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-neutral-600 mt-6">
          New here? Just sign in - we'll create your account automatically.
        </p>
      </div>
    </div>
  );
}
