import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mietobjektImage } from "$lib/server/db/schema";
import { deleteObject, putObject } from "$lib/server/s3";

export type MietobjektImageInput = {
  id?: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  storageKey: string;
};

const REMOTE_IMAGE_CONCURRENCY = 4;
const MAX_REMOTE_IMAGE_BYTES = 15 * 1024 * 1024;

/**
 * Download images from external URLs (e.g. a portal listing) and store them in
 * our own bucket, returning pending image inputs ready to attach to the form.
 * Individual failures are skipped so a single bad URL never aborts the import.
 */
export async function storeRemoteImages(
  urls: string[],
): Promise<MietobjektImageInput[]> {
  const results: MietobjektImageInput[] = new Array(urls.length);

  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const index = cursor++;
      const stored = await storeRemoteImage(urls[index]).catch(() => null);
      if (stored) results[index] = stored;
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(REMOTE_IMAGE_CONCURRENCY, urls.length) },
      worker,
    ),
  );

  // Preserve original order and drop the ones that failed.
  return results.filter((image): image is MietobjektImageInput =>
    Boolean(image),
  );
}

async function storeRemoteImage(
  url: string,
): Promise<MietobjektImageInput | null> {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });
  if (!response.ok) return null;

  const contentType = response.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim();
  if (!contentType?.startsWith("image/")) return null;

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_REMOTE_IMAGE_BYTES) {
    return null;
  }

  const fileName = remoteFileName(url, contentType);
  const key = `mietobjekte/${crypto.randomUUID()}/${fileName}`;
  await putObject(key, bytes, contentType);

  return {
    fileName,
    mimeType: contentType,
    size: bytes.byteLength,
    storageKey: key,
  };
}

function remoteFileName(url: string, contentType: string): string {
  let base = "bild";
  try {
    const last = new URL(url).pathname.split("/").pop();
    if (last) base = last;
  } catch {
    // Keep the fallback name.
  }
  base = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (!/\.[a-zA-Z0-9]+$/.test(base)) {
    const ext =
      contentType.split("/")[1]?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
    base = `${base}.${ext}`;
  }
  return base;
}

export async function loadMietobjektImages(mietobjektId: string) {
  return db
    .select({
      id: mietobjektImage.id,
      fileName: mietobjektImage.fileName,
      mimeType: mietobjektImage.mimeType,
      size: mietobjektImage.size,
      storageKey: mietobjektImage.storageKey,
      sortOrder: mietobjektImage.sortOrder,
    })
    .from(mietobjektImage)
    .where(eq(mietobjektImage.mietobjektId, mietobjektId))
    .orderBy(asc(mietobjektImage.sortOrder), asc(mietobjektImage.createdAt));
}

export async function replaceMietobjektImages(
  mietobjektId: string,
  images: MietobjektImageInput[],
) {
  const existing = await db
    .select({
      id: mietobjektImage.id,
      storageKey: mietobjektImage.storageKey,
    })
    .from(mietobjektImage)
    .where(eq(mietobjektImage.mietobjektId, mietobjektId));

  const keptIds = new Set(
    images.flatMap((image) => (image.id ? [image.id] : [])),
  );
  const removed = existing.filter((image) => !keptIds.has(image.id));

  if (removed.length > 0) {
    await db.delete(mietobjektImage).where(
      inArray(
        mietobjektImage.id,
        removed.map((image) => image.id),
      ),
    );

    await Promise.allSettled(
      removed.map((image) => deleteObject(image.storageKey)),
    );
  }

  await Promise.all(
    images.map((image, index) => {
      if (image.id) {
        return db
          .update(mietobjektImage)
          .set({ sortOrder: index })
          .where(
            and(
              eq(mietobjektImage.id, image.id),
              eq(mietobjektImage.mietobjektId, mietobjektId),
            ),
          );
      }

      return db.insert(mietobjektImage).values({
        mietobjektId,
        fileName: image.fileName,
        mimeType: image.mimeType || null,
        size: image.size ?? null,
        storageKey: image.storageKey,
        sortOrder: index,
      });
    }),
  );
}

export async function deleteMietobjektImages(mietobjektIds: string[]) {
  if (mietobjektIds.length === 0) return;

  const images = await db
    .select({ storageKey: mietobjektImage.storageKey })
    .from(mietobjektImage)
    .where(inArray(mietobjektImage.mietobjektId, mietobjektIds));

  await Promise.allSettled(
    images.map((image) => deleteObject(image.storageKey)),
  );
}
