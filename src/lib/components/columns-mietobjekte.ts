import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import { Checkbox } from "$lib/components/ui/checkbox/index.js";
import {
  renderComponent,
  renderSnippet,
} from "$lib/components/ui/data-table/index.js";
import { type FilterDefinition, mietobjektDefs } from "$lib/matching-flags";
import BookmarkButton from "./bookmark-button.svelte";
import DataTableActions from "./actions.svelte";
import DataTableSortHeader from "./data-table-sort-header.svelte";

export type Mietobjekt = {
  id: string;
  adresse: string;
  zimmer: number;
  flaeche: number;
  kaltmiete: number;
  maxOccupants: number;
  vermieter?: string | null;
  vermieterId?: string;
  features: Record<string, boolean>;
  lng?: number;
  lat?: number;
  bookmarked?: boolean;
  createdAt: Date;
  // Feature booleans are spread onto the row under their filter key so TanStack
  // column filters (accessorKey = key) can read them.
  [key: string]: unknown;
};

const currencyFmt = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const numberFmt = new Intl.NumberFormat("de-DE");

export function createMietobjekteColumns(
  basePath: string,
  defs: FilterDefinition[],
  opts: { bookmarkAction?: string; showVermieter?: boolean } = {},
): ColumnDef<Mietobjekt>[] {
  const actionProps = {
    entitySingular: "Mietobjekt",
    entityPlural: "Mietobjekte",
    idFieldName: "mietobjektId",
    deleteAction: `${basePath}?/deleteMietobjekt`,
    editAction: `${basePath}?/updateMietobjekt`,
  };
  const bookmarkAction = opts.bookmarkAction;
  const showVermieter = opts.showVermieter ?? true;
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
                entityType: "mietobjekt" as const,
                entityId: row.original.id,
                bookmarked: row.original.bookmarked ?? false,
                action: bookmarkAction,
              }),
          } satisfies ColumnDef<Mietobjekt>,
        ]
      : []),
    {
      accessorKey: "adresse",
      header: "Adresse",
      size: 300,
      cell: ({ row }) =>
        linkCell(row.original.adresse, `${basePath}/${row.original.id}`),
    },
    ...(showVermieter
      ? [
          {
            accessorKey: "vermieter",
            header: "Vermieter",
            size: 220,
            cell: ({ row }) =>
              row.original.vermieterId
                ? linkCell(
                    row.original.vermieter ?? "—",
                    `/admin/vermieter/${row.original.vermieterId}`,
                  )
                : truncCell(row.original.vermieter ?? "—"),
          } satisfies ColumnDef<Mietobjekt>,
        ]
      : []),
    {
      accessorKey: "flaeche",
      header: ({ column }) =>
        renderComponent(DataTableSortHeader, {
          column: column as never,
          label: "Fläche (m²)",
        }),
      size: 120,
      filterFn: "inNumberRange",
      cell: ({ row }) =>
        plainCell(`${numberFmt.format(row.original.flaeche)} m²`),
    },
    {
      accessorKey: "kaltmiete",
      header: ({ column }) =>
        renderComponent(DataTableSortHeader, {
          column: column as never,
          label: "Kaltmiete",
        }),
      size: 140,
      filterFn: "inNumberRange",
      cell: ({ row }) => plainCell(currencyFmt.format(row.original.kaltmiete)),
    },
    {
      accessorKey: "zimmer",
      enableHiding: false,
      filterFn: "inNumberRange",
      meta: { filterOnly: true },
    },
    {
      accessorKey: "maxOccupants",
      enableHiding: false,
      filterFn: "inNumberRange",
      meta: { filterOnly: true },
    },
    ...mietobjektDefs(defs).map(
      (def) =>
        ({
          accessorKey: def.key,
          enableHiding: false,
          filterFn: "equals",
          meta: { filterOnly: true },
        }) satisfies ColumnDef<Mietobjekt>,
    ),
    {
      id: "actions",
      size: 56,
      cell: ({ row }) =>
        renderComponent(DataTableActions, {
          ids: [row.original.id],
          title: row.original.adresse,
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

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}
