import { ProductGrid } from "@/components/product-grid";
import { getAllProducts } from "@/lib/products";

export default async function ShopPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Shop All</h1>
        <p className="text-neutral-600 text-lg">
          Explore our full collection of Scandinavian furniture and home essentials
        </p>
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
