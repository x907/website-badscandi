import { db } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "feature"
  | "unfeature"
  | "refund";

export type AuditEntityType =
  | "product"
  | "review"
  | "order"
  | "user";

interface AuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  changes?: Record<string, unknown>;
}

/**
 * Log an admin action for audit trail
 * Call this after successful admin operations
 */
export async function logAuditEvent({
  action,
  entityType,
  entityId,
  changes,
}: AuditLogParams): Promise<void> {
  try {
    const session = await getSession();
    if (!session?.user) {
      console.error("Audit log: No session found");
      return;
    }

    const headersList = await headers();
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action,
        entityType,
        entityId,
        changes: changes as Prisma.InputJsonValue ?? Prisma.JsonNull,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Don't let audit logging failures break the main operation
    console.error("Failed to log audit event:", error);
  }
}

/**
 * Helper to create a changes object for updates
 */
export function createChangesObject(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[]
): Record<string, { before: unknown; after: unknown }> | null {
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  let hasChanges = false;

  for (const field of fields) {
    if (before[field] !== after[field]) {
      changes[field] = {
        before: before[field],
        after: after[field],
      };
      hasChanges = true;
    }
  }

  return hasChanges ? changes : null;
}
