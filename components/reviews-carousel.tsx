"use client";

import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
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
  const [isPaused, setIsPaused] = useState(false);

  // Touch/swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  }, [reviews.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  }, [reviews.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsPaused(false);
      return;
    }

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    touchStartX.current = null;
    touchEndX.current = null;

    // Resume autoplay after 5 seconds
    setTimeout(() => setIsPaused(false), 5000);
  };

  useEffect(() => {
    if (reviews.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000); // Change review every 5 seconds

    return () => clearInterval(interval);
  }, [reviews.length, isPaused]);

  if (reviews.length === 0) {
    return null;
  }

  const currentReview = reviews[currentIndex];
  const hasMultipleReviews = reviews.length > 1;

  return (
    <div
      className="relative bg-neutral-50 rounded-2xl p-6 sm:p-8 md:p-12 max-w-4xl mx-auto touch-pan-y"
      onTouchStart={hasMultipleReviews ? onTouchStart : undefined}
      onTouchMove={hasMultipleReviews ? onTouchMove : undefined}
      onTouchEnd={hasMultipleReviews ? onTouchEnd : undefined}
    >
      {/* Navigation arrows for desktop/tablet */}
      {hasMultipleReviews && (
        <>
          <button
            onClick={() => {
              goToPrevious();
              setIsPaused(true);
              setTimeout(() => setIsPaused(false), 5000);
            }}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white hover:bg-neutral-100 active:bg-neutral-200 active:scale-95 rounded-full shadow-md transition-all touch-manipulation z-10"
            aria-label="Previous review"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-700" />
          </button>
          <button
            onClick={() => {
              goToNext();
              setIsPaused(true);
              setTimeout(() => setIsPaused(false), 5000);
            }}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white hover:bg-neutral-100 active:bg-neutral-200 active:scale-95 rounded-full shadow-md transition-all touch-manipulation z-10"
            aria-label="Next review"
          >
            <ChevronRight className="h-5 w-5 text-neutral-700" />
          </button>
        </>
      )}

      <div className="flex flex-col items-center text-center space-y-4 sm:space-y-6 px-8 sm:px-12">
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
          <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentReview.photos.slice(0, 2).map((photo, index) => (
              <div key={index} className="aspect-square rounded-xl overflow-hidden bg-neutral-100 relative">
                <Image
                  src={photo}
                  alt={`Customer photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        )}

        {/* Comment */}
        <p className="text-base sm:text-lg md:text-xl text-neutral-700 leading-relaxed italic max-w-2xl">
          &ldquo;{currentReview.text}&rdquo;
        </p>

        {/* Customer Info */}
        <div className="space-y-1">
          <p className="font-semibold text-neutral-900">
            {currentReview.author}
          </p>
        </div>

        {/* Dots Navigation - larger touch targets */}
        {hasMultipleReviews && (
          <div className="flex gap-2 pt-4">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsPaused(true);
                  setTimeout(() => setIsPaused(false), 5000);
                }}
                className="min-w-[24px] min-h-[24px] flex items-center justify-center touch-manipulation"
                aria-label={`Go to review ${index + 1}`}
              >
                <span
                  className={`rounded-full transition-all ${
                    index === currentIndex
                      ? "w-8 h-2.5 bg-neutral-900"
                      : "w-2.5 h-2.5 bg-neutral-300 hover:bg-neutral-400 active:bg-neutral-500"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
