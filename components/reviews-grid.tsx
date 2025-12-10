"use client";

import { useState } from "react";
import { ReviewCard } from "./review-card";
import { Button } from "./ui/button";

interface Review {
  id: string;
  author: string;
  text: string;
  photos: string[];
  verified?: boolean;
}

interface ReviewsGridProps {
  reviews: Review[];
  initialLimit?: number;
}

export function ReviewsGrid({ reviews, initialLimit = 6 }: ReviewsGridProps) {
  const [showAll, setShowAll] = useState(false);
  const displayReviews = showAll ? reviews : reviews.slice(0, initialLimit);
  const hasMore = reviews.length > initialLimit;

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayReviews.map((review) => (
          <ReviewCard
            key={review.id}
            author={review.author}
            text={review.text}
            photos={review.photos}
            verified={review.verified}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="outline"
            size="lg"
          >
            {showAll
              ? "Show Less"
              : `Load More Reviews (${reviews.length - initialLimit} more)`
            }
          </Button>
        </div>
      )}
    </div>
  );
}
