import { ReviewCard } from "./review-card";
import reviewsData from "@/data/reviews.json";

interface Review {
  id: string;
  author: string;
  date: string | null;
  rating: number | null;
  text: string;
  photos: string[];
}

export function ReviewsSection() {
  const reviews = reviewsData as Review[];

  return (
    <section className="py-10 sm:py-16 bg-neutral-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Customer Reviews</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              See what our customers are saying about their Bad Scandi pieces
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {reviews.map((review, index) => (
              <ReviewCard
                key={review.id || index}
                author={review.author}
                text={review.text}
                photos={review.photos}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
