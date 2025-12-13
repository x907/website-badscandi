import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx prisma/seed.ts',
  },
  // Use DIRECT_URL for migrations (non-pooled connection required for DDL)
  // Falls back to DATABASE_URL if DIRECT_URL not set
  datasource: {
    url: env('DIRECT_URL') ?? env('DATABASE_URL'),
  },
})
