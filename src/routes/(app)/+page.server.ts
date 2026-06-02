import { error, redirect } from "@sveltejs/kit";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import {
  mietobjekt,
  mietobjektReservation,
  mieter,
  organization,
} from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

type ChartPoint = {
  month: string;
  mietobjekte: number;
  mieter: number;
  verfuegbar: number;
};

const monthFormatter = new Intl.DateTimeFormat("de-DE", { month: "short" });

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthKey(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonths() {
  const start = monthStart(new Date());
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(start);
    date.setMonth(start.getMonth() - (5 - index));
    return {
      key: monthKey(date),
      label: monthFormatter.format(date),
    };
  });
}

function buildChart({
  mietobjektDates,
  mieterDates = [],
  availableDates = [],
}: {
  mietobjektDates: Array<Date | string>;
  mieterDates?: Array<Date | string>;
  availableDates?: Array<Date | string>;
}): ChartPoint[] {
  const months = buildMonths();
  const values = new Map(
    months.map((month) => [
      month.key,
      { month: month.label, mietobjekte: 0, mieter: 0, verfuegbar: 0 },
    ]),
  );

  for (const date of mietobjektDates) {
    const point = values.get(monthKey(date));
    if (point) point.mietobjekte += 1;
  }
  for (const date of mieterDates) {
    const point = values.get(monthKey(date));
    if (point) point.mieter += 1;
  }
  for (const date of availableDates) {
    const point = values.get(monthKey(date));
    if (point) point.verfuegbar += 1;
  }

  return [...values.values()];
}

export const load: PageServerLoad = async ({ locals }) => {
  const activeOrg = locals.activeOrganization;
  if (!activeOrg) throw redirect(302, "/settings");

  if (activeOrg.orgType === "administration") {
    const [mietobjekte, mieterRows, vermieterRows, reservations] =
      await Promise.all([
        db.select().from(mietobjekt).orderBy(desc(mietobjekt.createdAt)),
        db
          .select()
          .from(mieter)
          .where(eq(mieter.organizationId, activeOrg.id))
          .orderBy(desc(mieter.createdAt)),
        db
          .select()
          .from(organization)
          .where(eq(organization.orgType, "company"))
          .orderBy(desc(organization.createdAt)),
        db.select().from(mietobjektReservation),
      ]);

    const assignedMietobjektIds = new Set(
      mieterRows.flatMap((row) => (row.mietobjektId ? [row.mietobjektId] : [])),
    );
    const reservedMietobjektIds = new Set(
      reservations.map((reservation) => reservation.mietobjektId),
    );
    const availableMietobjekte = mietobjekte.filter(
      (row) =>
        !assignedMietobjektIds.has(row.id) &&
        !reservedMietobjektIds.has(row.id),
    );

    return {
      orgType: "administration" as const,
      stats: [
        {
          label: "Verfügbare Mietobjekte",
          value: availableMietobjekte.length,
          detail: `${mietobjekte.length} insgesamt`,
        },
        {
          label: "Offene Mieter",
          value: mieterRows.filter((row) => !row.mietobjektId).length,
          detail: `${mieterRows.length} Personen erfasst`,
        },
        {
          label: "Vermieter",
          value: vermieterRows.length,
          detail: "registrierte Organisationen",
        },
        {
          label: "Reservierungen",
          value: reservations.length,
          detail: "laufende Vormerkungen",
        },
      ],
      chart: buildChart({
        mietobjektDates: mietobjekte.map((row) => row.createdAt),
        mieterDates: mieterRows.map((row) => row.createdAt),
      }),
      recent: mietobjekte.slice(0, 5).map((row) => ({
        title: `${row.street} ${row.houseNumber}`,
        meta: `${row.city} · ${row.rooms} Zimmer · ${row.livingArea} m²`,
        href: `/admin/mietobjekte/${row.id}`,
      })),
    };
  }

  if (activeOrg.orgType === "company") {
    const mietobjekte = await db
      .select()
      .from(mietobjekt)
      .where(eq(mietobjekt.organizationId, activeOrg.id))
      .orderBy(desc(mietobjekt.createdAt));

    const mietobjektIds = mietobjekte.map((row) => row.id);
    const [assignedMieter, reservations] =
      mietobjektIds.length > 0
        ? await Promise.all([
            db
              .select()
              .from(mieter)
              .where(inArray(mieter.mietobjektId, mietobjektIds)),
            db
              .select()
              .from(mietobjektReservation)
              .where(
                inArray(mietobjektReservation.mietobjektId, mietobjektIds),
              ),
          ])
        : [[], []];

    const unavailableIds = new Set([
      ...assignedMieter.flatMap((row) =>
        row.mietobjektId ? [row.mietobjektId] : [],
      ),
      ...reservations.map((reservation) => reservation.mietobjektId),
    ]);

    return {
      orgType: "company" as const,
      stats: [
        {
          label: "Mietobjekte",
          value: mietobjekte.length,
          detail: "in Ihrer Organisation",
        },
        {
          label: "Verfügbar",
          value: mietobjekte.filter((row) => !unavailableIds.has(row.id))
            .length,
          detail: "nicht belegt oder reserviert",
        },
        {
          label: "Zugewiesen",
          value: assignedMieter.length,
          detail: "aktuelle Vermittlungen",
        },
        {
          label: "Reserviert",
          value: reservations.length,
          detail: "durch Sachbearbeitung",
        },
      ],
      chart: buildChart({
        mietobjektDates: mietobjekte.map((row) => row.createdAt),
        availableDates: mietobjekte.map((row) => row.availableFrom),
      }),
      recent: mietobjekte.slice(0, 5).map((row) => ({
        title: `${row.street} ${row.houseNumber}`,
        meta: `${row.city} · verfügbar ab ${row.availableFrom}`,
        href: `/vermieter/mietobjekte/${row.id}`,
      })),
    };
  }

  throw error(403, "Unbekannter Organisationstyp");
};
