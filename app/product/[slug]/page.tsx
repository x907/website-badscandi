import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { CheckoutButton } from "@/components/checkout-button";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { getProductMetadata } from "@/lib/metadata";
import { ProductStructuredData, BreadcrumbStructuredData } from "@/components/structured-data";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {};
  }

  return getProductMetadata(product);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const session = await auth();
  const altText = product.altText || product.name;

  return (
    <div className="container mx-auto px-6 py-12">
      <ProductViewTracker product={product} />
      <ProductStructuredData product={product} />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: "https://badscandi.com" },
          { name: "Shop", url: "https://badscandi.com/shop" },
          { name: product.name, url: `https://badscandi.com/product/${product.slug}` },
        ]}
      />
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="aspect-square relative rounded-2xl overflow-hidden bg-neutral-100">
          <Image
            src={product.imageUrl}
            alt={altText}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <p className="text-3xl font-semibold text-amber-900">
              {formatPrice(product.priceCents)}
            </p>
          </div>

          <div className="prose prose-neutral">
            <p className="text-neutral-600 leading-relaxed">{product.description}</p>
          </div>

          <div className="space-y-4 pt-4">
            {session?.user ? (
              <CheckoutButton
                productId={product.id}
                productName={product.name}
                productPrice={product.priceCents}
              />
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-neutral-600">
                  Please sign in to purchase this product
                </p>
                <a
                  href="/auth/signin"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors h-11 px-6 py-2 bg-neutral-900 text-neutral-50 shadow hover:bg-neutral-900/90 w-full"
                >
                  Sign In to Purchase
                </a>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-100 pt-8">
            <h3 className="font-semibold mb-4">Product Details</h3>
            <dl className="space-y-3 text-sm">
              {product.materials && (
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Materials</dt>
                  <dd className="font-medium">{product.materials}</dd>
                </div>
              )}
              {product.dimensions && (
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Dimensions</dt>
                  <dd className="font-medium">{product.dimensions}</dd>
                </div>
              )}
              {product.colors && (
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Colors</dt>
                  <dd className="font-medium capitalize">{product.colors.split(',').join(', ')}</dd>
                </div>
              )}
              {product.category && (
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Category</dt>
                  <dd className="font-medium capitalize">{product.category.replace('-', ' ')}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-neutral-600">Shipping</dt>
                <dd className="font-medium">Free Worldwide</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
