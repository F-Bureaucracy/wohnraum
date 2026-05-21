import { and, desc, eq, sql } from "drizzle-orm";
import { error, fail, redirect } from "@sveltejs/kit";
import { writeAppAuditLog } from "$lib/server/audit";
import { db } from "$lib/server/db";
import {
  member,
  mietobjekt,
  organization,
  user,
  vermieterNote,
} from "$lib/server/db/schema";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) throw redirect(302, "/login");

  const [org] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      anzahlMietobjekte: sql<number>`count(${mietobjekt.id})::int`,
    })
    .from(organization)
    .leftJoin(mietobjekt, eq(mietobjekt.organizationId, organization.id))
    .where(
      and(eq(organization.id, params.id), eq(organization.orgType, "company")),
    )
    .groupBy(organization.id);

  if (!org) throw error(404, "Vermieter nicht gefunden");

  const owners = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, params.id), eq(member.role, "owner")));

  const notes = await db
    .select({
      id: vermieterNote.id,
      body: vermieterNote.body,
      createdAt: vermieterNote.createdAt,
      updatedAt: vermieterNote.updatedAt,
      authorId: vermieterNote.authorId,
      authorName: user.name,
    })
    .from(vermieterNote)
    .innerJoin(user, eq(user.id, vermieterNote.authorId))
    .where(eq(vermieterNote.organizationId, params.id))
    .orderBy(desc(vermieterNote.createdAt));

  return {
    vermieter: org,
    owners,
    notes,
    currentUserId: locals.user.id,
  };
};

export const actions: Actions = {
  createNote: async (event) => {
    const { request, params, locals } = event;
    if (!locals.user) throw redirect(302, "/login");
    const data = await request.formData();
    const body = (data.get("body") ?? "").toString().trim();
    if (!body) return fail(400, { message: "Notiz darf nicht leer sein" });

    const [created] = await db
      .insert(vermieterNote)
      .values({
        organizationId: params.id,
        authorId: locals.user.id,
        body,
      })
      .returning();

    await writeAppAuditLog(event, {
      action: "vermieter-note:create",
      entityType: "vermieter-note",
      entityId: created.id,
      organizationId: params.id,
      severity: "low",
      after: created,
    });
    return { success: true };
  },

  updateNote: async (event) => {
    const { request, params, locals } = event;
    if (!locals.user) throw redirect(302, "/login");
    const data = await request.formData();
    const noteId = (data.get("noteId") ?? "").toString();
    const body = (data.get("body") ?? "").toString().trim();
    if (!noteId || !body) return fail(400, { message: "Ungültige Eingabe" });

    const [before] = await db
      .select()
      .from(vermieterNote)
      .where(
        and(
          eq(vermieterNote.id, noteId),
          eq(vermieterNote.organizationId, params.id),
          eq(vermieterNote.authorId, locals.user.id),
        ),
      )
      .limit(1);

    const result = await db
      .update(vermieterNote)
      .set({ body })
      .where(
        and(
          eq(vermieterNote.id, noteId),
          eq(vermieterNote.organizationId, params.id),
          eq(vermieterNote.authorId, locals.user.id),
        ),
      )
      .returning();

    if (result.length === 0) return fail(403, { message: "Nicht erlaubt" });

    await writeAppAuditLog(event, {
      action: "vermieter-note:update",
      entityType: "vermieter-note",
      entityId: result[0].id,
      organizationId: params.id,
      severity: "low",
      before,
      after: result[0],
    });

    return { success: true };
  },

  deleteNote: async (event) => {
    const { request, params, locals } = event;
    if (!locals.user) throw redirect(302, "/login");
    const data = await request.formData();
    const noteId = (data.get("noteId") ?? "").toString();
    if (!noteId) return fail(400, { message: "Ungültige Eingabe" });

    const result = await db
      .delete(vermieterNote)
      .where(
        and(
          eq(vermieterNote.id, noteId),
          eq(vermieterNote.organizationId, params.id),
          eq(vermieterNote.authorId, locals.user.id),
        ),
      )
      .returning();

    if (result.length === 0) return fail(403, { message: "Nicht erlaubt" });

    await writeAppAuditLog(event, {
      action: "vermieter-note:delete",
      entityType: "vermieter-note",
      entityId: result[0].id,
      organizationId: params.id,
      severity: "medium",
      before: result[0],
    });

    return { success: true };
  },
};
