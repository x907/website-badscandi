"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Star, Check, X, Eye } from "lucide-react";

interface Review {
  id: string;
  customerName: string;
  email: string | null;
  rating: number;
  comment: string;
  productName: string | null;
  imageUrls: string[];
  approved: boolean;
  featured: boolean;
  verified: boolean;
  createdAt: string;
}

export function AdminReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = filter === "all" ? "" : `?approved=${filter === "approved"}`;
      const response = await fetch(`/api/reviews${params}`);
      const data = await response.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}/approve`, {
        method: "PATCH",
      });
      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error("Error approving review:", error);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const handleToggleFeatured = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${id}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !currentValue }),
      });
      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error("Error updating featured status:", error);
    }
  };

  const pendingCount = reviews.filter((r) => !r.approved).length;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Review Management</h1>
          <p className="text-muted-foreground">
            Manage customer reviews and testimonials
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === "pending"
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-accent/10 text-accent rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === "approved"
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === "all"
                ? "text-accent border-b-2 border-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-card rounded-lg border border-border p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-foreground">
                        {review.customerName}
                      </h3>
                      {review.approved && (
                        <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
                          Approved
                        </span>
                      )}
                      {!review.approved && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full">
                          Pending
                        </span>
                      )}
                      {review.featured && (
                        <span className="px-2 py-0.5 text-xs bg-accent/10 text-accent rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {review.email && (
                        <span>{review.email}</span>
                      )}
                      {review.productName && (
                        <span>Product: {review.productName}</span>
                      )}
                      <span>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-accent text-accent"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <p className="text-foreground mb-4 leading-relaxed">
                  {review.comment}
                </p>

                {/* Images */}
                {review.imageUrls.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {review.imageUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Review image ${i + 1}`}
                        className="h-20 w-20 object-cover rounded border border-border"
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-border">
                  {!review.approved && (
                    <Button
                      onClick={() => handleApprove(review.id)}
                      size="sm"
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                  )}

                  {review.approved && (
                    <Button
                      onClick={() => handleToggleFeatured(review.id, review.featured)}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      {review.featured ? "Unfeature" : "Feature on Homepage"}
                    </Button>
                  )}

                  <Button
                    onClick={() => handleReject(review.id)}
                    size="sm"
                    variant="outline"
                    className="gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-700"
                  >
                    <X className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
