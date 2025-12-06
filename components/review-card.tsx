import Image from "next/image";
import { Star, BadgeCheck } from "lucide-react";

interface ReviewCardProps {
  author: string;
  text: string;
  photos: string[];
  verified?: boolean;
}

export function ReviewCard({ author, text, photos, verified = false }: ReviewCardProps) {
  // Only show the first (best quality) photo
  const mainPhoto = photos[0];

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Large Image */}
      {mainPhoto && (
        <div className="aspect-square relative bg-neutral-100">
          <Image
            src={mainPhoto}
            alt={`Review by ${author}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6 space-y-3">
        {/* Stars */}
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4 fill-amber-900 text-amber-900"
            />
          ))}
        </div>

        {/* Review Text */}
        <p className="text-neutral-700 leading-relaxed text-sm line-clamp-4">
          {text}
        </p>

        {/* Author & Verified Badge */}
        <div className="flex items-center gap-2 pt-2">
          <p className="text-xs text-neutral-500">
            {author}
          </p>
          {verified && (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              <BadgeCheck className="h-3 w-3" />
              Verified Purchase
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
