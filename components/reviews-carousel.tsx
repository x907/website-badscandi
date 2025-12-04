"use client";

import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";

type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  photos: string[];
};

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (reviews.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000); // Change review every 5 seconds

    return () => clearInterval(interval);
  }, [reviews.length]);

  if (reviews.length === 0) {
    return null;
  }

  const currentReview = reviews[currentIndex];

  return (
    <div className="relative bg-neutral-50 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
      <div className="flex flex-col items-center text-center space-y-6">
        {/* Stars - Always 5 stars */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className="h-5 w-5 fill-amber-900 text-amber-900"
            />
          ))}
        </div>

        {/* Review Images (if exists) */}
        {currentReview.photos.length > 0 && (
          <div className="w-full max-w-2xl grid grid-cols-2 gap-3">
            {currentReview.photos.slice(0, 2).map((photo, index) => (
              <div key={index} className="aspect-square rounded-xl overflow-hidden bg-neutral-100 relative">
                <Image
                  src={photo}
                  alt={`Customer photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Comment */}
        <p className="text-lg md:text-xl text-neutral-700 leading-relaxed italic max-w-2xl">
          "{currentReview.text}"
        </p>

        {/* Customer Info */}
        <div className="space-y-1">
          <p className="font-semibold text-neutral-900">
            {currentReview.author}
          </p>
        </div>

        {/* Dots Navigation */}
        {reviews.length > 1 && (
          <div className="flex gap-2 pt-4">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-neutral-900"
                    : "w-2 bg-neutral-300 hover:bg-neutral-400"
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
