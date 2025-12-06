import { db } from "@/lib/db";
import { sendDripEmail, hasEmailBeenSent, TEMPLATE_KEYS } from "@/lib/email-templates";

interface WinbackJobOptions {
  now: Date;
  dryRun?: boolean;
}

interface WinbackJobResult {
  step1: { sent: number; skipped: number; errors: string[] };
  step2: { sent: number; skipped: number; errors: string[] };
}

// Step 1: 30 days after last order (or 30 days since signup if no orders)
const STEP_1_DAYS = 30;
const STEP_1_WINDOW_DAYS = 3; // Send within 3-day window

// Step 2: 60 days after last activity
const STEP_2_DAYS = 60;
const STEP_2_WINDOW_DAYS = 3;

export async function runWinbackJob(options: WinbackJobOptions): Promise<WinbackJobResult> {
  const { now, dryRun = false } = options;

  const result: WinbackJobResult = {
    step1: { sent: 0, skipped: 0, errors: [] },
    step2: { sent: 0, skipped: 0, errors: [] },
  };

  // Calculate time windows
  const step1MinDate = new Date(now);
  step1MinDate.setDate(step1MinDate.getDate() - STEP_1_DAYS - STEP_1_WINDOW_DAYS);
  const step1MaxDate = new Date(now);
  step1MaxDate.setDate(step1MaxDate.getDate() - STEP_1_DAYS);

  const step2MinDate = new Date(now);
  step2MinDate.setDate(step2MinDate.getDate() - STEP_2_DAYS - STEP_2_WINDOW_DAYS);
  const step2MaxDate = new Date(now);
  step2MaxDate.setDate(step2MaxDate.getDate() - STEP_2_DAYS);

  // Step 1: Users whose last order was 30 days ago
  // or users who signed up 30 days ago with no orders
  const step1Candidates = await db.user.findMany({
    where: {
      marketingConsent: true,
      OR: [
        // Users with last order 30 days ago
        {
          orders: {
            some: {},
          },
        },
        // Users who signed up 30 days ago with no orders
        {
          orders: {
            none: {},
          },
          createdAt: {
            gte: step1MinDate,
            lte: step1MaxDate,
          },
        },
      ],
    },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  // Filter to users whose last order was in the step 1 window
  const step1Eligible = step1Candidates.filter((user) => {
    if (user.orders.length > 0) {
      const lastOrder = user.orders[0];
      return lastOrder.createdAt >= step1MinDate && lastOrder.createdAt <= step1MaxDate;
    }
    // No orders - already filtered by createdAt in query
    return true;
  });

  // Process Step 1 candidates
  for (const user of step1Eligible) {
    try {
      // Check if we already sent step 1
      const alreadySent = await hasEmailBeenSent(user.id, TEMPLATE_KEYS.WINBACK_STEP_1, 1);

      if (alreadySent) {
        result.step1.skipped++;
        continue;
      }

      const daysSinceLastOrder = user.orders.length > 0
        ? Math.floor(
            (now.getTime() - user.orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : undefined;

      if (!dryRun) {
        const sendResult = await sendDripEmail(
          {
            to: user.email,
            userId: user.id,
            templateKey: TEMPLATE_KEYS.WINBACK_STEP_1,
            step: 1,
          },
          {
            key: "winback_step_1",
            data: {
              firstName: user.name?.split(" ")[0],
              daysSinceLastOrder,
            },
          }
        );

        if (sendResult.success) {
          result.step1.sent++;
        } else {
          result.step1.errors.push(`User ${user.id}: ${sendResult.error}`);
        }
      } else {
        result.step1.sent++;
        console.log(`[DRY RUN] Would send winback step 1 to ${user.email}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      result.step1.errors.push(`User ${user.id}: ${errorMsg}`);
    }
  }

  // Step 2: Users who received step 1 but still inactive after 60 days total
  const step2Candidates = await db.user.findMany({
    where: {
      marketingConsent: true,
      // Must have received step 1
      emailLogs: {
        some: {
          templateKey: TEMPLATE_KEYS.WINBACK_STEP_1,
          step: 1,
        },
      },
    },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      emailLogs: {
        where: {
          templateKey: TEMPLATE_KEYS.WINBACK_STEP_1,
          step: 1,
        },
        orderBy: { sentAt: "desc" },
        take: 1,
      },
    },
  });

  // Filter to users in the step 2 window
  const step2Eligible = step2Candidates.filter((user) => {
    // Check if their last activity (order or signup) was 60 days ago
    const lastActivityDate =
      user.orders.length > 0 ? user.orders[0].createdAt : user.createdAt;
    return lastActivityDate >= step2MinDate && lastActivityDate <= step2MaxDate;
  });

  // Process Step 2 candidates
  for (const user of step2Eligible) {
    try {
      // Check if they've placed an order since step 1 was sent
      const step1SentAt = user.emailLogs[0]?.sentAt;
      if (step1SentAt && user.orders.length > 0) {
        const lastOrderDate = user.orders[0].createdAt;
        if (lastOrderDate > step1SentAt) {
          // User converted - skip step 2
          result.step2.skipped++;
          continue;
        }
      }

      // Check if we already sent step 2
      const alreadySent = await hasEmailBeenSent(user.id, TEMPLATE_KEYS.WINBACK_STEP_2, 2);

      if (alreadySent) {
        result.step2.skipped++;
        continue;
      }

      const daysSinceLastOrder = user.orders.length > 0
        ? Math.floor(
            (now.getTime() - user.orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : undefined;

      if (!dryRun) {
        const sendResult = await sendDripEmail(
          {
            to: user.email,
            userId: user.id,
            templateKey: TEMPLATE_KEYS.WINBACK_STEP_2,
            step: 2,
          },
          {
            key: "winback_step_2",
            data: {
              firstName: user.name?.split(" ")[0],
              daysSinceLastOrder,
            },
          }
        );

        if (sendResult.success) {
          result.step2.sent++;
        } else {
          result.step2.errors.push(`User ${user.id}: ${sendResult.error}`);
        }
      } else {
        result.step2.sent++;
        console.log(`[DRY RUN] Would send winback step 2 to ${user.email}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      result.step2.errors.push(`User ${user.id}: ${errorMsg}`);
    }
  }

  return result;
}
