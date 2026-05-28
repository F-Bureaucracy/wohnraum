import { and, eq, isNull, ne, notExists } from "drizzle-orm";
import { error, fail } from "@sveltejs/kit";
import { writeAppAuditLog } from "$lib/server/audit";
import { db } from "$lib/server/db";
import { mieter, mietobjektReservation, user } from "$lib/server/db/schema";
import {
  loadMietobjektBewohner,
  loadMietobjektDetail,
} from "$lib/server/mietobjekt-mapping";
import { getBookmarkedIds, toggleBookmarkAction } from "$lib/server/bookmarks";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  const activeOrg = locals.activeOrganization;

  const [mietobjekt, bewohner, assignable, reservationRows] = await Promise.all(
    [
      loadMietobjektDetail(params.id),
      loadMietobjektBewohner(params.id),
      activeOrg
        ? db
            .select({
              id: mieter.id,
              firstName: mieter.firstName,
              lastName: mieter.lastName,
            })
            .from(mieter)
            .where(
              and(
                eq(mieter.organizationId, activeOrg.id),
                isNull(mieter.mietobjektId),
              ),
            )
            .orderBy(mieter.lastName, mieter.firstName)
        : Promise.resolve([]),
      db
        .select({
          userId: mietobjektReservation.userId,
          userName: user.name,
          createdAt: mietobjektReservation.createdAt,
        })
        .from(mietobjektReservation)
        .innerJoin(user, eq(user.id, mietobjektReservation.userId))
        .where(eq(mietobjektReservation.mietobjektId, params.id))
        .limit(1),
    ],
  );

  const reservation = reservationRows[0];

  const [mietobjektBookmarks, mieterBookmarks] = locals.user
    ? await Promise.all([
        getBookmarkedIds(locals.user.id, "mietobjekt"),
        getBookmarkedIds(locals.user.id, "mieter"),
      ])
    : [new Set<string>(), new Set<string>()];

  return {
    mietobjekt,
    bewohner,
    bookmarked: mietobjektBookmarks.has(params.id),
    reservation: reservation
      ? {
          userId: reservation.userId,
          userName: reservation.userName,
          createdAt: reservation.createdAt,
          isCurrentUser: reservation.userId === locals.user?.id,
        }
      : null,
    assignableMieter: assignable.map((r) => ({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`,
      bookmarked: mieterBookmarks.has(r.id),
    })),
  };
};

export const actions: Actions = {
  toggleBookmark: toggleBookmarkAction,

  reserveMietobjekt: async (event) => {
    const activeOrg = event.locals.activeOrganization;
    const currentUser = event.locals.user;
    if (activeOrg?.orgType !== "administration" || !currentUser) {
      throw error(403, "Nur Administration");
    }

    const result = await db
      .insert(mietobjektReservation)
      .values({ mietobjektId: event.params.id, userId: currentUser.id })
      .onConflictDoNothing({ target: mietobjektReservation.mietobjektId })
      .returning({ id: mietobjektReservation.id });

    if (result.length === 0) {
      return fail(409, {
        reservationError: "Dieses Mietobjekt ist bereits reserviert.",
      });
    }

    await writeAppAuditLog(event, {
      action: "mietobjekt:reserve",
      entityType: "mietobjekt",
      entityId: event.params.id,
      severity: "low",
    });

    return { success: true };
  },

  unreserveMietobjekt: async (event) => {
    const activeOrg = event.locals.activeOrganization;
    const currentUser = event.locals.user;
    if (activeOrg?.orgType !== "administration" || !currentUser) {
      throw error(403, "Nur Administration");
    }

    const result = await db
      .delete(mietobjektReservation)
      .where(
        and(
          eq(mietobjektReservation.mietobjektId, event.params.id),
          eq(mietobjektReservation.userId, currentUser.id),
        ),
      )
      .returning({ id: mietobjektReservation.id });

    if (result.length === 0) {
      return fail(403, {
        reservationError:
          "Nur die reservierende Person kann die Reservierung entfernen.",
      });
    }

    await writeAppAuditLog(event, {
      action: "mietobjekt:unreserve",
      entityType: "mietobjekt",
      entityId: event.params.id,
      severity: "low",
    });

    return { success: true };
  },

  assignMieter: async (event) => {
    const activeOrg = event.locals.activeOrganization;
    const currentUser = event.locals.user;
    if (activeOrg?.orgType !== "administration" || !currentUser) {
      throw error(403, "Nur Administration");
    }

    const data = await event.request.formData();
    const mieterId = String(data.get("mieterId") ?? "");
    if (!mieterId) throw error(400, "Kein Mieter ausgewählt");

    const blockingReservation = db
      .select({ id: mietobjektReservation.id })
      .from(mietobjektReservation)
      .where(
        and(
          eq(mietobjektReservation.mietobjektId, event.params.id),
          ne(mietobjektReservation.userId, currentUser.id),
        ),
      );

    const result = await db
      .update(mieter)
      .set({ mietobjektId: event.params.id })
      .where(
        and(
          eq(mieter.id, mieterId),
          eq(mieter.organizationId, activeOrg.id),
          isNull(mieter.mietobjektId),
          notExists(blockingReservation),
        ),
      )
      .returning({
        id: mieter.id,
        firstName: mieter.firstName,
        lastName: mieter.lastName,
      });

    if (result.length === 0) {
      const [reservation] = await db
        .select({ userId: mietobjektReservation.userId })
        .from(mietobjektReservation)
        .where(eq(mietobjektReservation.mietobjektId, event.params.id))
        .limit(1);

      if (reservation && reservation.userId !== currentUser.id) {
        return fail(403, {
          assignmentError:
            "Dieses Mietobjekt ist durch eine andere Person reserviert.",
        });
      }

      throw error(404, "Mieter nicht gefunden oder bereits zugewiesen");
    }

    await writeAppAuditLog(event, {
      action: "mieter:assign",
      entityType: "mieter",
      entityId: result[0].id,
      severity: "high",
      metadata: {
        mietobjektId: event.params.id,
        label: `${result[0].firstName} ${result[0].lastName}`,
      },
      after: { mietobjektId: event.params.id },
    });

    return { success: true };
  },

  unassignMieter: async (event) => {
    const activeOrg = event.locals.activeOrganization;
    if (activeOrg?.orgType !== "administration") {
      throw error(403, "Nur Administration");
    }

    const data = await event.request.formData();
    const mieterId = String(data.get("mieterId") ?? "");
    if (!mieterId) throw error(400, "Kein Mieter ausgewählt");

    const result = await db
      .update(mieter)
      .set({ mietobjektId: null })
      .where(
        and(
          eq(mieter.id, mieterId),
          eq(mieter.organizationId, activeOrg.id),
          eq(mieter.mietobjektId, event.params.id),
        ),
      )
      .returning({
        id: mieter.id,
        firstName: mieter.firstName,
        lastName: mieter.lastName,
      });

    if (result.length === 0) throw error(404, "Mieter nicht gefunden");

    await writeAppAuditLog(event, {
      action: "mieter:unassign",
      entityType: "mieter",
      entityId: result[0].id,
      severity: "high",
      metadata: {
        mietobjektId: event.params.id,
        label: `${result[0].firstName} ${result[0].lastName}`,
      },
      before: { mietobjektId: event.params.id },
      after: { mietobjektId: null },
    });

    return { success: true };
  },
};
