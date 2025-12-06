import Link from "next/link";
import { CartButton } from "@/components/cart/cart-button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { HeaderUserSection } from "@/components/layout/header-user-section";

export function Header() {
  return (
    <header className="border-b border-neutral-100 bg-white">
      <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl sm:text-2xl font-semibold tracking-tight">
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

          <div className="flex items-center gap-3">
            <MobileMenu />
            <CartButton />
            <HeaderUserSection />
          </div>
        </div>
      </div>
    </header>
  );
}
