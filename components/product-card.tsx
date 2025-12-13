import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  stock: number;
}

export function ProductCard({ slug, name, description, priceCents, imageUrl, stock }: ProductCardProps) {
  // Remove duplicate name from description if it appears at the start
  const cleanDescription = description.startsWith(name)
    ? description.slice(name.length).trim()
    : description;

  // Only show description if it has meaningful content after cleaning
  const showDescription = cleanDescription.length > 0 && cleanDescription !== description;

  return (
    <Link href={`/product/${slug}`} className="block touch-manipulation">
      <Card className="group overflow-hidden hover:shadow-md active:shadow-lg active:scale-[0.98] transition-all duration-300">
        <div className="aspect-square relative overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 group-active:scale-105 transition-transform duration-500"
          />
          {stock === 0 && (
            <div className="absolute top-4 right-4 px-3 py-1 text-xs font-semibold bg-background/90 backdrop-blur-xs text-muted-foreground rounded-full shadow-md">
              SOLD
            </div>
          )}
        </div>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-base sm:text-lg font-semibold text-amber-700 dark:text-amber-400">{formatPrice(priceCents)}</p>
            {stock === 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                SOLD
              </span>
            )}
          </div>
          <h3 className="font-medium text-sm sm:text-base mb-2 text-foreground">{name}</h3>
          {showDescription && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{cleanDescription}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
