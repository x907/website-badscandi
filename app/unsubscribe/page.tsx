"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailX, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "confirm" | "success" | "error">("loading");
  const [email, setEmail] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const userId = searchParams.get("userId");
  const emailParam = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!userId || !emailParam || !token) {
      setStatus("error");
      setErrorMessage("Invalid unsubscribe link. Please use the link from your email.");
      return;
    }

    // Verify the link is valid
    fetch(`/api/unsubscribe?userId=${userId}&email=${encodeURIComponent(emailParam)}&token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("error");
          setErrorMessage(data.error);
        } else {
          setEmail(data.email);
          setStatus("confirm");
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Failed to verify unsubscribe link");
      });
  }, [userId, emailParam, token]);

  const handleUnsubscribe = async () => {
    setStatus("loading");

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email: emailParam, token }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to unsubscribe");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Failed to unsubscribe. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-6 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            {status === "loading" && (
              <>
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <MailX className="w-6 h-6 text-neutral-400 animate-pulse" />
                </div>
                <CardTitle>Processing...</CardTitle>
              </>
            )}

            {status === "confirm" && (
              <>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <MailX className="w-6 h-6 text-amber-700" />
                </div>
                <CardTitle>Unsubscribe</CardTitle>
                <CardDescription>
                  You are about to unsubscribe {email} from all marketing emails
                </CardDescription>
              </>
            )}

            {status === "success" && (
              <>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Unsubscribed</CardTitle>
                <CardDescription>
                  You have been unsubscribed from marketing emails
                </CardDescription>
              </>
            )}

            {status === "error" && (
              <>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Something went wrong</CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="text-center">
            {status === "confirm" && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  You will no longer receive promotional emails, cart reminders, or special offers.
                  You will still receive order confirmations and shipping updates.
                </p>
                <Button onClick={handleUnsubscribe} variant="destructive" className="w-full">
                  Unsubscribe
                </Button>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600">
                  We&apos;re sorry to see you go. If you change your mind, you can update your
                  preferences in your account settings.
                </p>
                <Link href="/">
                  <Button className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <Link href="/">
                  <Button className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <MailX className="w-6 h-6 text-neutral-400 animate-pulse" />
                </div>
                <CardTitle>Loading...</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
