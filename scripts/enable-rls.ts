// Script to enable RLS on all tables
// Run with: npx tsx scripts/enable-rls.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tables = [
  "User",
  "Passkey",
  "Verification",
  "Account",
  "Session",
  "Product",
  "Order",
  "Review",
  "Cart",
  "Event",
  "EmailSubscription",
  "EmailLog",
];

async function enableRLS() {
  console.log("Enabling RLS on all tables...\n");

  for (const table of tables) {
    try {
      // Enable RLS
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`
      );
      console.log(`✓ Enabled RLS on ${table}`);

      // Check if policy already exists
      const existingPolicy = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
        SELECT COUNT(*) as count FROM pg_policies
        WHERE tablename = '${table}'
        AND policyname = 'Allow all access to ${table}'
      `);

      if (existingPolicy[0].count === 0n) {
        // Create permissive policy
        await prisma.$executeRawUnsafe(`
          CREATE POLICY "Allow all access to ${table}" ON "${table}"
          FOR ALL
          USING (true)
          WITH CHECK (true);
        `);
        console.log(`  ✓ Created policy for ${table}`);
      } else {
        console.log(`  ⏭ Policy already exists for ${table}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        console.log(`  ⏭ Policy already exists for ${table}`);
      } else {
        console.error(`✗ Error on ${table}:`, error);
      }
    }
  }

  console.log("\nDone!");
}

enableRLS()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
