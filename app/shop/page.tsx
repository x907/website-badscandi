import { ShopFilters } from "@/components/shop-filters";
import { getAllProducts } from "@/lib/products";
import { getShopMetadata } from "@/lib/metadata";

export const metadata = getShopMetadata();

export default async function ShopPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Shop Hand-Dyed Fiber Art & Wall Hangings</h1>
        <p className="text-neutral-600 text-lg">
          Explore our collection of unique boho wall hangings, macrame tapestries, and Scandinavian minimalist fiber art for your home
        </p>
      </div>

      <ShopFilters products={products} />
    </div>
  );
}
