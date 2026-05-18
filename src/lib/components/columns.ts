import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import { Checkbox } from "$lib/components/ui/checkbox/index.js";
import {
  renderComponent,
  renderSnippet,
} from "$lib/components/ui/data-table/index.js";
import DataTableActions from "./actions.svelte";
import OpenButton from "./open-button.svelte";

export type Thread = {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
};

export const columns: ColumnDef<Thread>[] = [
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
    accessorKey: "title",
    header: "Title",
    size: 240,
    cell: ({ row }) => {
      const title = row.original.title === "" ? "Untitled" : row.original.title;
      return renderSnippet(
        createRawSnippet<[{ value: string }]>((getArgs) => {
          const { value } = getArgs();
          return {
            render: () =>
              `<div class="truncate" title="${escapeAttr(value)}">${escapeText(value)}</div>`,
          };
        }),
        { value: title },
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    size: 140,
    cell: ({ row }) => {
      const dateCellSnippet = createRawSnippet<[{ formattedDate: string }]>(
        (getArgs) => {
          const { formattedDate } = getArgs();
          return {
            render: () => `<div>${formattedDate}</div>`,
          };
        },
      );

      // Extract the date (fallback to new Date() handles cases where JSON APIs return strings instead of actual Date objects)
      const rawDate = row.original.createdAt;
      const date = rawDate instanceof Date ? rawDate : new Date(rawDate);

      // Extract parts and format to dd.mm.yyyy
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      const formatted = `${day}.${month}.${year}`;

      return renderSnippet(dateCellSnippet, {
        formattedDate: formatted,
      });
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    size: 360,
    cell: ({ row }) => {
      const value = row.original.description ?? "";
      return renderSnippet(
        createRawSnippet<[{ value: string }]>((getArgs) => {
          const { value } = getArgs();
          return {
            render: () =>
              `<div class="truncate text-muted-foreground" title="${escapeAttr(value)}">${escapeText(value)}</div>`,
          };
        }),
        { value },
      );
    },
  },
  {
    id: "open",
    size: 100,
    cell: ({ row }) => renderComponent(OpenButton, { id: row.original.id }),
  },
  {
    id: "actions",
    size: 56,
    cell: ({ row }) =>
      renderComponent(DataTableActions, {
        ids: [row.original.id],
        title: row.original.title,
        description: row.original.description,
      }),
  },
];

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}
