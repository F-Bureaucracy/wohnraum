import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import { renderSnippet } from "$lib/components/ui/data-table/index.js";

export type Bericht = {
  id: string;
  prompt: string;
  status: string;
  createdAt: Date;
};

export const berichtColumns: ColumnDef<Bericht>[] = [
  {
    accessorKey: "prompt",
    header: "Prompt",
    size: 420,
    cell: ({ row }) =>
      linkCell(row.original.prompt, `/admin/berichte/${row.original.id}`),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 140,
    cell: ({ row }) => statusCell(row.original.status),
  },
  {
    accessorKey: "createdAt",
    header: "Erstellt am",
    size: 160,
    cell: ({ row }) => dateCell(row.original.createdAt),
  },
  {
    id: "open",
    size: 80,
    cell: ({ row }) => openCell(`/admin/berichte/${row.original.id}`),
    enableSorting: false,
    enableHiding: false,
  },
];

const statusMeta: Record<string, { label: string; classes: string }> = {
  generating: {
    label: "Wird erstellt",
    classes: "bg-amber-100 text-amber-800",
  },
  ready: { label: "Fertig", classes: "bg-emerald-100 text-emerald-800" },
  error: { label: "Fehler", classes: "bg-red-100 text-red-800" },
};

function statusCell(status: string) {
  const meta = statusMeta[status] ?? {
    label: status,
    classes: "bg-muted text-muted-foreground",
  };
  return renderSnippet(
    createRawSnippet<[{ label: string; classes: string }]>((getArgs) => {
      const { label, classes } = getArgs();
      return {
        render: () =>
          `<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classes}">${escapeText(label)}</span>`,
      };
    }),
    { label: meta.label, classes: meta.classes },
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
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const formatted = `${day}.${month}.${year} ${hours}:${minutes}`;
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
