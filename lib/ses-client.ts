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

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);

    console.log(`Email sent to ${to}, MessageId: ${response.MessageId}`);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to send email to ${to}:`, errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
