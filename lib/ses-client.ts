import { SESClient, SendEmailCommand, SendEmailCommandInput } from "@aws-sdk/client-ses";

// SES client configured from environment variables
// AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY must be set
export const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Helper to delay execution (for retry backoff)
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  configSet?: string; // SES configuration set for tracking
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Reusable email sending helper
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text, configSet, tags } = options;
  const fromEmail = process.env.EMAIL_FROM || "noreply@badscandi.com";

  const params: SendEmailCommandInput = {
    Source: fromEmail,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: html,
          Charset: "UTF-8",
        },
        Text: {
          Data: text,
          Charset: "UTF-8",
        },
      },
    },
    // Configuration set for tracking opens, clicks, bounces
    ...(configSet && { ConfigurationSetName: configSet }),
    // Tags for filtering in SES metrics
    ...(tags && {
      Tags: tags.map((tag) => ({ Name: tag.name, Value: tag.value })),
    }),
  };

  const command = new SendEmailCommand(params);
  const maxRetries = 3;
  let lastError: string = "Unknown error";

  // Retry with exponential backoff: 1s, 2s, 4s
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await sesClient.send(command);
      console.log(`Email sent to ${to}, MessageId: ${response.MessageId}`);
      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";
      console.error(`Email send attempt ${attempt + 1}/${maxRetries} to ${to} failed:`, lastError);

      if (attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await delay(backoffMs);
      }
    }
  }

  // All retries exhausted
  console.error(`Failed to send email to ${to} after ${maxRetries} attempts`);
  return {
    success: false,
    error: lastError,
  };
}
