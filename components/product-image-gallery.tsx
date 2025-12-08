"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  altText: string;
  productName: string;
}

export function ProductImageGallery({ images, altText, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Touch/swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

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
  };

  // If no images, show placeholder
  if (images.length === 0) {
    return (
      <div className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100 flex items-center justify-center">
        <span className="text-neutral-400">No image available</span>
      </div>
    );
  }

  const currentImage = images[selectedIndex];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100 group touch-pan-y"
        onTouchStart={hasMultipleImages ? onTouchStart : undefined}
        onTouchMove={hasMultipleImages ? onTouchMove : undefined}
        onTouchEnd={hasMultipleImages ? onTouchEnd : undefined}
      >
        <Image
          src={currentImage}
          alt={altText || productName}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          draggable={false}
        />

        {/* Navigation Arrows - always visible on mobile, hover on desktop */}
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/90 sm:bg-white/80 hover:bg-white active:bg-white active:scale-95 rounded-full shadow-md sm:opacity-0 sm:group-hover:opacity-100 transition-all touch-manipulation"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6 text-neutral-700" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/90 sm:bg-white/80 hover:bg-white active:bg-white active:scale-95 rounded-full shadow-md sm:opacity-0 sm:group-hover:opacity-100 transition-all touch-manipulation"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6 text-neutral-700" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 text-white text-sm font-medium rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>

            {/* Dot indicators for mobile */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 sm:hidden">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`min-w-[12px] min-h-[12px] rounded-full transition-all touch-manipulation ${
                    index === selectedIndex
                      ? "w-6 bg-white"
                      : "w-3 bg-white/50 active:bg-white/70"
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip (only show if multiple images) - hidden on mobile, shown on tablet+ */}
      {hasMultipleImages && (
        <div className="hidden sm:flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={image}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all touch-manipulation ${
                index === selectedIndex
                  ? "border-amber-500 ring-2 ring-amber-500/20"
                  : "border-transparent hover:border-neutral-300"
              }`}
            >
              <Image
                src={image}
                alt={`${productName} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
