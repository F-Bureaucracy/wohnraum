import type { Table } from "@tanstack/table-core";

export type RangeFilter = {
  type: "range";
  columnId: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  currency?: boolean;
};

export type TableFilter =
  | {
      type: "boolean";
      columnId: string;
      label: string;
    }
  | RangeFilter;

const currencyFmt = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const numberFmt = new Intl.NumberFormat("de-DE");

export function formatRangeValue(f: RangeFilter, n: number): string {
  if (f.currency) return currencyFmt.format(n);
  return `${numberFmt.format(n)}${f.unit ? ` ${f.unit}` : ""}`;
}

export function rangeValue<TData>(
  table: Table<TData>,
  f: RangeFilter,
): [number, number] {
  const v = table.getColumn(f.columnId)?.getFilterValue() as
    | [number, number]
    | undefined;
  return [v?.[0] ?? f.min, v?.[1] ?? f.max];
}

export function activeFilters<TData>(
  table: Table<TData>,
  filters: TableFilter[],
): TableFilter[] {
  return filters.filter(
    (f) => table.getColumn(f.columnId)?.getFilterValue() !== undefined,
  );
}

export function clearFilter<TData>(table: Table<TData>, f: TableFilter): void {
  table.getColumn(f.columnId)?.setFilterValue(undefined);
}

export function chipText<TData>(table: Table<TData>, f: TableFilter): string {
  if (f.type === "boolean") return f.label;
  const [lo, hi] = rangeValue(table, f);
  if (lo <= f.min) return `${f.label} ≤ ${formatRangeValue(f, hi)}`;
  if (hi >= f.max) return `${f.label} ≥ ${formatRangeValue(f, lo)}`;
  return `${f.label}: ${formatRangeValue(f, lo)}–${formatRangeValue(f, hi)}`;
}
