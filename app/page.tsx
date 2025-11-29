import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product-grid";
import { getFeaturedProducts } from "@/lib/products";
import { ArrowRight } from "lucide-react";

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div>
      <section className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Scandinavian
              <br />
              Simplicity
            </h1>
            <p className="text-xl text-neutral-600 leading-relaxed max-w-lg">
              Discover timeless furniture and home essentials designed for modern living.
              Clean lines, natural materials, and exceptional craftsmanship.
            </p>
            <div className="flex gap-4">
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
          <div className="aspect-square rounded-2xl bg-neutral-100 relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80"
              alt="Scandinavian interior"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="bg-white py-24">
          <div className="container mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
                <p className="text-neutral-600">Handpicked essentials for your space</p>
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

      <section className="container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Timeless Design</h3>
            <p className="text-neutral-600 leading-relaxed">
              Every piece is carefully crafted to stand the test of time, both in quality and style.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Sustainable</h3>
            <p className="text-neutral-600 leading-relaxed">
              We source responsibly and prioritize materials that respect both craft and environment.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Made to Last</h3>
            <p className="text-neutral-600 leading-relaxed">
              Built with exceptional craftsmanship, our products are designed for generations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
