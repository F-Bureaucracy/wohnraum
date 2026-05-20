import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import { Checkbox } from "$lib/components/ui/checkbox/index.js";
import {
  renderComponent,
  renderSnippet,
} from "$lib/components/ui/data-table/index.js";
import DataTableActions from "./actions.svelte";

export type Mietobjekt = {
  id: string;
  adresse: string;
  zimmer: number;
  flaeche: number;
  kaltmiete: number;
  lng: number;
  lat: number;
  createdAt: Date;
};

const actionProps = {
  entitySingular: "Mietobjekt",
  entityPlural: "Mietobjekte",
  idFieldName: "mietobjektId",
  deleteAction: "/admin/mietobjekte?/deleteMietobjekt",
  editAction: "/admin/mietobjekte?/updateMietobjekt",
};

const currencyFmt = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const numberFmt = new Intl.NumberFormat("de-DE");

export const mietobjekteColumns: ColumnDef<Mietobjekt>[] = [
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
  {
    accessorKey: "adresse",
    header: "Adresse",
    size: 320,
    cell: ({ row }) =>
      linkCell(row.original.adresse, `/mietobjekte/${row.original.id}`),
  },
  {
    accessorKey: "zimmer",
    header: "Zimmer",
    size: 100,
    cell: ({ row }) => plainCell(numberFmt.format(row.original.zimmer)),
  },
  {
    accessorKey: "flaeche",
    header: "Fläche (m²)",
    size: 120,
    cell: ({ row }) =>
      plainCell(`${numberFmt.format(row.original.flaeche)} m²`),
  },
  {
    accessorKey: "kaltmiete",
    header: "Kaltmiete",
    size: 140,
    cell: ({ row }) => plainCell(currencyFmt.format(row.original.kaltmiete)),
  },
  {
    accessorKey: "createdAt",
    header: "Erstellt am",
    size: 140,
    cell: ({ row }) => dateCell(row.original.createdAt),
  },
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

function plainCell(value: string) {
  return renderSnippet(
    createRawSnippet<[{ value: string }]>((getArgs) => {
      const { value } = getArgs();
      return { render: () => `<div>${escapeText(value)}</div>` };
    }),
    { value },
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
