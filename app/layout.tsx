import type { Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { PinterestTag } from "@/components/analytics/pinterest-tag";
import { CartProvider } from "@/contexts/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CookieConsent } from "@/components/cookie-consent";
import { getBaseMetadata } from "@/lib/metadata";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata = getBaseMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <CartProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:text-amber-900 focus:font-medium"
          >
            Skip to main content
          </a>
          <GoogleAnalytics />
          <MetaPixel />
          <PinterestTag />
          <Header />
          <main id="main-content" className="flex-grow">{children}</main>
          <Footer />
          <CartDrawer />
          <CookieConsent />
        </CartProvider>
      </body>
    </html>
  );
}
