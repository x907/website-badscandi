import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product-grid";
import { getFeaturedProducts } from "@/lib/products";
import { getAllReviews } from "@/lib/reviews";
import { ReviewsGrid } from "@/components/reviews-grid";
import { ArrowRight, Instagram, Facebook, Youtube } from "lucide-react";
import { getBaseMetadata } from "@/lib/metadata";
import { OrganizationStructuredData } from "@/components/structured-data";
import { HeroCarousel } from "@/components/hero-carousel";

export const metadata = getBaseMetadata();

export default async function HomePage() {
  const [featuredProducts, allReviews] = await Promise.all([
    getFeaturedProducts(),
    getAllReviews(),
  ]);

  return (
    <div>
      <OrganizationStructuredData />
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Hand-Dyed
              <br />
              Fiber Art
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              Welcome to Bad Scandi. Original hand-dyed fiber art wall hangings inspired by Scandinavian design.
            </p>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Be sure to follow along{" "}
                <a
                  href="https://www.instagram.com/badscandi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                >
                  @badscandi
                </a>
              </p>
              <div className="flex gap-4 items-center">
                <a
                  href="https://www.instagram.com/badscandi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-6 w-6" />
                </a>
                <a
                  href="https://www.tiktok.com/@badscandi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
                <a
                  href="https://www.pinterest.com/badscandi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Pinterest"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/badscandi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-6 w-6" />
                </a>
                <a
                  href="https://www.youtube.com/@badscandi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-6 w-6" />
                </a>
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <Link href="/shop">
                <Button size="lg" className="gap-2">
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
          <HeroCarousel />
        </div>
      </section>

      {/* As Featured In Section */}
      <section className="bg-card py-8 sm:py-12 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-muted-foreground mb-6">As Featured In</p>
          <div className="flex justify-center items-center">
            <a
              href="https://midwestdesignmag.com/interior-spaces/scandinavian-style-tapestries-by-bad-scandi-pay-homage-to-heritage/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 hover:text-foreground transition-colors"
            >
              <span className="text-lg font-semibold tracking-wide">Midwest Design Magazine</span>
            </a>
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="bg-card py-12 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">Featured Wall Hangings</h2>
                <p className="text-muted-foreground">Hand-dyed fiber art for your walls</p>
              </div>
              <Link href="/shop">
                <Button variant="ghost" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <ProductGrid products={featuredProducts} />
          </div>
        </section>
      )}

      {/* The Dip-Dyeing Process Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8 mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">The Dip-Dyeing Process</h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Each tapestry is handcrafted using a unique dip-dyeing technique that
            incorporates traditional painting methods. Hundreds of wool strands are
            carefully measured, cut, and hand-dyed over several weeks to create
            organic patterns that inspire calmness and peace.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Hand-Dyed Artistry</h3>
            <p className="text-muted-foreground leading-relaxed">
              Each wall hanging is uniquely hand-dyed using traditional dip dye techniques. No two pieces are exactly alike.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Natural Materials</h3>
            <p className="text-muted-foreground leading-relaxed">
              Premium wool yarns in neutral, earthy tones that complement any boho or minimalist space.
            </p>
          </div>
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <h3 className="text-lg sm:text-xl font-semibold text-foreground">Handcrafted with Care</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every fiber art piece is lovingly created and finished by hand, bringing texture and warmth to your walls.
            </p>
          </div>
        </div>
      </section>

      {allReviews.length > 0 && (
        <section className="bg-muted py-12 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">What Our Customers Say</h2>
              <p className="text-muted-foreground">Real reviews from real customers</p>
            </div>
            <ReviewsGrid reviews={allReviews} initialLimit={3} />
          </div>
        </section>
      )}
    </div>
  );
}
