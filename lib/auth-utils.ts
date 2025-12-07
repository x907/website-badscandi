import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";

/**
 * Get the current session and user from better-auth
 */
export async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();

  if (!session?.user) {
    return false;
  }

  // Check if user has admin role in database
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  return user?.isAdmin || false;
}

/**
 * Require admin access - throws error if not admin
 */
export async function requireAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }
}
