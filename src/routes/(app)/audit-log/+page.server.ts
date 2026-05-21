import { error, redirect } from "@sveltejs/kit";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { appAuditLog, auditLog, member, user } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

const severityValues = ["low", "medium", "high", "critical"] as const;
const statusValues = ["success", "failed"] as const;
const nullText = sql<string | null>`null`;

function valueIn<const T extends readonly string[]>(
  values: T,
  value: string | null,
): T[number] | undefined {
  return values.find((v) => v === value);
}

async function requireAuditAccess(headers: Headers) {
  const activeMember = await auth.api.getActiveMember({ headers }).catch(() => null);
  const role = activeMember?.role ?? "";
  if (role !== "owner" && role !== "admin") {
    throw error(403, "Keine Berechtigung, Änderungen einzusehen");
  }
}

export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) throw redirect(302, "/login");
  const activeOrg = event.locals.activeOrganization;
  if (!activeOrg) throw error(403, "Keine aktive Organisation");
  await requireAuditAccess(event.request.headers);

  const impact = valueIn(severityValues, event.url.searchParams.get("impact"));
  const status = valueIn(statusValues, event.url.searchParams.get("status"));
  const action = event.url.searchParams.get("action")?.trim() ?? "";

  const conditions = [
    eq(member.organizationId, activeOrg.id),
    ...(impact ? [eq(auditLog.severity, impact)] : []),
    ...(status ? [eq(auditLog.status, status)] : []),
    ...(action ? [ilike(auditLog.action, `%${action}%`)] : []),
  ];

  const [authLogs, appLogs] = await Promise.all([
    db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        status: auditLog.status,
        severity: auditLog.severity,
        ipAddress: auditLog.ipAddress,
        metadata: auditLog.metadata,
        before: nullText,
        after: nullText,
        createdAt: auditLog.createdAt,
        userName: user.name,
        userEmail: user.email,
        entityType: auditLog.action,
        entityId: auditLog.id,
        source: auditLog.action,
      })
      .from(auditLog)
      .innerJoin(member, eq(member.userId, auditLog.userId))
      .leftJoin(user, eq(user.id, auditLog.userId))
      .where(and(...conditions))
      .orderBy(desc(auditLog.createdAt))
      .limit(250),
    db
      .select({
        id: appAuditLog.id,
        action: appAuditLog.action,
        status: appAuditLog.status,
        severity: appAuditLog.severity,
        ipAddress: nullText,
        metadata: appAuditLog.metadata,
        before: appAuditLog.before,
        after: appAuditLog.after,
        createdAt: appAuditLog.createdAt,
        userName: user.name,
        userEmail: user.email,
        entityType: appAuditLog.entityType,
        entityId: appAuditLog.entityId,
        source: appAuditLog.entityType,
      })
      .from(appAuditLog)
      .leftJoin(user, eq(user.id, appAuditLog.actorUserId))
      .where(
        and(
          eq(appAuditLog.organizationId, activeOrg.id),
          ...(impact ? [eq(appAuditLog.severity, impact)] : []),
          ...(status ? [eq(appAuditLog.status, status)] : []),
          ...(action ? [ilike(appAuditLog.action, `%${action}%`)] : []),
        ),
      )
      .orderBy(desc(appAuditLog.createdAt))
      .limit(250),
  ]);

  const logs = [...authLogs, ...appLogs]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 250);

  return {
    logs,
    filters: { impact: impact ?? "", status: status ?? "", action },
  };
};
