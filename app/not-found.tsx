import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-6 py-24">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-6xl font-bold text-neutral-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-neutral-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been
          moved or no longer exists.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg">Go Home</Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" size="lg">
              Browse Shop
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
