import { db } from "./db";

// Public queries - filter out hidden products
export async function getFeaturedProducts() {
  return db.product.findMany({
    where: { featured: true, hidden: false },
    take: 3,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllProducts() {
  return db.product.findMany({
    where: { hidden: false },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug, hidden: false },
  });
}

export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id },
  });
}

// Admin queries - include hidden products
export async function getAllProductsAdmin() {
  return db.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlugAdmin(slug: string) {
  return db.product.findUnique({
    where: { slug },
  });
}
