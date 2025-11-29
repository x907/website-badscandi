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
}

export function ProductCard({ slug, name, description, priceCents, imageUrl }: ProductCardProps) {
  return (
    <Link href={`/product/${slug}`}>
      <Card className="group overflow-hidden hover:shadow-md transition-all duration-300">
        <div className="aspect-square relative overflow-hidden bg-neutral-100">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <CardContent className="p-6">
          <h3 className="font-medium text-lg mb-2">{name}</h3>
          <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{description}</p>
          <p className="text-lg font-semibold text-amber-900">{formatPrice(priceCents)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
