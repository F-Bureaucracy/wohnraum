import { error, fail, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import type { RequestEvent } from "@sveltejs/kit";
import { db } from "$lib/server/db";
import { bookmark } from "$lib/server/db/schema";

export type BookmarkEntityType = "mietobjekt" | "mieter";

const entityTypes: BookmarkEntityType[] = ["mietobjekt", "mieter"];

function isEntityType(value: string): value is BookmarkEntityType {
  return (entityTypes as string[]).includes(value);
}

export async function getBookmarkedIds(
  userId: string,
  entityType: BookmarkEntityType,
): Promise<Set<string>> {
  const rows = await db
    .select({ entityId: bookmark.entityId })
    .from(bookmark)
    .where(
      and(eq(bookmark.userId, userId), eq(bookmark.entityType, entityType)),
    );
  return new Set(rows.map((r) => r.entityId));
}

export async function toggleBookmarkAction(event: RequestEvent) {
  if (!event.locals.user) throw redirect(302, "/login");
  if (event.locals.activeOrganization?.orgType !== "administration") {
    throw error(403, "Nur Administration");
  }

  const data = await event.request.formData();
  const entityType = data.get("entityType")?.toString() ?? "";
  const entityId = data.get("entityId")?.toString() ?? "";
  if (!isEntityType(entityType) || !entityId) {
    return fail(400, { message: "Ungültige Eingabe" });
  }

  const userId = event.locals.user.id;
  const deleted = await db
    .delete(bookmark)
    .where(
      and(
        eq(bookmark.userId, userId),
        eq(bookmark.entityType, entityType),
        eq(bookmark.entityId, entityId),
      ),
    )
    .returning({ id: bookmark.id });

  if (deleted.length === 0) {
    await db.insert(bookmark).values({ userId, entityType, entityId });
    return { bookmarked: true };
  }

  return { bookmarked: false };
}
