import type { RequestEvent } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { appAuditLog } from "$lib/server/db/schema";

type AuditSeverity = "low" | "medium" | "high" | "critical";
type AuditStatus = "success" | "failed";

type AuditPayload = {
  action: string;
  entityType: string;
  entityId?: string | null;
  organizationId?: string;
  severity?: AuditSeverity;
  status?: AuditStatus;
  metadata?: Record<string, unknown>;
  before?: unknown;
  after?: unknown;
};

function serialize(value: unknown): string | null {
  if (value == null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ unserializable: true });
  }
}

export async function writeAppAuditLog(
  event: RequestEvent,
  payload: AuditPayload,
) {
  const organizationId =
    payload.organizationId ?? event.locals.activeOrganization?.id;
  const actorUserId = event.locals.user?.id;

  if (!organizationId || !actorUserId) return;

  await db.insert(appAuditLog).values({
    organizationId,
    actorUserId,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId ?? null,
    status: payload.status ?? "success",
    severity: payload.severity ?? "low",
    metadata: serialize(payload.metadata),
    before: serialize(payload.before),
    after: serialize(payload.after),
  });
}
