"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Star } from "lucide-react";

interface ReviewSubmissionFormProps {
  preSelectedProductId?: string;
}

export function ReviewSubmissionForm({ preSelectedProductId }: ReviewSubmissionFormProps) {
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    rating: 5,
    comment: "",
    productName: "",
    productId: preSelectedProductId || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Fetch product details if pre-selected
  useEffect(() => {
    if (preSelectedProductId) {
      setFormData((prev) => ({ ...prev, productId: preSelectedProductId }));
      fetch(`/api/products/${preSelectedProductId}`)
        .then((res) => res.json())
        .then((product) => {
          if (product?.name) {
            setFormData((prev) => ({ ...prev, productName: product.name }));
          }
        })
        .catch((error) => {
          console.error("Error fetching product:", error);
        });
    }
  }, [preSelectedProductId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customerName.trim()) {
      setSubmitStatus({ type: "error", message: "Please enter your name" });
      return;
    }
    if (!formData.comment.trim()) {
      setSubmitStatus({ type: "error", message: "Please write a review" });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("customerName", formData.customerName);
      submitData.append("email", formData.email);
      submitData.append("rating", formData.rating.toString());
      submitData.append("comment", formData.comment);
      submitData.append("productName", formData.productName);
      submitData.append("productId", formData.productId);

      const response = await fetch("/api/reviews", {
        method: "POST",
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit review");
      }

      setSubmitStatus({
        type: "success",
        message: "Thank you! Your review has been submitted and is pending approval.",
      });

      // Reset form
      setFormData({
        customerName: "",
        email: "",
        rating: 5,
        comment: "",
        productName: "",
        productId: preSelectedProductId || "",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit review. Please try again.";
      setSubmitStatus({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
      <div>
        <label
          htmlFor="customerName"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Your Name <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <input
          type="text"
          id="customerName"
          name="customerName"
          value={formData.customerName}
          onChange={handleInputChange}
          required
          autoComplete="name"
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-400 focus:border-transparent outline-none bg-background text-foreground"
          placeholder="Enter your name"
        />
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Email <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          autoComplete="email"
          inputMode="email"
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-400 focus:border-transparent outline-none bg-background text-foreground"
          placeholder="your@email.com"
        />
        <p className="mt-1 text-sm text-muted-foreground">
          We'll only use this for follow-up if needed
        </p>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Rating <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingClick(star)}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center transition-transform hover:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= formData.rating
                    ? "fill-amber-600 dark:fill-amber-400 text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Product Name */}
      <div>
        <label
          htmlFor="productName"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Product Purchased <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          type="text"
          id="productName"
          name="productName"
          value={formData.productName}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-400 focus:border-transparent outline-none bg-background text-foreground"
          placeholder="e.g., Cream Wave Wall Hanging"
        />
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-foreground mb-2"
        >
          Your Review <span className="text-red-500 dark:text-red-400">*</span>
        </label>
        <textarea
          id="comment"
          name="comment"
          value={formData.comment}
          onChange={handleInputChange}
          required
          rows={5}
          maxLength={1000}
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-400 focus:border-transparent outline-none resize-none bg-background text-foreground"
          placeholder="Tell us about your experience with your Bad Scandi piece..."
        />
        <p className="mt-1 text-sm text-muted-foreground text-right">
          {formData.comment.length}/1000 characters
        </p>
      </div>

      {/* Status Message */}
      {submitStatus.type && (
        <div
          className={`p-4 rounded-lg ${
            submitStatus.type === "success"
              ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
          }`}
        >
          {submitStatus.message}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
