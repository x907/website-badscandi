import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Modify connection string to use sslmode=no-verify for Supabase
  // This is required because Supabase uses certificates that aren't in the default trust store
  let connectionString = process.env.DATABASE_URL || "";

  // Replace sslmode=require with sslmode=no-verify if present
  if (connectionString.includes("sslmode=require")) {
    connectionString = connectionString.replace("sslmode=require", "sslmode=no-verify");
  } else if (!connectionString.includes("sslmode=")) {
    // Add sslmode=no-verify if not present
    connectionString += connectionString.includes("?") ? "&sslmode=no-verify" : "?sslmode=no-verify";
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
