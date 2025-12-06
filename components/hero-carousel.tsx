"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="aspect-square rounded-2xl bg-neutral-100 relative overflow-hidden">
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
          />
        </div>
      ))}

      {/* Subtle dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? "w-6 bg-white/90"
                : "w-2 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`View image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
