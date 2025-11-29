import { db } from "./db";

export async function getFeaturedProducts() {
  return db.product.findMany({
    where: { featured: true },
    take: 3,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllProducts() {
  return db.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
  });
}

export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id },
  });
}
