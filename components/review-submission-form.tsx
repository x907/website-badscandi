"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Star, Upload, X } from "lucide-react";

interface ReviewSubmissionFormProps {
  preSelectedProductId?: string;
}

// Component that safely renders a File as an image preview
// URLs are created and managed internally, never exposed to parent
function FilePreviewImage({ file, onRemove }: { file: File; onRemove: () => void }) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Create blob URL internally - never exposed outside this component
    const url = URL.createObjectURL(file);

    // Set src directly on the DOM element to avoid React data flow
    if (imgRef.current) {
      imgRef.current.src = url;
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200">
      <img
        ref={imgRef}
        alt="Preview"
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 p-2 min-w-[44px] min-h-[44px] bg-white rounded-full shadow-lg hover:bg-neutral-100 transition-colors flex items-center justify-center"
      >
        <X className="h-4 w-4 text-neutral-600" />
      </button>
    </div>
  );
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      setSubmitStatus({
        type: "error",
        message: "Only image files are allowed",
      });
      return;
    }

    // Limit to 3 photos
    const totalFiles = selectedFiles.length + imageFiles.length;
    if (totalFiles > 3) {
      setSubmitStatus({
        type: "error",
        message: "Maximum 3 photos allowed",
      });
      return;
    }

    setSelectedFiles((prev) => [...prev, ...imageFiles]);
    setSubmitStatus({ type: null, message: "" });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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

      selectedFiles.forEach((file) => {
        submitData.append("photos", file);
      });

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
      setSelectedFiles([]);
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
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          Your Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="customerName"
          name="customerName"
          value={formData.customerName}
          onChange={handleInputChange}
          required
          autoComplete="name"
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-900 focus:border-transparent outline-none"
          placeholder="Enter your name"
        />
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          Email <span className="text-neutral-400">(optional)</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          autoComplete="email"
          inputMode="email"
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-900 focus:border-transparent outline-none"
          placeholder="your@email.com"
        />
        <p className="mt-1 text-sm text-neutral-500">
          We'll only use this for follow-up if needed
        </p>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Rating <span className="text-red-500">*</span>
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
                    ? "fill-amber-900 text-amber-900"
                    : "text-neutral-300"
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
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          Product Purchased <span className="text-neutral-400">(optional)</span>
        </label>
        <input
          type="text"
          id="productName"
          name="productName"
          value={formData.productName}
          onChange={handleInputChange}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-900 focus:border-transparent outline-none"
          placeholder="e.g., Cream Wave Wall Hanging"
        />
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="comment"
          name="comment"
          value={formData.comment}
          onChange={handleInputChange}
          required
          rows={5}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-amber-900 focus:border-transparent outline-none resize-none"
          placeholder="Tell us about your experience with your Bad Scandi piece..."
        />
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Photos <span className="text-neutral-400">(optional, max 3)</span>
        </label>
        <div className="space-y-3">
          {/* File Input */}
          <div className="relative">
            <input
              type="file"
              id="photos"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              disabled={selectedFiles.length >= 3}
            />
            <label
              htmlFor="photos"
              className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                selectedFiles.length >= 3
                  ? "border-neutral-200 bg-neutral-50 cursor-not-allowed"
                  : "border-neutral-300 hover:border-amber-900 hover:bg-amber-50"
              }`}
            >
              <Upload className="h-5 w-5 text-neutral-600" />
              <span className="text-sm text-neutral-600">
                {selectedFiles.length >= 3
                  ? "Maximum photos selected"
                  : "Choose photos"}
              </span>
            </label>
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {selectedFiles.map((file, index) => (
                <FilePreviewImage
                  key={`${file.name}-${file.size}-${index}`}
                  file={file}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {submitStatus.type && (
        <div
          className={`p-4 rounded-lg ${
            submitStatus.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
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
