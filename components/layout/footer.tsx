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
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>
                <Link href="/shop" className="hover:text-amber-900 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/shop?featured=true" className="hover:text-amber-900 transition-colors">
                  Featured
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3 sm:mb-4 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>
                <Link href="/about" className="hover:text-amber-900 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-900 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-3 sm:mb-4 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>
                <Link href="/privacy" className="hover:text-amber-900 transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-900 transition-colors">
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
