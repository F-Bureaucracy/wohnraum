import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "$lib/server/db";
import { mietobjektImage } from "$lib/server/db/schema";
import { deleteObject } from "$lib/server/s3";

export type MietobjektImageInput = {
  id?: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  storageKey: string;
};

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

  const keptIds = new Set(images.flatMap((image) => (image.id ? [image.id] : [])));
  const removed = existing.filter((image) => !keptIds.has(image.id));

  if (removed.length > 0) {
    await db
      .delete(mietobjektImage)
      .where(
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
