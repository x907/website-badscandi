import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  // Use DIRECT_URL for migrations (non-pooled connection required for DDL)
  // Falls back to DATABASE_URL if DIRECT_URL not set
  // Note: Using process.env instead of Prisma's env() to allow graceful fallback
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
})
