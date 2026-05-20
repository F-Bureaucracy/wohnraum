import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import { renderSnippet } from "$lib/components/ui/data-table/index.js";

export type Vermieter = {
  id: string;
  name: string;
  slug: string;
  anzahlMietobjekte: number;
  createdAt: Date;
};

export const vermieterColumns: ColumnDef<Vermieter>[] = [
  {
    accessorKey: "name",
    header: "Unternehmen",
    size: 320,
    cell: ({ row }) =>
      linkCell(row.original.name, `/admin/vermieter/${row.original.id}`),
  },
  {
    accessorKey: "slug",
    header: "Slug",
    size: 200,
    cell: ({ row }) => truncCell(row.original.slug),
  },
  {
    accessorKey: "anzahlMietobjekte",
    header: "Mietobjekte",
    size: 110,
    cell: ({ row }) => plainCell(String(row.original.anzahlMietobjekte)),
  },
  {
    accessorKey: "createdAt",
    header: "Erstellt am",
    size: 140,
    cell: ({ row }) => dateCell(row.original.createdAt),
  },
  {
    id: "open",
    size: 80,
    cell: ({ row }) => openCell(`/admin/vermieter/${row.original.id}`),
    enableSorting: false,
    enableHiding: false,
  },
];

function plainCell(value: string) {
  return renderSnippet(
    createRawSnippet<[{ value: string }]>((getArgs) => {
      const { value } = getArgs();
      return { render: () => `<div>${escapeText(value)}</div>` };
    }),
    { value },
  );
}

function truncCell(value: string) {
  return renderSnippet(
    createRawSnippet<[{ value: string }]>((getArgs) => {
      const { value } = getArgs();
      return {
        render: () =>
          `<div class="truncate" title="${escapeAttr(value)}">${escapeText(value)}</div>`,
      };
    }),
    { value: value ?? "" },
  );
}

function linkCell(value: string, href: string) {
  return renderSnippet(
    createRawSnippet<[{ value: string; href: string }]>((getArgs) => {
      const { value, href } = getArgs();
      return {
        render: () =>
          `<a href="${escapeAttr(href)}" class="truncate hover:underline text-foreground font-medium block" title="${escapeAttr(value)}" data-sveltekit-preload-data>${escapeText(value)}</a>`,
      };
    }),
    { value: value ?? "", href },
  );
}

function openCell(href: string) {
  return renderSnippet(
    createRawSnippet<[{ href: string }]>((getArgs) => {
      const { href } = getArgs();
      return {
        render: () =>
          `<a href="${escapeAttr(href)}" class="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted" data-sveltekit-preload-data>Öffnen</a>`,
      };
    }),
    { href },
  );
}

function dateCell(raw: Date | string) {
  const date = raw instanceof Date ? raw : new Date(raw);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const formatted = `${day}.${month}.${year}`;
  return renderSnippet(
    createRawSnippet<[{ formattedDate: string }]>((getArgs) => {
      const { formattedDate } = getArgs();
      return { render: () => `<div>${formattedDate}</div>` };
    }),
    { formattedDate: formatted },
  );
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}
