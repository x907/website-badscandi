import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Use PrismaClient as the type - extended clients are compatible at runtime
// Using a union type loses method overloads like interactive $transaction
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prepares the connection string for Supabase
 * Ensures sslmode=no-verify is set for certificate compatibility
 */
function prepareConnectionString(url: string): string {
  let connectionString = url;

  // Replace sslmode=require with sslmode=no-verify if present
  // This is required because Supabase uses certificates that aren't in the default trust store
  if (connectionString.includes("sslmode=require")) {
    connectionString = connectionString.replace("sslmode=require", "sslmode=no-verify");
  } else if (!connectionString.includes("sslmode=")) {
    // Add sslmode=no-verify if not present
    connectionString += connectionString.includes("?") ? "&sslmode=no-verify" : "?sslmode=no-verify";
  }

  return connectionString;
}

/**
 * Slow query threshold in milliseconds
 * Queries taking longer than this will be logged in development
 */
const SLOW_QUERY_THRESHOLD_MS = 100;

function createBaseClient() {
  const connectionString = prepareConnectionString(process.env.DATABASE_URL || "");

  // Connection pool configuration optimized for Supabase + Vercel serverless
  // These settings help prevent connection exhaustion and handle cold starts gracefully
  const adapter = new PrismaPg({
    connectionString,
    // Maximum number of connections in the pool
    // Supabase free tier allows ~20 connections, paid tiers allow more
    // Keep this conservative for serverless where many instances may run concurrently
    max: 5,
    // Close idle connections after 30 seconds
    // Helps free up connections in serverless environments between invocations
    idleTimeoutMillis: 30000,
    // Fail fast if unable to acquire a connection within 10 seconds
    // Prevents requests from hanging indefinitely on connection issues
    connectionTimeoutMillis: 10000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/**
 * Creates a client with slow query logging extension for development
 */
function createExtendedClient() {
  const baseClient = createBaseClient();

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = performance.now();
          const result = await query(args);
          const duration = performance.now() - start;

          if (duration > SLOW_QUERY_THRESHOLD_MS) {
            // Safely access where clause if it exists
            const whereClause = args && typeof args === 'object' && 'where' in args
              ? ` where: ${JSON.stringify(args.where)}`
              : '';
            console.warn(`🐢 Slow query: ${model}.${operation} took ${duration.toFixed(2)}ms${whereClause}`);
          }

          return result;
        },
      },
    },
  });
}

function createPrismaClient(): PrismaClient {
  // In development, add slow query logging extension
  // This helps identify performance issues during development
  if (process.env.NODE_ENV === "development") {
    // Extended client is compatible with PrismaClient at runtime
    return createExtendedClient() as unknown as PrismaClient;
  }

  return createBaseClient();
}

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
