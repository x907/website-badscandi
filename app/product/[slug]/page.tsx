import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProductBySlug } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductViewTracker } from "@/components/product-view-tracker";
import { getProductMetadata } from "@/lib/metadata";
import { ProductStructuredData, BreadcrumbStructuredData } from "@/components/structured-data";
import { ProductImageGallery } from "@/components/product-image-gallery";

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
  // Use imageUrls if available, otherwise fall back to imageUrl
  const images = product.imageUrls?.length > 0 ? product.imageUrls : [product.imageUrl];

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

      {/* Visible Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-4 w-4" />
          </li>
          <li>
            <Link href="/shop" className="hover:text-foreground transition-colors">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-4 w-4" />
          </li>
          <li aria-current="page" className="text-foreground font-medium truncate max-w-[200px]">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
        <ProductImageGallery
          images={images}
          altText={altText}
          productName={product.name}
        />

        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <p className="text-2xl sm:text-3xl font-semibold text-amber-700 dark:text-amber-400">
                {formatPrice(product.priceCents)}
              </p>
              {product.stock === 0 && (
                <span className="px-3 py-1 text-sm font-medium bg-muted text-muted-foreground rounded-full">
                  SOLD OUT
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-normal text-muted-foreground">{product.name}</h1>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>

          <div className="space-y-4 pt-4">
            {product.stock === 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 h-11 px-6 py-2 bg-muted text-muted-foreground rounded-xl">
                  <span className="font-medium">This piece has been sold</span>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Interested in a custom commission?{" "}
                  <Link href="/contact" className="text-amber-700 dark:text-amber-400 hover:underline font-medium">
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

          <div className="border-t border-border pt-6 sm:pt-8">
            <h3 className="font-semibold mb-4 text-foreground">Product Details</h3>
            <dl className="space-y-3 text-sm">
              {product.materials && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-muted-foreground">Materials</dt>
                  <dd className="font-medium text-foreground">{product.materials}</dd>
                </div>
              )}
              {product.dimensions && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-muted-foreground">Dimensions</dt>
                  <dd className="font-medium text-foreground">{product.dimensions}</dd>
                </div>
              )}
              {product.colors && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-muted-foreground">Colors</dt>
                  <dd className="font-medium text-foreground capitalize">{product.colors.split(',').join(', ')}</dd>
                </div>
              )}
              {product.category && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium text-foreground capitalize">{product.category.replace('-', ' ')}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
