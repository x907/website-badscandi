"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CONSENT_KEY = "cookie-consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-white border-t border-neutral-200 shadow-lg safe-area-inset-bottom">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-neutral-600 flex-1">
            We use cookies.{" "}
            <Link href="/privacy" className="text-amber-900 hover:underline">
              Learn more
            </Link>
          </p>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={handleDecline}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 rounded-md transition-colors touch-manipulation"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-700 rounded-md transition-colors touch-manipulation"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "accepted";
}
