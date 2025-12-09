import { db } from "@/lib/db";

export interface Review {
  id: string;
  author: string;
  date: string | null;
  rating: number | null;
  text: string;
  photos: string[];
  verified?: boolean;
}

export async function getFeaturedReviews(): Promise<Review[]> {
  // Get featured reviews from database - limit to 3
  const dbReviews = await db.review.findMany({
    where: {
      approved: true,
      featured: true,
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      customerName: true,
      rating: true,
      comment: true,
      imageUrls: true,
      createdAt: true,
      verified: true,
    },
  });

  // Convert database reviews to match Review interface
  return dbReviews.map((review) => ({
    id: review.id,
    author: review.customerName,
    date: review.createdAt.toISOString(),
    rating: review.rating,
    text: review.comment,
    photos: review.imageUrls,
    verified: review.verified,
  }));
}

export async function getAllReviews(): Promise<Review[]> {
  // Get all approved reviews from database, featured first
  const dbReviews = await db.review.findMany({
    where: {
      approved: true,
    },
    orderBy: [
      { featured: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      id: true,
      customerName: true,
      rating: true,
      comment: true,
      imageUrls: true,
      createdAt: true,
      verified: true,
    },
  });

  // Convert database reviews to match Review interface
  return dbReviews.map((review) => ({
    id: review.id,
    author: review.customerName,
    date: review.createdAt.toISOString(),
    rating: review.rating,
    text: review.comment,
    photos: review.imageUrls,
    verified: review.verified,
  }));
}
