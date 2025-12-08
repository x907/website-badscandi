import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-white mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold mb-3 sm:mb-4">Bad Scandi</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Hand-dyed fiber art and boho wall hangings for your home.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-3 sm:mb-4 text-sm">Shop</h4>
            <ul className="space-y-1 text-sm text-neutral-600">
              <li>
                <Link href="/shop" className="block py-2 -mx-2 px-2 hover:text-amber-900 active:text-amber-900 active:bg-amber-50 rounded-lg transition-colors touch-manipulation">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/shop?featured=true" className="block py-2 -mx-2 px-2 hover:text-amber-900 active:text-amber-900 active:bg-amber-50 rounded-lg transition-colors touch-manipulation">
                  Featured
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3 sm:mb-4 text-sm">Company</h4>
            <ul className="space-y-1 text-sm text-neutral-600">
              <li>
                <Link href="/about" className="block py-2 -mx-2 px-2 hover:text-amber-900 active:text-amber-900 active:bg-amber-50 rounded-lg transition-colors touch-manipulation">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="block py-2 -mx-2 px-2 hover:text-amber-900 active:text-amber-900 active:bg-amber-50 rounded-lg transition-colors touch-manipulation">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3 sm:mb-4 text-sm">Legal</h4>
            <ul className="space-y-1 text-sm text-neutral-600">
              <li>
                <Link href="/privacy" className="block py-2 -mx-2 px-2 hover:text-amber-900 active:text-amber-900 active:bg-amber-50 rounded-lg transition-colors touch-manipulation">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="block py-2 -mx-2 px-2 hover:text-amber-900 active:text-amber-900 active:bg-amber-50 rounded-lg transition-colors touch-manipulation">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-neutral-100">
          <div className="mb-6 sm:mb-8">
            <h4 className="font-semibold mb-4 text-sm">Shop Policies</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-sm text-neutral-600">
              <div>
                <h5 className="font-medium text-neutral-900 mb-2">Shipping</h5>
                <p className="text-xs">See item details for estimated arrival times.</p>
              </div>
              <div>
                <h5 className="font-medium text-neutral-900 mb-2">Customs & Import Taxes</h5>
                <p className="text-xs">Buyers are responsible for any customs and import taxes. We're not responsible for delays due to customs.</p>
              </div>
              <div>
                <h5 className="font-medium text-neutral-900 mb-2">Returns & Exchanges</h5>
                <p className="text-xs">See item details for return and exchange eligibility.</p>
              </div>
              <div>
                <h5 className="font-medium text-neutral-900 mb-2">Cancellations</h5>
                <p className="text-xs">Accepted within 24 hours of purchase.</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-neutral-600 text-center">
            © {new Date().getFullYear()} Bad Scandi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
