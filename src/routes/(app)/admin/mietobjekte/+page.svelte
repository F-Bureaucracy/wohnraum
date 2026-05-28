<script lang="ts">
	import { page } from '$app/state';
	import PageHeader from '$lib/components/page-header.svelte';
	import MietobjekteView from '$lib/components/mietobjekte-view.svelte';
	import { getMietobjektFeatureFilters } from '$lib/matching-flags';
	import { parseFiltersFromParams, type TableFilter } from '$lib/components/table-filters';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function ceilTo(value: number, step: number, fallback: number) {
		const max = Math.max(value, fallback);
		return Math.ceil(max / step) * step;
	}

	const filters = $derived<TableFilter[]>([
		{
			type: 'range',
			columnId: 'kaltmiete',
			label: 'Kaltmiete',
			min: 0,
			max: ceilTo(Math.max(0, ...data.mietobjekte.map((m) => m.kaltmiete)), 50, 1000),
			step: 50,
			currency: true,
		},
		{
			type: 'range',
			columnId: 'flaeche',
			label: 'Fläche',
			min: 0,
			max: ceilTo(Math.max(0, ...data.mietobjekte.map((m) => m.flaeche)), 10, 100),
			step: 5,
			unit: 'm²',
		},
		{
			type: 'range',
			columnId: 'zimmer',
			label: 'Zimmer',
			min: 0,
			max: ceilTo(Math.max(0, ...data.mietobjekte.map((m) => m.zimmer)), 1, 5),
			step: 1,
		},
		{
			type: 'range',
			columnId: 'maxOccupants',
			label: 'Max. Personen',
			min: 0,
			max: ceilTo(Math.max(0, ...data.mietobjekte.map((m) => m.maxOccupants)), 1, 5),
			step: 1,
		},
		...getMietobjektFeatureFilters(data.filterDefinitions),
	]);

	const initialColumnFilters = $derived(parseFiltersFromParams(page.url.searchParams, filters));
</script>

<PageHeader title="Mietobjekte" />
<MietobjekteView
	data={data.mietobjekte}
	basePath="/admin/mietobjekte"
	filterDefinitions={data.filterDefinitions}
	bookmarkAction="/admin/mietobjekte?/toggleBookmark"
	{filters}
	{initialColumnFilters}
/>
