"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
  altText: string;
  productName: string;
}

export function ProductImageGallery({ images, altText, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square relative rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100 group">
        <Image
          src={currentImage}
          alt={altText || productName}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {/* Navigation Arrows (only show if multiple images) */}
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-neutral-700" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-neutral-700" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 text-white text-sm rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip (only show if multiple images) */}
      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={image}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
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
