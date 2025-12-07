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
          <h1 className="text-3xl font-bold mb-2">Review Management</h1>
          <p className="text-neutral-600">
            Manage customer reviews and testimonials
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-neutral-200">
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === "pending"
                ? "text-amber-900 border-b-2 border-amber-900"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-900 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === "approved"
                ? "text-amber-900 border-b-2 border-amber-900"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === "all"
                ? "text-amber-900 border-b-2 border-amber-900"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            All
          </button>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="text-center py-12 text-neutral-600">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-600">No reviews found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg border border-neutral-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {review.customerName}
                      </h3>
                      {review.approved && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                          Approved
                        </span>
                      )}
                      {!review.approved && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                          Pending
                        </span>
                      )}
                      {review.featured && (
                        <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-900 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-600">
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
                            ? "fill-amber-900 text-amber-900"
                            : "text-neutral-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <p className="text-neutral-700 mb-4 leading-relaxed">
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
                        className="h-20 w-20 object-cover rounded border border-neutral-200"
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-neutral-100">
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
                    className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
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
