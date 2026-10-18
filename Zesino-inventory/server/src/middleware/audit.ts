import type { AuditAction } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export async function writeAudit(
  action: AuditAction,
  entityType: string,
  entityId: string | null,
  userId: string | undefined,
  details?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId: entityId ?? undefined,
      userId,
      details: details ? JSON.stringify(details) : undefined,
    },
  });
}
