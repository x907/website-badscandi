// Script to run the cart abandonment job locally for testing
// Usage: npx ts-node scripts/run-cart-abandonment.ts [--dry-run]

import { runCartAbandonmentJob } from "../src/jobs/cart-abandonment";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log(`Running cart abandonment job${dryRun ? " (DRY RUN)" : ""}...`);
  console.log("Current time:", new Date().toISOString());

  const result = await runCartAbandonmentJob({
    now: new Date(),
    dryRun,
  });

  console.log("\n=== Results ===");
  console.log("\nStep 1 (1-4 hours after cart update):");
  console.log(`  Sent: ${result.step1.sent}`);
  console.log(`  Skipped: ${result.step1.skipped}`);
  console.log(`  Errors: ${result.step1.errors.length}`);
  if (result.step1.errors.length > 0) {
    console.log("  Error details:", result.step1.errors);
  }

  console.log("\nStep 2 (24 hours after cart update):");
  console.log(`  Sent: ${result.step2.sent}`);
  console.log(`  Skipped: ${result.step2.skipped}`);
  console.log(`  Errors: ${result.step2.errors.length}`);
  if (result.step2.errors.length > 0) {
    console.log("  Error details:", result.step2.errors);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Job failed:", error);
    process.exit(1);
  });
