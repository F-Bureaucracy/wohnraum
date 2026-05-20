import { and, desc, eq, sql } from "drizzle-orm";
import { error, fail, redirect } from "@sveltejs/kit";
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
  createNote: async ({ request, params, locals }) => {
    if (!locals.user) throw redirect(302, "/login");
    const data = await request.formData();
    const body = (data.get("body") ?? "").toString().trim();
    if (!body) return fail(400, { message: "Notiz darf nicht leer sein" });

    await db.insert(vermieterNote).values({
      organizationId: params.id,
      authorId: locals.user.id,
      body,
    });
    return { success: true };
  },

  updateNote: async ({ request, params, locals }) => {
    if (!locals.user) throw redirect(302, "/login");
    const data = await request.formData();
    const noteId = (data.get("noteId") ?? "").toString();
    const body = (data.get("body") ?? "").toString().trim();
    if (!noteId || !body) return fail(400, { message: "Ungültige Eingabe" });

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
      .returning({ id: vermieterNote.id });

    if (result.length === 0) return fail(403, { message: "Nicht erlaubt" });
    return { success: true };
  },

  deleteNote: async ({ request, params, locals }) => {
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
      .returning({ id: vermieterNote.id });

    if (result.length === 0) return fail(403, { message: "Nicht erlaubt" });
    return { success: true };
  },
};
