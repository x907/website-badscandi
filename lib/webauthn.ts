import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from "@simplewebauthn/server";
import { db } from "./db";

const rpName = process.env.RP_NAME || "Bad Scandi";
const rpID = process.env.RP_ID || "localhost";
const origin = process.env.RP_ORIGIN || "http://localhost:3000";

export async function generatePasskeyRegistrationOptions(userId: string, userEmail: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { passkeys: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: userEmail,
    userDisplayName: user.name || userEmail,
    attestationType: "none",
    excludeCredentials: user.passkeys.map((passkey) => ({
      id: Buffer.from(passkey.credentialId, "base64"),
      type: "public-key",
      transports: passkey.transports?.split(",") as AuthenticatorTransport[] | undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  return options;
}

export async function verifyPasskeyRegistration(
  userId: string,
  response: any,
  expectedChallenge: string
) {
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Verification failed");
  }

  const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

  const passkey = await db.passkey.create({
    data: {
      userId,
      credentialId: Buffer.from(credentialID).toString("base64"),
      publicKey: Buffer.from(credentialPublicKey),
      counter: BigInt(counter),
      transports: response.response.transports?.join(","),
    },
  });

  return { verified: true, passkey };
}

export async function generatePasskeyAuthenticationOptions(email?: string) {
  let allowCredentials: { id: Buffer; type: "public-key"; transports?: AuthenticatorTransport[] }[] = [];

  if (email) {
    const user = await db.user.findUnique({
      where: { email },
      include: { passkeys: true },
    });

    if (user && user.passkeys.length > 0) {
      allowCredentials = user.passkeys.map((passkey) => ({
        id: Buffer.from(passkey.credentialId, "base64"),
        type: "public-key" as const,
        transports: passkey.transports?.split(",") as AuthenticatorTransport[] | undefined,
      }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    userVerification: "preferred",
  });

  return options;
}

export async function verifyPasskeyAuthentication(
  response: any,
  expectedChallenge: string
) {
  const credentialId = Buffer.from(response.id, "base64url").toString("base64");

  const passkey = await db.passkey.findUnique({
    where: { credentialId },
    include: { user: true },
  });

  if (!passkey) {
    throw new Error("Passkey not found");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: Buffer.from(passkey.credentialId, "base64"),
      credentialPublicKey: passkey.publicKey,
      counter: Number(passkey.counter),
    },
  });

  if (!verification.verified) {
    throw new Error("Verification failed");
  }

  await db.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsed: new Date(),
    },
  });

  return { verified: true, user: passkey.user };
}
