import { error, fail, redirect } from "@sveltejs/kit";
import { type DemoListing, isKnownFeature } from "$lib/features";
import { auth } from "$lib/server/auth";
import {
  getDemoListing,
  getOrgFeatures,
  setDemoListing,
  setOrgFeature,
} from "$lib/server/org-settings";
import type { Actions, PageServerLoad } from "./$types";

async function requireAdministrationManager(event: {
  request: Request;
  locals: App.Locals;
}): Promise<{ organizationId: string }> {
  if (!event.locals.user) throw redirect(302, "/login");
  const org = event.locals.activeOrganization;
  if (org?.orgType !== "administration") {
    throw error(403, "Nur die Administration darf Features verwalten");
  }
  const activeMember = await auth.api
    .getActiveMember({ headers: event.request.headers })
    .catch(() => null);
  const role = activeMember?.role ?? "";
  if (role !== "owner" && role !== "admin") {
    throw error(403, "Keine Berechtigung, Features zu verwalten");
  }
  return { organizationId: org.id };
}

export const load: PageServerLoad = async (event) => {
  const { organizationId } = await requireAdministrationManager(event);
  return {
    features: await getOrgFeatures(organizationId),
    demoListing: await getDemoListing(organizationId),
  };
};

// Read a non-empty trimmed string field, or undefined.
function str(form: FormData, key: string): string | undefined {
  const value = String(form.get(key) ?? "").trim();
  return value.length > 0 ? value : undefined;
}

// Read a non-negative number field (German "1.234,56" tolerated), or undefined.
function num(form: FormData, key: string): number | undefined {
  const raw = str(form, key);
  if (raw === undefined) return undefined;
  const normalized = raw
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

function parseDemoListing(form: FormData): DemoListing {
  const listing: DemoListing = {
    street: str(form, "street"),
    houseNumber: str(form, "houseNumber"),
    postalCode: str(form, "postalCode"),
    city: str(form, "city"),
    livingArea: num(form, "livingArea"),
    rooms: num(form, "rooms"),
    bedrooms: num(form, "bedrooms"),
    coldRent: num(form, "coldRent"),
    operatingCosts: num(form, "operatingCosts"),
    heatingCosts: num(form, "heatingCosts"),
    deposit: num(form, "deposit"),
    description: str(form, "description"),
    imageUrls: String(form.get("imageUrls") ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  };
  // Drop empty keys so the stored payload stays compact.
  for (const key of Object.keys(listing) as Array<keyof DemoListing>) {
    const value = listing[key];
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      delete listing[key];
    }
  }
  return listing;
}

export const actions: Actions = {
  toggle: async (event) => {
    const { organizationId } = await requireAdministrationManager(event);

    const form = await event.request.formData();
    const key = String(form.get("key") ?? "");
    const enabled = form.get("enabled") === "true";

    if (!isKnownFeature(key)) {
      return fail(400, { message: "Unbekanntes Feature" });
    }

    try {
      await setOrgFeature(organizationId, key, enabled);
      return { success: true };
    } catch (err) {
      console.error("[settings/features] toggle failed", err);
      return fail(500, { message: "Speichern fehlgeschlagen" });
    }
  },

  saveDemoListing: async (event) => {
    const { organizationId } = await requireAdministrationManager(event);

    const form = await event.request.formData();
    const demoListing = parseDemoListing(form);

    try {
      await setDemoListing(organizationId, demoListing);
      return { demoSaved: true };
    } catch (err) {
      console.error("[settings/features] saveDemoListing failed", err);
      return fail(500, { message: "Speichern fehlgeschlagen" });
    }
  },
};
