"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-6 py-24">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-neutral-600 mb-8">
          We're sorry, but something unexpected happened. Please try again or
          return to the home page.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={reset}>
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" size="lg">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
