import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import { Checkbox } from "$lib/components/ui/checkbox/index.js";
import {
  renderComponent,
  renderSnippet,
} from "$lib/components/ui/data-table/index.js";
import DataTableActions from "./actions.svelte";

export type Vermieter = {
  id: string;
  name: string;
  unternehmen: string;
  email: string;
  telefon: string;
  anzahlMietobjekte: number;
  createdAt: Date;
};

const actionProps = {
  entitySingular: "Vermieter",
  entityPlural: "Vermieter",
  idFieldName: "vermieterId",
  deleteAction: "/vermieter?/deleteVermieter",
  editAction: "/vermieter?/updateVermieter",
};

export const vermieterColumns: ColumnDef<Vermieter>[] = [
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
    accessorKey: "name",
    header: "Name",
    size: 200,
    cell: ({ row }) => truncCell(row.original.name),
  },
  {
    accessorKey: "unternehmen",
    header: "Unternehmen",
    size: 220,
    cell: ({ row }) => truncCell(row.original.unternehmen),
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
    size: 150,
    cell: ({ row }) => truncCell(row.original.telefon),
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
