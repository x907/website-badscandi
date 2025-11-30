import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/product-grid";
import { getFeaturedProducts } from "@/lib/products";
import { ArrowRight } from "lucide-react";
import { getBaseMetadata } from "@/lib/metadata";
import { OrganizationStructuredData } from "@/components/structured-data";

export const metadata = getBaseMetadata();

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div>
      <OrganizationStructuredData />
      <section className="container mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Hand-Dyed
              <br />
              Fiber Art
            </h1>
            <p className="text-xl text-neutral-600 leading-relaxed max-w-lg">
              Discover unique boho wall hangings and Scandinavian minimalist tapestries.
              Each piece is hand-dyed and handcrafted with natural materials for your modern home.
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
              src="https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=800&q=80"
              alt="Hand-dyed boho wall hanging tapestry in neutral colors"
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
                <h2 className="text-3xl font-bold mb-2">Featured Wall Hangings</h2>
                <p className="text-neutral-600">Hand-dyed fiber art for your walls</p>
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
            <h3 className="text-xl font-semibold">Hand-Dyed Artistry</h3>
            <p className="text-neutral-600 leading-relaxed">
              Each wall hanging is uniquely hand-dyed using traditional dip dye techniques. No two pieces are exactly alike.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Natural Materials</h3>
            <p className="text-neutral-600 leading-relaxed">
              We use premium cotton, wool, and linen yarns in neutral, earthy tones that complement any boho or minimalist space.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Handcrafted with Care</h3>
            <p className="text-neutral-600 leading-relaxed">
              Every fiber art piece is lovingly woven and finished by hand, bringing texture and warmth to your walls.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
