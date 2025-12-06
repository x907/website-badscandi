import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { CartButton } from "@/components/cart/cart-button";

export async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className="border-b border-neutral-100 bg-white">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-semibold tracking-tight">
            Bad Scandi
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/shop"
              className="text-sm font-medium hover:text-amber-900 transition-colors"
            >
              Shop
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium hover:text-amber-900 transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <CartButton />
            {session?.user ? (
              <Link href="/account">
                <Button variant="ghost" size="icon" className="relative">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-900" />
                  </div>
                </Button>
              </Link>
            ) : (
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
