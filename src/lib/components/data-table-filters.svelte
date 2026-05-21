<script lang="ts" generics="TData">
import type { Table } from '@tanstack/table-core';
import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
import * as Popover from '$lib/components/ui/popover/index.js';
import { Badge } from '$lib/components/ui/badge/index.js';
import { Button } from '$lib/components/ui/button/index.js';
import { Label } from '$lib/components/ui/label/index.js';
import { Separator } from '$lib/components/ui/separator/index.js';
import { Slider } from '$lib/components/ui/slider/index.js';
import { Switch } from '$lib/components/ui/switch/index.js';
import {
	activeFilters,
	clearFilter,
	formatRangeValue,
	rangeValue,
	type RangeFilter,
	type TableFilter,
} from './table-filters';

let { table, filters }: { table: Table<TData>; filters: TableFilter[] } = $props();

function setRange(f: RangeFilter, v: number[]) {
	const col = table.getColumn(f.columnId);
	if (!col) return;
	const [lo, hi] = v;
	if (lo <= f.min && hi >= f.max) col.setFilterValue(undefined);
	else col.setFilterValue([lo, hi]);
}

function boolValue(f: TableFilter): boolean {
	return table.getColumn(f.columnId)?.getFilterValue() === true;
}

function setBool(f: TableFilter, checked: boolean) {
	table.getColumn(f.columnId)?.setFilterValue(checked ? true : undefined);
}

function reset() {
	for (const f of filters) clearFilter(table, f);
}

const active = $derived(activeFilters(table, filters));
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="outline">
				<SlidersHorizontalIcon class="size-4" />
				Filter
				{#if active.length > 0}
					<Badge variant="secondary" class="ml-1 rounded-sm px-1 font-mono">
						{active.length}
					</Badge>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content align="start" class="w-80">
		<div class="grid gap-4">
			{#each filters as f, i (f.columnId)}
				{#if i > 0}
					<Separator />
				{/if}
				{#if f.type === 'range'}
					{@const [lo, hi] = rangeValue(table, f)}
					<div class="grid gap-2">
						<div class="flex items-center justify-between">
							<Label class="text-sm">{f.label}</Label>
							<span class="text-xs text-muted-foreground">
								{formatRangeValue(f, lo)} – {formatRangeValue(f, hi)}
							</span>
						</div>
						<Slider
							type="multiple"
							value={[lo, hi]}
							min={f.min}
							max={f.max}
							step={f.step ?? 1}
							onValueChange={(v) => setRange(f, v)}
						/>
					</div>
				{:else}
					<div class="flex items-center justify-between gap-2">
						<Label class="text-sm" for={`filter-${f.columnId}`}>{f.label}</Label>
						<Switch
							id={`filter-${f.columnId}`}
							checked={boolValue(f)}
							onCheckedChange={(c) => setBool(f, c)}
						/>
					</div>
				{/if}
			{/each}
			{#if active.length > 0}
				<Separator />
				<Button variant="ghost" size="sm" class="justify-self-start" onclick={reset}>
					Zurücksetzen
				</Button>
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>
