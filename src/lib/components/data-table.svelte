<script lang="ts" generics="TData, TValue">
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from '@lucide/svelte';
import {
	type ColumnDef,
	type ColumnFiltersState,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type RowSelectionState,
	type SortingState,
	type VisibilityState,
} from '@tanstack/table-core';
import PlusIcon from '@lucide/svelte/icons/plus';
import { buttonVariants } from '$lib/components/ui/button/index.js';
import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
import * as Table from '$lib/components/ui/table/index.js';
import Button from '$ui/button/button.svelte';
import Input from '$ui/input/input.svelte';
import { Badge } from '$lib/components/ui/badge/index.js';
import { page } from '$app/state';
import { replaceState } from '$app/navigation';
import { resolve } from '$app/paths';
import DataTableActions from './actions.svelte';
import DataTableFilters from './data-table-filters.svelte';
import {
	activeFilters,
	applyFiltersToParams,
	chipText,
	clearFilter,
	paramsEqual,
	type TableFilter,
} from './table-filters';

let tableWidth = $state(0);

type DataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	filterColumnId?: string;
	filterPlaceholder?: string;
	entitySingular?: string;
	entityPlural?: string;
	idFieldName?: string;
	deleteAction?: string;
	editAction?: string;
	createHref?: string;
	createLabel?: string;
	filters?: TableFilter[];
	initialColumnFilters?: ColumnFiltersState;
	onFilteredDataChange?: (data: TData[]) => void;
};

let {
	data,
	columns,
	filterColumnId = 'title',
	filterPlaceholder = 'Filter...',
	entitySingular,
	entityPlural,
	idFieldName,
	deleteAction,
	editAction,
	createHref,
	createLabel,
	filters,
	initialColumnFilters,
	onFilteredDataChange,
}: DataTableProps<TData, TValue> = $props();

function initialVisibility(cols: ColumnDef<TData, TValue>[]): VisibilityState {
	const v: VisibilityState = {};
	for (const c of cols) {
		if (!c.meta?.filterOnly) continue;
		const id = c.id ?? ('accessorKey' in c ? String(c.accessorKey) : undefined);
		if (id) v[id] = false;
	}
	return v;
}

function notifyFilteredDataChange(): void {
	onFilteredDataChange?.(table.getFilteredRowModel().rows.map((row) => row.original));
}

const resolveDynamicHref = resolve as unknown as (href: string) => string;

let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
let pageSizeSelection = $derived(String(pagination.pageSize));
let sorting = $state<SortingState>([]);
let columnFilters = $state<ColumnFiltersState>(initialColumnFilters ?? []);
let columnVisibility = $state<VisibilityState>(initialVisibility(columns));
let rowSelection = $state<RowSelectionState>({});

const table = createSvelteTable({
	get data() {
		return data;
	},
	columns,
	getCoreRowModel: getCoreRowModel(),
	getPaginationRowModel: getPaginationRowModel(),
	getSortedRowModel: getSortedRowModel(),
	getFilteredRowModel: getFilteredRowModel(),
	onPaginationChange: (updater) => {
		if (typeof updater === 'function') {
			pagination = updater(pagination);
		} else {
			pagination = updater;
		}
	},
	onSortingChange: (updater) => {
		if (typeof updater === 'function') {
			sorting = updater(sorting);
		} else {
			sorting = updater;
		}
	},
	onColumnFiltersChange: (updater) => {
		if (typeof updater === 'function') {
			columnFilters = updater(columnFilters);
		} else {
			columnFilters = updater;
		}
	},
	onColumnVisibilityChange: (updater) => {
		if (typeof updater === 'function') {
			columnVisibility = updater(columnVisibility);
		} else {
			columnVisibility = updater;
		}
	},
	onRowSelectionChange: (updater) => {
		if (typeof updater === 'function') {
			rowSelection = updater(rowSelection);
		} else {
			rowSelection = updater;
		}
	},
	state: {
		get pagination() {
			return pagination;
		},
		get sorting() {
			return sorting;
		},
		get columnFilters() {
			return columnFilters;
		},
		get columnVisibility() {
			return columnVisibility;
		},
		get rowSelection() {
			return rowSelection;
		},
	},
});

const activeChips = $derived(filters ? activeFilters(table, filters) : []);
const filteredRowCount = $derived(table.getFilteredRowModel().rows.length);
const pageCount = $derived(table.getPageCount());
const pageNumber = $derived(pageCount === 0 ? 0 : pagination.pageIndex + 1);
const pageStart = $derived(
	filteredRowCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1,
);
const pageEnd = $derived(Math.min(filteredRowCount, (pagination.pageIndex + 1) * pagination.pageSize));

$effect(() => {
	notifyFilteredDataChange();
});

$effect(() => {
	const lastPageIndex = Math.max(pageCount - 1, 0);
	if (pagination.pageIndex > lastPageIndex) {
		pagination = { ...pagination, pageIndex: lastPageIndex };
	}
});

$effect(() => {
	if (!filters || filters.length === 0) return;
	const next = applyFiltersToParams(page.url.searchParams, columnFilters, filters);
	if (paramsEqual(next, page.url.searchParams)) return;
	const qs = next.toString();
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	replaceState(resolveDynamicHref(`${page.url.pathname}${qs ? `?${qs}` : ''}`), page.state);
});
</script>

