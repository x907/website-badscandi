import { SendEmailCommand } from "@aws-sdk/client-ses";
import { sesClient } from "./ses-client";

/**
 * Helper to delay execution (for retry backoff)
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send email with automatic retry on failure
 * Uses exponential backoff: 1s, 2s, 4s between retries
 */
async function sendEmailWithRetry(
  command: SendEmailCommand,
  maxRetries: number = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await sesClient.send(command);
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Email send attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const backoffMs = Math.pow(2, attempt) * 1000;
        await delay(backoffMs);
      }
    }
  }

  // All retries exhausted
  throw lastError;
}

export async function sendMagicLinkEmail(email: string, url: string) {
  const fromEmail = process.env.EMAIL_FROM || "noreply@badscandi.com";

  const params = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Sign in to Bad Scandi",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
                  <h1 style="color: #1a1a1a; margin-bottom: 20px;">Welcome to Bad Scandi</h1>
                  <p style="font-size: 16px; margin-bottom: 30px;">Click the button below to sign in to your account.</p>

                  <a href="${url}" style="display: inline-block; background-color: #000; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                    Sign In
                  </a>

                  <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    This link will expire in 5 minutes.
                  </p>

                  <p style="font-size: 12px; color: #999; margin-top: 20px;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="font-size: 12px; color: #999;">
                    Bad Scandi - Handcrafted Fiber Art
                  </p>
                </div>
              </body>
            </html>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `Sign in to Bad Scandi\n\nClick the link below to sign in:\n\n${url}\n\nThis link will expire in 5 minutes.\n\nIf you didn't request this email, you can safely ignore it.`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    await sendEmailWithRetry(command);
    console.log(`Magic link email sent to ${email}`);
  } catch (error) {
    console.error("Error sending magic link email after retries:", error);
    throw error;
  }
}

/**
 * Send order confirmation email with retry
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderDetails: {
    orderId: string;
    items: Array<{ name: string; quantity: number; priceCents: number }>;
    totalCents: number;
    shippingAddress?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  }
): Promise<void> {
  const fromEmail = process.env.EMAIL_FROM || "noreply@badscandi.com";

  const itemsHtml = orderDetails.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">$${(item.priceCents / 100).toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  const shippingHtml = orderDetails.shippingAddress
    ? `
      <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 6px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Shipping Address:</h3>
        <p style="margin: 0; line-height: 1.5;">
          ${orderDetails.shippingAddress.line1 || ""}<br>
          ${orderDetails.shippingAddress.line2 ? orderDetails.shippingAddress.line2 + "<br>" : ""}
          ${orderDetails.shippingAddress.city || ""}, ${orderDetails.shippingAddress.state || ""} ${orderDetails.shippingAddress.postal_code || ""}<br>
          ${orderDetails.shippingAddress.country || ""}
        </p>
      </div>
    `
    : "";

  const params = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: `Order Confirmation - Bad Scandi #${orderDetails.orderId.slice(-8).toUpperCase()}`,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px;">
                  <h1 style="color: #1a1a1a; margin-bottom: 10px;">Thank you for your order!</h1>
                  <p style="color: #666; margin-bottom: 30px;">Order #${orderDetails.orderId.slice(-8).toUpperCase()}</p>

                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f0f0f0;">
                        <th style="padding: 12px; text-align: left;">Item</th>
                        <th style="padding: 12px; text-align: center;">Qty</th>
                        <th style="padding: 12px; text-align: right;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2" style="padding: 12px; font-weight: bold;">Total</td>
                        <td style="padding: 12px; text-align: right; font-weight: bold;">$${(orderDetails.totalCents / 100).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  ${shippingHtml}

                  <p style="margin-top: 30px; color: #666;">
                    We'll send you a shipping confirmation when your order is on its way.
                  </p>
                </div>

                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <p style="font-size: 12px; color: #999;">
                    Bad Scandi - Handcrafted Fiber Art
                  </p>
                </div>
              </body>
            </html>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `Thank you for your order!\n\nOrder #${orderDetails.orderId.slice(-8).toUpperCase()}\n\nTotal: $${(orderDetails.totalCents / 100).toFixed(2)}\n\nWe'll send you a shipping confirmation when your order is on its way.`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    await sendEmailWithRetry(command);
    console.log(`Order confirmation email sent to ${email}`);
  } catch (error) {
    console.error("Error sending order confirmation email after retries:", error);
    throw error;
  }
}
