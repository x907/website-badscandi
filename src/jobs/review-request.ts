import { db } from "@/lib/db";
import { sendDripEmail, hasEmailBeenSent, TEMPLATE_KEYS } from "@/lib/email-templates";

interface ReviewRequestJobOptions {
  now: Date;
  dryRun?: boolean;
}

interface ReviewRequestJobResult {
  sent: number;
  skipped: number;
  errors: string[];
}

// Send review request 7-10 days after order completion
const MIN_DAYS = 7;
const MAX_DAYS = 10;

export async function runReviewRequestJob(
  options: ReviewRequestJobOptions
): Promise<ReviewRequestJobResult> {
  const { now, dryRun = false } = options;

  const result: ReviewRequestJobResult = {
    sent: 0,
    skipped: 0,
    errors: [],
  };

  // Calculate time window
  const minDate = new Date(now);
  minDate.setDate(minDate.getDate() - MAX_DAYS);
  const maxDate = new Date(now);
  maxDate.setDate(maxDate.getDate() - MIN_DAYS);

  // Find completed orders in the time window
  const orders = await db.order.findMany({
    where: {
      status: "completed",
      createdAt: {
        gte: minDate,
        lte: maxDate,
      },
      // Only orders with customer email
      customerEmail: {
        not: null,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          marketingConsent: true,
        },
      },
    },
  });

  for (const order of orders) {
    try {
      // Skip if user has not consented to marketing
      if (!order.user.marketingConsent) {
        result.skipped++;
        continue;
      }

      // Check if we already sent review request for this order
      const alreadySent = await hasEmailBeenSent(
        order.userId,
        TEMPLATE_KEYS.REVIEW_REQUEST,
        1,
        order.id
      );

      if (alreadySent) {
        result.skipped++;
        continue;
      }

      // Parse order items
      const orderItems = (typeof order.items === "string"
        ? JSON.parse(order.items)
        : order.items) as Array<{
        productId?: string;
        name: string;
        imageUrl: string;
      }>;

      if (orderItems.length === 0) {
        result.skipped++;
        continue;
      }

      if (!dryRun) {
        const sendResult = await sendDripEmail(
          {
            to: order.customerEmail!,
            userId: order.userId,
            templateKey: TEMPLATE_KEYS.REVIEW_REQUEST,
            step: 1,
            relatedEntityId: order.id,
          },
          {
            key: "review_request",
            data: {
              firstName: order.user.name?.split(" ")[0],
              orderId: order.id,
              items: orderItems.map((item) => ({
                name: item.name,
                imageUrl: item.imageUrl,
                productId: item.productId,
              })),
            },
          }
        );

        if (sendResult.success) {
          result.sent++;
        } else {
          result.errors.push(`Order ${order.id}: ${sendResult.error}`);
        }
      } else {
        result.sent++;
        console.log(`[DRY RUN] Would send review request to ${order.customerEmail}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      result.errors.push(`Order ${order.id}: ${errorMsg}`);
    }
  }

  return result;
}
