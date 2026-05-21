<script lang="ts">
	import DataTable from '$lib/components/data-table.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { page } from '$app/state';
	import { createMieterColumns } from '$lib/components/columns-mieter';
	import { getMieterRequirementFilters } from '$lib/matching-flags';
	import { parseFiltersFromParams, type TableFilter } from '$lib/components/table-filters';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const columns = createMieterColumns({ bookmarkAction: '/admin/mieter?/toggleBookmark' });

	function ceilTo(value: number, step: number, fallback: number) {
		const max = Math.max(value, fallback);
		return Math.ceil(max / step) * step;
	}

	const filters = $derived<TableFilter[]>([
		{
			type: 'range',
			columnId: 'maxColdRent',
			label: 'Max. Kaltmiete (Budget)',
			min: 0,
			max: ceilTo(
				Math.max(0, ...data.mieter.map((m) => m.maxColdRent ?? 0)),
				50,
				1000,
			),
			step: 50,
			currency: true,
		},
		{
			type: 'range',
			columnId: 'householdSize',
			label: 'Haushaltsgröße',
			min: 1,
			max: ceilTo(Math.max(1, ...data.mieter.map((m) => m.householdSize)), 1, 4),
			step: 1,
		},
		...getMieterRequirementFilters(),
	]);

	const initialColumnFilters = $derived(parseFiltersFromParams(page.url.searchParams, filters));
</script>

<PageHeader title="Mieter" />
{#if data.mieter.length === 0}
	<div class="flex flex-1 items-center justify-center p-6">
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<UsersIcon />
				</Empty.Media>
				<Empty.Title>Noch keine Mieter</Empty.Title>
				<Empty.Description>
					Erfassen Sie die erste Person, die eine Wohnung sucht.
				</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button href="/admin/mieter/new">
					<PlusIcon class="size-4" />
					Neuer Mieter
				</Button>
			</Empty.Content>
		</Empty.Root>
	</div>
{:else}
	<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
		<DataTable
			{columns}
			data={data.mieter}
			{filters}
			{initialColumnFilters}
			filterColumnId="name"
			filterPlaceholder="Mieter suchen..."
			entitySingular="Mieter"
			entityPlural="Mieter"
			idFieldName="mieterId"
			deleteAction="/admin/mieter?/deleteMieter"
			editAction="/admin/mieter?/updateMieter"
			createHref="/admin/mieter/new"
			createLabel="Neuer Mieter"
		/>
	</div>
{/if}
