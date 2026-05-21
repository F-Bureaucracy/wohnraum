<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css';
	import maplibregl from 'maplibre-gl';
	import { MapLibre, Marker, Popup } from 'svelte-maplibre-gl';
	import DataTable from '$lib/components/data-table.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import {
		createMietobjekteColumns,
		type Mietobjekt,
	} from '$lib/components/columns-mietobjekte';
	import type { TableFilter } from '$lib/components/table-filters';
	import type { ColumnFiltersState } from '@tanstack/table-core';

	let {
		data,
		basePath,
		createHref,
		createLabel,
		bookmarkAction,
		filters,
		initialColumnFilters,
	}: {
		data: Mietobjekt[];
		basePath: string;
		createHref?: string;
		createLabel?: string;
		bookmarkAction?: string;
		filters?: TableFilter[];
		initialColumnFilters?: ColumnFiltersState;
	} = $props();

	const geo = $derived(
		data.filter(
			(o): o is Mietobjekt & { lng: number; lat: number } =>
				typeof o.lng === 'number' && typeof o.lat === 'number',
		),
	);

	const columns = $derived(createMietobjekteColumns(basePath, { bookmarkAction }));
	let activePopup: string | null = $state(null);
	let map = $state<maplibregl.Map>();

	$effect(() => {
		if (!map || geo.length === 0) return;
		if (geo.length === 1) {
			map.jumpTo({ center: { lng: geo[0].lng, lat: geo[0].lat }, zoom: 14 });
			return;
		}
		const bounds = geo.reduce(
			(b, o) => b.extend([o.lng, o.lat]),
			new maplibregl.LngLatBounds([geo[0].lng, geo[0].lat], [geo[0].lng, geo[0].lat]),
		);
		map.fitBounds(bounds, { padding: 48, animate: false });
	});
</script>

<div
	class="grid w-full min-w-0 flex-1 grid-cols-[minmax(0,1fr)_340px] gap-4 p-4 pt-0 xl:grid-cols-[minmax(0,1fr)_420px]"
>
	<div class="min-w-0">
		<DataTable
			{columns}
			{data}
			{filters}
			{initialColumnFilters}
			filterColumnId="adresse"
			filterPlaceholder="Mietobjekt suchen..."
			entitySingular="Mietobjekt"
			entityPlural="Mietobjekte"
			idFieldName="mietobjektId"
			deleteAction={`${basePath}?/deleteMietobjekt`}
			editAction={`${basePath}?/updateMietobjekt`}
			{createHref}
			{createLabel}
		/>
	</div>
	<div class="sticky top-4 h-[calc(100vh-6rem)] overflow-hidden rounded-md border">
		<MapLibre
			bind:map
			class="h-full w-full"
			style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
			center={{ lng: 8.0473, lat: 52.2799 }}
			zoom={12}
		>
			{#each geo as obj (obj.id)}
				<Marker lnglat={{ lng: obj.lng, lat: obj.lat }} onclick={() => (activePopup = obj.id)}>
					{#if activePopup === obj.id}
						<Popup offset={24} onclose={() => (activePopup = null)}>
							<div class="space-y-2 text-sm">
								<div class="font-medium">{obj.adresse}</div>
								<div class="text-muted-foreground">
									{obj.zimmer} Zi · {obj.flaeche} m² · {obj.kaltmiete.toLocaleString('de-DE', {
										style: 'currency',
										currency: 'EUR',
									})}
								</div>
								<a
									href={`${basePath}/${obj.id}`}
									class={buttonVariants({ variant: 'outline', size: 'sm' })}
									data-sveltekit-preload-data
								>
									Details
								</a>
							</div>
						</Popup>
					{/if}
				</Marker>
			{/each}
		</MapLibre>
	</div>
</div>
