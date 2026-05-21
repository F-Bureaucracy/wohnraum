import type { ColumnFiltersState, Table } from "@tanstack/table-core";

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

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

/**
 * Build initial TanStack column-filter state from URL query params.
 * Booleans use `?<columnId>=true`; ranges use `?<columnId>_min=` / `?<columnId>_max=`,
 * with missing bounds defaulting to the filter's configured min/max.
 */
export function parseFiltersFromParams(
  params: URLSearchParams,
  filters: TableFilter[],
): ColumnFiltersState {
  const state: ColumnFiltersState = [];
  for (const f of filters) {
    if (f.type === "boolean") {
      if (params.get(f.columnId) === "true") {
        state.push({ id: f.columnId, value: true });
      }
      continue;
    }
    const rawMin = params.get(`${f.columnId}_min`);
    const rawMax = params.get(`${f.columnId}_max`);
    if (rawMin == null && rawMax == null) continue;
    const lo = clamp(rawMin != null ? Number(rawMin) : f.min, f.min, f.max);
    const hi = clamp(rawMax != null ? Number(rawMax) : f.max, f.min, f.max);
    if (Number.isNaN(lo) || Number.isNaN(hi) || lo > hi) continue;
    if (lo <= f.min && hi >= f.max) continue;
    state.push({ id: f.columnId, value: [lo, hi] });
  }
  return state;
}

/**
 * Reflect the current column-filter state back into URL params, preserving any
 * unrelated params. Only bounds that differ from a filter's defaults are written,
 * keeping the URL in sync with {@link parseFiltersFromParams}.
 */
export function applyFiltersToParams(
  base: URLSearchParams,
  columnFilters: ColumnFiltersState,
  filters: TableFilter[],
): URLSearchParams {
  const params = new URLSearchParams(base);
  for (const f of filters) {
    if (f.type === "boolean") params.delete(f.columnId);
    else {
      params.delete(`${f.columnId}_min`);
      params.delete(`${f.columnId}_max`);
    }
  }
  for (const f of filters) {
    const value = columnFilters.find((c) => c.id === f.columnId)?.value;
    if (value === undefined) continue;
    if (f.type === "boolean") {
      if (value === true) params.set(f.columnId, "true");
    } else {
      const [lo, hi] = value as [number, number];
      if (lo > f.min) params.set(`${f.columnId}_min`, String(lo));
      if (hi < f.max) params.set(`${f.columnId}_max`, String(hi));
    }
  }
  return params;
}

export function paramsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  const norm = (p: URLSearchParams) =>
    [...p.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join("&");
  return norm(a) === norm(b);
}
