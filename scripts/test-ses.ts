import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

async function testSESConnection() {
  console.log("=== Testing AWS SES Configuration ===\n");

  // Check if environment variables are set
  const awsRegion = process.env.AWS_REGION;
  const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const emailFrom = process.env.EMAIL_FROM;

  console.log("Checking environment variables:");
  console.log(`✓ AWS_REGION: ${awsRegion ? awsRegion : "❌ NOT SET"}`);
  console.log(`✓ AWS_ACCESS_KEY_ID: ${awsAccessKeyId ? awsAccessKeyId.substring(0, 8) + "..." : "❌ NOT SET"}`);
  console.log(`✓ AWS_SECRET_ACCESS_KEY: ${awsSecretAccessKey ? "[HIDDEN] (length: " + awsSecretAccessKey.length + ")" : "❌ NOT SET"}`);
  console.log(`✓ EMAIL_FROM: ${emailFrom ? emailFrom : "❌ NOT SET"}\n`);

  if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey || !emailFrom) {
    console.error("❌ Error: Missing required environment variables");
    console.log("\nPlease add these to your .env.local file:");
    console.log("AWS_REGION=us-east-1");
    console.log("AWS_ACCESS_KEY_ID=your_access_key_id");
    console.log("AWS_SECRET_ACCESS_KEY=your_secret_access_key");
    console.log("EMAIL_FROM=noreply@yourdomain.com");
    process.exit(1);
  }

  // Create SES client
  const sesClient = new SESClient({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    },
  });

  // Ask for test email address
  const testEmail = process.argv[2];
  if (!testEmail) {
    console.error("❌ Error: Please provide a test email address");
    console.log("\nUsage: npm run test:ses your-email@example.com");
    console.log("\n⚠️  IMPORTANT: In AWS SES Sandbox mode:");
    console.log("   - Both sender AND recipient emails must be verified in AWS SES Console");
    console.log("   - Go to: https://console.aws.amazon.com/ses/home#/verified-identities");
    process.exit(1);
  }

  console.log(`Attempting to send test email to: ${testEmail}\n`);

  const params = {
    Source: emailFrom,
    Destination: {
      ToAddresses: [testEmail],
    },
    Message: {
      Subject: {
        Data: "AWS SES Test Email",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
              </head>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #28a745;">✓ AWS SES Connection Successful!</h1>
                <p>Your AWS SES credentials are configured correctly and working.</p>
                <p><strong>From:</strong> ${emailFrom}</p>
                <p><strong>Region:</strong> ${awsRegion}</p>
                <hr>
                <p style="font-size: 12px; color: #666;">
                  This is a test email from your Bad Scandi e-commerce site.
                </p>
              </body>
            </html>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `AWS SES Test Email\n\nYour AWS SES credentials are configured correctly and working.\n\nFrom: ${emailFrom}\nRegion: ${awsRegion}`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);

    console.log("✅ SUCCESS! Email sent successfully");
    console.log(`Message ID: ${response.MessageId}\n`);
    console.log("Next steps:");
    console.log("1. Check your inbox (and spam folder) for the test email");
    console.log("2. If in Sandbox mode, make sure the recipient email is verified in AWS SES Console");
    console.log("3. For production use, request production access in AWS SES Console\n");
  } catch (error: any) {
    console.error("\n❌ FAILED to send email");
    console.error("Error:", error.message);

    if (error.name === "MessageRejected") {
      console.log("\n⚠️  Common causes:");
      console.log("   - Email address not verified (you're in Sandbox mode)");
      console.log("   - Verify both sender and recipient in AWS SES Console");
      console.log("   - https://console.aws.amazon.com/ses/home#/verified-identities");
    } else if (error.name === "InvalidClientTokenId" || error.name === "SignatureDoesNotMatch") {
      console.log("\n⚠️  Authentication Error:");
      console.log("   - Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
      console.log("   - Make sure they're for the correct AWS account");
      console.log("   - Verify the IAM user has SES permissions");
    } else if (error.name === "ConfigurationSetDoesNotExist") {
      console.log("\n⚠️  Configuration Error:");
      console.log("   - Check your AWS_REGION matches where SES is configured");
      console.log("   - Current region: " + awsRegion);
    }

    console.log("\nFull error details:");
    console.error(error);
    process.exit(1);
  }
}

testSESConnection();
