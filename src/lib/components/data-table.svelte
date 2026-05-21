<script lang="ts" generics="TData, TValue">
import { ChevronDownIcon, XIcon } from '@lucide/svelte';
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
import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
import { buttonVariants } from '$lib/components/ui/button/index.js';
import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table/index.js';
import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
import * as Table from '$lib/components/ui/table/index.js';
import Button from '$ui/button/button.svelte';
import Input from '$ui/input/input.svelte';
import DataTableActions from './actions.svelte';

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
}: DataTableProps<TData, TValue> = $props();

let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 10 });
let sorting = $state<SortingState>([]);
let columnFilters = $state<ColumnFiltersState>([]);
let columnVisibility = $state<VisibilityState>({});
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
</script>

<!-- Wrap everything in one container and measure its width -->
<div class="relative w-full" bind:clientWidth={tableWidth}>
	<!-- 1. Your existing Search / Columns top bar -->
	<div class="flex items-center py-4">
		<Input
			placeholder={filterPlaceholder}
			value={(table.getColumn(filterColumnId)?.getFilterValue() as string) ?? ''}
			oninput={(e) => table.getColumn(filterColumnId)?.setFilterValue(e.currentTarget.value)}
			onchange={(e) => {
				table.getColumn(filterColumnId)?.setFilterValue(e.currentTarget.value);
			}}
			class="max-w-sm"
		/>
		{#if createHref}
			<a href={createHref} class={[buttonVariants({ variant: 'default', size: 'sm' }), 'ms-auto']}>
				<PlusIcon class="size-4" />
				{createLabel}
			</a>
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

	<!-- 2. Your existing Table -->
	<div class="w-full overflow-x-auto rounded-md border">
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
