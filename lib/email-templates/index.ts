// Email templates index - exports all templates and the send helper
export { baseEmailTemplate, stripHtml, buildUnsubscribeUrl } from "./base";
export type { BaseTemplateOptions } from "./base";
export { welcomeEmailTemplate } from "./welcome";
export type { WelcomeEmailData } from "./welcome";
export {
  cartAbandonmentStep1Template,
  cartAbandonmentStep2Template,
} from "./cart-abandonment";
export type { CartAbandonmentEmailData, CartItem } from "./cart-abandonment";
export { winbackStep1Template, winbackStep2Template } from "./winback";
export type { WinbackEmailData } from "./winback";
export { orderConfirmationTemplate } from "./order-confirmation";
export type { OrderConfirmationEmailData, OrderItem } from "./order-confirmation";
export { reviewRequestTemplate } from "./review-request";
export type { ReviewRequestEmailData } from "./review-request";

import { sendEmail } from "../ses-client";
import { db } from "../db";
import { buildUnsubscribeUrl } from "./base";
import { welcomeEmailTemplate, WelcomeEmailData } from "./welcome";
import {
  cartAbandonmentStep1Template,
  cartAbandonmentStep2Template,
  CartAbandonmentEmailData,
} from "./cart-abandonment";
import { winbackStep1Template, winbackStep2Template, WinbackEmailData } from "./winback";
import { orderConfirmationTemplate, OrderConfirmationEmailData } from "./order-confirmation";
import { reviewRequestTemplate, ReviewRequestEmailData } from "./review-request";

// Template key constants for consistency
export const TEMPLATE_KEYS = {
  WELCOME: "welcome",
  CART_ABANDONMENT_STEP_1: "cart_abandonment_step_1",
  CART_ABANDONMENT_STEP_2: "cart_abandonment_step_2",
  WINBACK_STEP_1: "winback_step_1",
  WINBACK_STEP_2: "winback_step_2",
  ORDER_CONFIRMATION: "order_confirmation",
  REVIEW_REQUEST: "review_request",
} as const;

type TemplateKey = (typeof TEMPLATE_KEYS)[keyof typeof TEMPLATE_KEYS];

interface SendDripEmailOptions {
  to: string;
  userId?: string;
  templateKey: TemplateKey;
  step?: number;
  relatedEntityId?: string;
  configSet?: string;
}

// Template data types
type TemplateData =
  | { key: "welcome"; data: WelcomeEmailData }
  | { key: "cart_abandonment_step_1"; data: CartAbandonmentEmailData }
  | { key: "cart_abandonment_step_2"; data: CartAbandonmentEmailData }
  | { key: "winback_step_1"; data: WinbackEmailData }
  | { key: "winback_step_2"; data: WinbackEmailData }
  | { key: "order_confirmation"; data: OrderConfirmationEmailData }
  | { key: "review_request"; data: ReviewRequestEmailData };

interface UnsubscribeContext {
  userId?: string;
  email: string;
}

// Get template content based on key
function getTemplateContent(template: TemplateData, unsubscribe?: UnsubscribeContext) {
  // Build unsubscribe URL if we have user context
  const unsubscribeUrl = unsubscribe?.userId && unsubscribe?.email
    ? buildUnsubscribeUrl(unsubscribe.userId, unsubscribe.email)
    : undefined;

  switch (template.key) {
    case "welcome":
      return welcomeEmailTemplate(template.data, unsubscribeUrl);
    case "cart_abandonment_step_1":
      return cartAbandonmentStep1Template(template.data, unsubscribeUrl);
    case "cart_abandonment_step_2":
      return cartAbandonmentStep2Template(template.data, unsubscribeUrl);
    case "winback_step_1":
      return winbackStep1Template(template.data, unsubscribeUrl);
    case "winback_step_2":
      return winbackStep2Template(template.data, unsubscribeUrl);
    case "order_confirmation":
      return orderConfirmationTemplate(template.data, unsubscribeUrl);
    case "review_request":
      return reviewRequestTemplate(template.data, unsubscribeUrl);
  }
}

// High-level helper to send drip emails with logging
export async function sendDripEmail(
  options: SendDripEmailOptions,
  template: TemplateData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, userId, templateKey, step = 1, relatedEntityId, configSet } = options;

  // Get the email content from template with unsubscribe context
  const { subject, html, text } = getTemplateContent(template, { userId, email: to });

  // Send via SES
  const result = await sendEmail({
    to,
    subject,
    html,
    text,
    configSet,
    tags: [
      { name: "template", value: templateKey },
      { name: "step", value: String(step) },
    ],
  });

  // Log the email send attempt
  try {
    await db.emailLog.create({
      data: {
        userId,
        email: to,
        templateKey,
        step,
        relatedEntityId,
        sesMessageId: result.messageId,
        configSet,
        status: result.success ? "sent" : "failed",
        metadata: result.error ? { error: result.error } : undefined,
      },
    });
  } catch (logError) {
    // Don't fail the send if logging fails
    console.error("Failed to log email:", logError);
  }

  return result;
}

// Check if an email was already sent for this template/entity combination
export async function hasEmailBeenSent(
  userId: string,
  templateKey: TemplateKey,
  step: number,
  relatedEntityId?: string
): Promise<boolean> {
  const existing = await db.emailLog.findFirst({
    where: {
      userId,
      templateKey,
      step,
      ...(relatedEntityId && { relatedEntityId }),
      status: { in: ["sent", "delivered", "opened", "clicked"] },
    },
  });

  return !!existing;
}
