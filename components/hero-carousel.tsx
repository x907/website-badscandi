"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

const S3_BASE = "https://badscandi-assets.s3.us-east-1.amazonaws.com/images";

const heroImages = [
  {
    src: `${S3_BASE}/hero-1.jpg`,
    alt: "Bad Scandi hand-dyed fiber art tapestry featuring neutral tones and organic patterns",
  },
  {
    src: `${S3_BASE}/hero-2.jpg`,
    alt: "Bad Scandi handcrafted wall hanging with Scandinavian-inspired design",
  },
  {
    src: `${S3_BASE}/hero-3.jpg`,
    alt: "Bad Scandi fiber art piece showcasing natural textures and earth tones",
  },
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch/swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  }, []);

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

    // Resume autoplay after 3 seconds
    setTimeout(() => setIsPaused(false), 3000);
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div
      className="aspect-square rounded-2xl bg-neutral-100 relative overflow-hidden touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {heroImages.map((image, index) => (
        <div
          key={image.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            className="object-cover scale-[1.01]"
            sizes="(max-width: 1024px) 100vw, 50vw"
            draggable={false}
          />
        </div>
      ))}

      {/* Dot indicators - larger touch targets for mobile */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setIsPaused(true);
              setTimeout(() => setIsPaused(false), 3000);
            }}
            className={`min-h-[24px] min-w-[24px] flex items-center justify-center rounded-full transition-all touch-manipulation ${
              index === currentIndex
                ? "bg-white/90"
                : "bg-white/40 hover:bg-white/60 active:bg-white/70"
            }`}
            aria-label={`View image ${index + 1}`}
          >
            <span
              className={`rounded-full transition-all ${
                index === currentIndex
                  ? "w-5 h-2.5 bg-white"
                  : "w-2 h-2 bg-white/80"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
