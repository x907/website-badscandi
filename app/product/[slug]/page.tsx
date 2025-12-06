import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProductBySlug } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { getProductMetadata } from "@/lib/metadata";
import { ProductStructuredData, BreadcrumbStructuredData } from "@/components/structured-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://badscandi.com";

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

  const altText = product.altText || product.name;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <ProductViewTracker product={product} />
      <ProductStructuredData product={product} />
      <BreadcrumbStructuredData
        items={[
          { name: "Home", url: siteUrl },
          { name: "Shop", url: `${siteUrl}/shop` },
          { name: product.name, url: `${siteUrl}/product/${product.slug}` },
        ]}
      />
      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        <div className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100">
          <Image
            src={product.imageUrl}
            alt={altText}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-2xl sm:text-3xl font-semibold text-amber-900">
                {formatPrice(product.priceCents)}
              </p>
              {product.stock === 0 && (
                <span className="px-3 py-1 text-sm font-medium bg-neutral-100 text-neutral-600 rounded-full">
                  SOLD OUT
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-normal text-neutral-600">{product.name}</h1>
          </div>

          <div className="prose prose-neutral max-w-none">
            <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>

          <div className="space-y-4 pt-4">
            {product.stock === 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 h-11 px-6 py-2 bg-neutral-100 text-neutral-500 rounded-xl">
                  <span className="font-medium">This piece has been sold</span>
                </div>
                <p className="text-sm text-neutral-600 text-center">
                  Interested in a custom commission?{" "}
                  <Link href="/contact" className="text-amber-900 hover:underline font-medium">
                    Visit our contact page
                  </Link>
                </p>
              </div>
            ) : (
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  priceCents: product.priceCents,
                  imageUrl: product.imageUrl,
                  stock: product.stock,
                }}
              />
            )}
          </div>

          <div className="border-t border-neutral-100 pt-6 sm:pt-8">
            <h3 className="font-semibold mb-4">Product Details</h3>
            <dl className="space-y-3 text-sm">
              {product.materials && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-neutral-600">Materials</dt>
                  <dd className="font-medium">{product.materials}</dd>
                </div>
              )}
              {product.dimensions && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-neutral-600">Dimensions</dt>
                  <dd className="font-medium">{product.dimensions}</dd>
                </div>
              )}
              {product.colors && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-neutral-600">Colors</dt>
                  <dd className="font-medium capitalize">{product.colors.split(',').join(', ')}</dd>
                </div>
              )}
              {product.category && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-neutral-600">Category</dt>
                  <dd className="font-medium capitalize">{product.category.replace('-', ' ')}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