<!-- Wrap everything in one container and measure its width -->
<div class="relative w-full" bind:clientWidth={tableWidth}>
	<!-- 1. Your existing Search / Columns top bar -->
	<div class="flex flex-col gap-2 py-4">
		<div class="flex items-center gap-2">
			<Input
				placeholder={filterPlaceholder}
				value={(table.getColumn(filterColumnId)?.getFilterValue() as string) ?? ''}
				oninput={(e) => table.getColumn(filterColumnId)?.setFilterValue(e.currentTarget.value)}
				onchange={(e) => {
					table.getColumn(filterColumnId)?.setFilterValue(e.currentTarget.value);
				}}
				class="max-w-sm"
			/>
			{#if filters && filters.length > 0}
				<DataTableFilters {table} {filters} />
			{/if}
			{#if createHref}
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href={resolveDynamicHref(createHref)}
					class={[buttonVariants({ variant: 'default', size: 'sm' }), 'ms-auto']}
				>
					<PlusIcon class="size-4" />
					{createLabel}
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{:else}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" class="ms-auto">
								Columns <ChevronDownIcon class="ms-2 size-4" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						{#each table.getAllColumns().filter((col) => col.getCanHide()) as column (column)}
							<DropdownMenu.CheckboxItem
								class="capitalize"
								bind:checked={() => column.getIsVisible(), (v) => column.toggleVisibility(!!v)}
							>
								{column.id}
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
		</div>
		{#if activeChips.length > 0}
			<div class="flex flex-wrap items-center gap-2">
				{#each activeChips as f (f.columnId)}
					<Badge variant="secondary" class="gap-1 pr-1">
						{chipText(table, f)}
						<button
							type="button"
							class="rounded-full p-0.5 hover:bg-background/60"
							aria-label={`${f.label} entfernen`}
							onclick={() => clearFilter(table, f)}
						>
							<XIcon class="size-3" />
						</button>
					</Badge>
				{/each}
			</div>
		{/if}
	</div>

	<!-- 2. Your existing Table -->
	<div class="table-scroll w-full overflow-x-auto rounded-md border">
		<Table.Root class="table-fixed">
			<Table.Header>
				{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
					<Table.Row>
						{#each headerGroup.headers as header (header.id)}
							<Table.Head
								colspan={header.colSpan}
								style="width: {header.getSize()}px"
								class="overflow-hidden"
							>
								{#if !header.isPlaceholder}
									<FlexRender
										content={header.column.columnDef.header}
										context={header.getContext()}
									/>
								{/if}
							</Table.Head>
						{/each}
					</Table.Row>
				{/each}
			</Table.Header>
			<Table.Body>
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row data-state={row.getIsSelected() && 'selected'}>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell style="width: {cell.column.getSize()}px" class="overflow-hidden">
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={columns.length} class="h-24 text-center">No results.</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<div class="flex flex-col gap-3 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
		<div>
			{#if filteredRowCount === 0}
				Keine Einträge
			{:else}
				{pageStart}-{pageEnd} von {filteredRowCount} Einträgen
			{/if}
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<label class="flex items-center gap-2">
				<span>Zeilen</span>
				<select
					bind:value={pageSizeSelection}
					onchange={() => table.setPageSize(Number(pageSizeSelection))}
					class="border-input bg-background h-8 rounded-md border px-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
				>
					<option value="10">10</option>
					<option value="25">25</option>
					<option value="50">50</option>
					<option value="100">100</option>
				</select>
			</label>
			<div class="min-w-20 text-center">
				Seite {pageNumber} von {Math.max(pageCount, 1)}
			</div>
			<Button
				variant="outline"
				size="icon-sm"
				disabled={!table.getCanPreviousPage()}
				aria-label="Vorherige Seite"
				onclick={() => table.previousPage()}
			>
				<ChevronLeftIcon class="size-4" />
			</Button>
			<Button
				variant="outline"
				size="icon-sm"
				disabled={!table.getCanNextPage()}
				aria-label="Nächste Seite"
				onclick={() => table.nextPage()}
			>
				<ChevronRightIcon class="size-4" />
			</Button>
		</div>
	</div>

	<!-- 3. The New Floating Action Bar -->
	{#if Object.keys(rowSelection).length > 0}
		<!-- 
		  `fixed bottom-8` keeps it locked to the bottom of the screen.
		  `style="width: {tableWidth}px;"` matches the table's exact width so flex centering perfectly aligns it, completely ignoring your sidebar layout.
		-->
		<div
			class="pointer-events-none fixed bottom-8 z-50 flex justify-center"
			style="width: {tableWidth}px;"
		>
			<div
				class="pointer-events-auto flex items-center gap-1 rounded-full border bg-background p-1 shadow-xl"
			>
				<!-- Left side: Count and Clear -->
				<div class="flex items-center gap-2 pr-1 pl-3 text-sm text-muted-foreground">
					<span class="font-medium text-foreground">
						{Object.keys(rowSelection).length} selected
					</span>
					<Button
						variant="ghost"
						size="icon"
						class="size-6 rounded-full hover:bg-muted"
						aria-label="Clear selection"
						onclick={() => (rowSelection = {})}
					>
						<XIcon class="size-4" />
					</Button>
				</div>

				<!-- Subtle vertical separator -->
				<div class="mx-1 h-5 w-px bg-border"></div>

				<!-- Right side: Actions -->
				<DataTableActions
					ids={table.getSelectedRowModel().rows.map((row) => (row.original as { id: string }).id)}
					floating
					{entitySingular}
					{entityPlural}
					{idFieldName}
					{deleteAction}
					{editAction}
				/>
			</div>
		</div>
	{/if}
</div>

<style>
	.table-scroll {
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
	}
	.table-scroll::-webkit-scrollbar {
		height: 10px;
	}
	.table-scroll::-webkit-scrollbar-track {
		background: transparent;
	}
	.table-scroll::-webkit-scrollbar-thumb {
		background-color: var(--color-border);
		border-radius: 9999px;
	}
	.table-scroll::-webkit-scrollbar-thumb:hover {
		background-color: var(--color-muted-foreground);
	}
</style>
