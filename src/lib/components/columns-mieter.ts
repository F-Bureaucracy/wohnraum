import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import { Checkbox } from "$lib/components/ui/checkbox/index.js";
import {
  renderComponent,
  renderSnippet,
} from "$lib/components/ui/data-table/index.js";
import { matchingRequirementFlags } from "$lib/matching-flags";
import BookmarkButton from "./bookmark-button.svelte";
import DataTableActions from "./actions.svelte";

export type Mieter = {
  id: string;
  name: string;
  email: string;
  telefon: string;
  mietobjekt: string;
  householdSize: number;
  maxColdRent?: number;
  needsBarrierFree: boolean;
  hasPets: boolean;
  bookmarked?: boolean;
  createdAt: Date;
};

const actionProps = {
  entitySingular: "Mieter",
  entityPlural: "Mieter",
  idFieldName: "mieterId",
  deleteAction: "/admin/mieter?/deleteMieter",
  editAction: "/admin/mieter?/updateMieter",
};

export function createMieterColumns(
  opts: { bookmarkAction?: string } = {},
): ColumnDef<Mieter>[] {
  const bookmarkAction = opts.bookmarkAction;
  return [
    {
      id: "select",
      size: 40,
      header: ({ table }) =>
        renderComponent(Checkbox, {
          checked: table.getIsAllPageRowsSelected(),
          indeterminate:
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected(),
          onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value),
          "aria-label": "Select all",
        }),
      cell: ({ row }) =>
        renderComponent(Checkbox, {
          checked: row.getIsSelected(),
          onCheckedChange: (value) => row.toggleSelected(!!value),
          "aria-label": "Select row",
        }),
      enableSorting: false,
      enableHiding: false,
    },
    ...(bookmarkAction
      ? [
          {
            id: "bookmark",
            size: 48,
            enableSorting: false,
            enableHiding: false,
            cell: ({ row }) =>
              renderComponent(BookmarkButton, {
                entityType: "mieter" as const,
                entityId: row.original.id,
                bookmarked: row.original.bookmarked ?? false,
                action: bookmarkAction,
              }),
          } satisfies ColumnDef<Mieter>,
        ]
      : []),
    {
      accessorKey: "name",
      header: "Name",
      size: 200,
      cell: ({ row }) =>
        linkCell(row.original.name, `/admin/mieter/${row.original.id}`),
    },
    {
      accessorKey: "email",
      header: "E-Mail",
      size: 220,
      cell: ({ row }) => truncCell(row.original.email),
    },
    {
      accessorKey: "telefon",
      header: "Telefon",
      size: 140,
      cell: ({ row }) => truncCell(row.original.telefon),
    },
    {
      accessorKey: "mietobjekt",
      header: "Mietobjekt",
      size: 220,
      cell: ({ row }) => truncCell(row.original.mietobjekt),
    },
    {
      accessorKey: "createdAt",
      header: "Erstellt am",
      size: 140,
      cell: ({ row }) => dateCell(row.original.createdAt),
    },
    {
      accessorKey: "householdSize",
      enableHiding: false,
      filterFn: "inNumberRange",
      meta: { filterOnly: true },
    },
    {
      accessorKey: "maxColdRent",
      enableHiding: false,
      filterFn: "inNumberRange",
      meta: { filterOnly: true },
    },
    ...matchingRequirementFlags.map(
      (flag) =>
        ({
          accessorKey: flag.mieterField,
          enableHiding: false,
          filterFn: "equals",
          meta: { filterOnly: true },
        }) satisfies ColumnDef<Mieter>,
    ),
    {
      id: "actions",
      size: 56,
      cell: ({ row }) =>
        renderComponent(DataTableActions, {
          ids: [row.original.id],
          title: row.original.name,
          ...actionProps,
        }),
    },
  ];
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
