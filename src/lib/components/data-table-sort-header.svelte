<script lang="ts">
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Column } from '@tanstack/table-core';

	let {
		column,
		label,
	}: {
		column: Column<unknown, unknown>;
		label: string;
	} = $props();

	const sorted = $derived(column.getIsSorted());
</script>

<Button variant="ghost" size="sm" class="-ml-3 h-8" onclick={() => column.toggleSorting(sorted === 'asc')}>
	{label}
	{#if sorted === 'asc'}
		<ArrowUpIcon class="size-3.5" />
	{:else if sorted === 'desc'}
		<ArrowDownIcon class="size-3.5" />
	{:else}
		<ArrowUpDownIcon class="size-3.5" />
	{/if}
</Button>
