import { db } from "@/lib/db";
import {
  sendDripEmail,
  hasEmailBeenSent,
  TEMPLATE_KEYS,
  CartItem,
} from "@/lib/email-templates";

interface CartAbandonmentJobOptions {
  now: Date;
  dryRun?: boolean; // If true, don't actually send emails
}

interface CartAbandonmentJobResult {
  step1: { sent: number; skipped: number; errors: string[] };
  step2: { sent: number; skipped: number; errors: string[] };
}

// Step 1 timing: 1-4 hours after cart update
const STEP_1_MIN_HOURS = 1;
const STEP_1_MAX_HOURS = 4;

// Step 2 timing: 24-28 hours after cart update
const STEP_2_MIN_HOURS = 24;
const STEP_2_MAX_HOURS = 28;

export async function runCartAbandonmentJob(
  options: CartAbandonmentJobOptions
): Promise<CartAbandonmentJobResult> {
  const { now, dryRun = false } = options;

  const result: CartAbandonmentJobResult = {
    step1: { sent: 0, skipped: 0, errors: [] },
    step2: { sent: 0, skipped: 0, errors: [] },
  };

  // Calculate time windows
  const step1MinTime = new Date(now.getTime() - STEP_1_MAX_HOURS * 60 * 60 * 1000);
  const step1MaxTime = new Date(now.getTime() - STEP_1_MIN_HOURS * 60 * 60 * 1000);
  const step2MinTime = new Date(now.getTime() - STEP_2_MAX_HOURS * 60 * 60 * 1000);
  const step2MaxTime = new Date(now.getTime() - STEP_2_MIN_HOURS * 60 * 60 * 1000);

  // Find carts eligible for Step 1
  // Carts updated 1-4 hours ago, user has marketing consent, no order placed after cart update
  const step1Candidates = await db.cart.findMany({
    where: {
      updatedAt: {
        gte: step1MinTime,
        lte: step1MaxTime,
      },
      user: {
        marketingConsent: true,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          orders: {
            where: {
              createdAt: {
                gte: step1MinTime, // Only orders after cart was updated
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  // Process Step 1 candidates
  for (const cart of step1Candidates) {
    try {
      // Skip if user has placed an order after cart update
      if (cart.user.orders.length > 0) {
        result.step1.skipped++;
        continue;
      }

      // Skip if cart is empty
      const items = cart.items as Array<{ productId: string; quantity: number }>;
      if (!items || items.length === 0) {
        result.step1.skipped++;
        continue;
      }

      // Check if we already sent step 1 for this cart
      const alreadySent = await hasEmailBeenSent(
        cart.userId,
        TEMPLATE_KEYS.CART_ABANDONMENT_STEP_1,
        1,
        cart.id
      );

      if (alreadySent) {
        result.step1.skipped++;
        continue;
      }

      // Fetch product details for the cart items
      const productIds = items.map((item) => item.productId);
      const products = await db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, priceCents: true, imageUrl: true },
      });

      // Build cart items for the email
      const cartItems: CartItem[] = items
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;
          return {
            name: product.name,
            priceCents: product.priceCents,
            imageUrl: product.imageUrl,
            quantity: item.quantity,
          };
        })
        .filter((item): item is CartItem => item !== null);

      if (cartItems.length === 0) {
        result.step1.skipped++;
        continue;
      }

      // Send the email
      if (!dryRun) {
        const sendResult = await sendDripEmail(
          {
            to: cart.user.email,
            userId: cart.userId,
            templateKey: TEMPLATE_KEYS.CART_ABANDONMENT_STEP_1,
            step: 1,
            relatedEntityId: cart.id,
          },
          {
            key: "cart_abandonment_step_1",
            data: {
              firstName: cart.user.name?.split(" ")[0],
              items: cartItems,
              cartId: cart.id,
            },
          }
        );

        if (sendResult.success) {
          result.step1.sent++;
        } else {
          result.step1.errors.push(`Cart ${cart.id}: ${sendResult.error}`);
        }
      } else {
        result.step1.sent++;
        console.log(`[DRY RUN] Would send step 1 email to ${cart.user.email}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      result.step1.errors.push(`Cart ${cart.id}: ${errorMsg}`);
    }
  }

  // Find carts eligible for Step 2
  const step2Candidates = await db.cart.findMany({
    where: {
      updatedAt: {
        gte: step2MinTime,
        lte: step2MaxTime,
      },
      user: {
        marketingConsent: true,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          orders: {
            where: {
              createdAt: {
                gte: step2MinTime,
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  // Process Step 2 candidates
  for (const cart of step2Candidates) {
    try {
      // Skip if user has placed an order after cart update
      if (cart.user.orders.length > 0) {
        result.step2.skipped++;
        continue;
      }

      // Skip if cart is empty
      const items = cart.items as Array<{ productId: string; quantity: number }>;
      if (!items || items.length === 0) {
        result.step2.skipped++;
        continue;
      }

      // Check if step 1 was sent (we require step 1 before step 2)
      const step1Sent = await hasEmailBeenSent(
        cart.userId,
        TEMPLATE_KEYS.CART_ABANDONMENT_STEP_1,
        1,
        cart.id
      );

      if (!step1Sent) {
        result.step2.skipped++;
        continue;
      }

      // Check if we already sent step 2 for this cart
      const step2AlreadySent = await hasEmailBeenSent(
        cart.userId,
        TEMPLATE_KEYS.CART_ABANDONMENT_STEP_2,
        2,
        cart.id
      );

      if (step2AlreadySent) {
        result.step2.skipped++;
        continue;
      }

      // Fetch product details
      const productIds = items.map((item) => item.productId);
      const products = await db.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, priceCents: true, imageUrl: true },
      });

      const cartItems: CartItem[] = items
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;
          return {
            name: product.name,
            priceCents: product.priceCents,
            imageUrl: product.imageUrl,
            quantity: item.quantity,
          };
        })
        .filter((item): item is CartItem => item !== null);

      if (cartItems.length === 0) {
        result.step2.skipped++;
        continue;
      }

      // Send the email
      if (!dryRun) {
        const sendResult = await sendDripEmail(
          {
            to: cart.user.email,
            userId: cart.userId,
            templateKey: TEMPLATE_KEYS.CART_ABANDONMENT_STEP_2,
            step: 2,
            relatedEntityId: cart.id,
          },
          {
            key: "cart_abandonment_step_2",
            data: {
              firstName: cart.user.name?.split(" ")[0],
              items: cartItems,
              cartId: cart.id,
            },
          }
        );

        if (sendResult.success) {
          result.step2.sent++;
        } else {
          result.step2.errors.push(`Cart ${cart.id}: ${sendResult.error}`);
        }
      } else {
        result.step2.sent++;
        console.log(`[DRY RUN] Would send step 2 email to ${cart.user.email}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      result.step2.errors.push(`Cart ${cart.id}: ${errorMsg}`);
    }
  }

  return result;
}
