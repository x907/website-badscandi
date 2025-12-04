import reviewsData from "@/data/reviews.json";
import { prisma } from "@/lib/prisma";

export interface Review {
  id: string;
  author: string;
  date: string | null;
  rating: number | null;
  text: string;
  photos: string[];
}

export async function getFeaturedReviews(): Promise<Review[]> {
  // Get reviews from JSON file (existing Etsy reviews)
  const jsonReviews = reviewsData.map((review, index) => ({
    ...review,
    id: review.id || `review-${index}`,
    rating: 5, // All reviews are 5 stars
  })) as Review[];

  // Get featured reviews from database (customer-submitted reviews)
  const dbReviews = await prisma.review.findMany({
    where: {
      approved: true,
      featured: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerName: true,
      rating: true,
      comment: true,
      imageUrls: true,
      createdAt: true,
    },
  });

  // Convert database reviews to match Review interface
  const convertedDbReviews: Review[] = dbReviews.map((review) => ({
    id: review.id,
    author: review.customerName,
    date: review.createdAt.toISOString(),
    rating: review.rating,
    text: review.comment,
    photos: review.imageUrls,
  }));

  // Combine both sources, with database reviews first
  return [...convertedDbReviews, ...jsonReviews];
}

export async function getAllReviews(): Promise<Review[]> {
  // Get all reviews from JSON file
  const jsonReviews = reviewsData.map((review, index) => ({
    ...review,
    id: review.id || `review-${index}`,
    rating: 5,
  })) as Review[];

  // Get all approved reviews from database
  const dbReviews = await prisma.review.findMany({
    where: {
      approved: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerName: true,
      rating: true,
      comment: true,
      imageUrls: true,
      createdAt: true,
    },
  });

  // Convert database reviews to match Review interface
  const convertedDbReviews: Review[] = dbReviews.map((review) => ({
    id: review.id,
    author: review.customerName,
    date: review.createdAt.toISOString(),
    rating: review.rating,
    text: review.comment,
    photos: review.imageUrls,
  }));

  // Combine both sources
  return [...convertedDbReviews, ...jsonReviews];
}
