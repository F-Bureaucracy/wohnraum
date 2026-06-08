<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css';
	import maplibregl from 'maplibre-gl';
	import { MapLibre, Marker, Popup } from 'svelte-maplibre-gl';
	import { resolve } from '$app/paths';
	import DataTable from '$lib/components/data-table.svelte';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import {
		createMietobjekteColumns,
		type Mietobjekt,
	} from '$lib/components/columns-mietobjekte';
	import type { TableFilter } from '$lib/components/table-filters';
	import type { FilterDefinition } from '$lib/matching-flags';
	import type { ColumnFiltersState } from '@tanstack/table-core';

	let {
		data,
		basePath,
		filterDefinitions,
		createHref,
		createLabel,
		bookmarkAction,
		showVermieterColumn = true,
		filters,
		initialColumnFilters,
	}: {
		data: Mietobjekt[];
		basePath: string;
		filterDefinitions: FilterDefinition[];
		createHref?: string;
		createLabel?: string;
		bookmarkAction?: string;
		showVermieterColumn?: boolean;
		filters?: TableFilter[];
		initialColumnFilters?: ColumnFiltersState;
	} = $props();

	let tableFilteredData = $state<Mietobjekt[]>();
	const visibleData = $derived(tableFilteredData ?? data);

	const geo = $derived(
		visibleData.filter(
			(o): o is Mietobjekt & { lng: number; lat: number } =>
				typeof o.lng === 'number' && typeof o.lat === 'number',
		),
	);

	const columns = $derived(
		createMietobjekteColumns(basePath, filterDefinitions, {
			bookmarkAction,
			showVermieter: showVermieterColumn,
		}),
	);
	let activePopup: string | null = $state(null);
	let map = $state<maplibregl.Map>();
	let fittedGeoKey = $state('');
	const resolveDynamicHref = resolve as unknown as (href: string) => string;

	const activeObj = $derived(activePopup ? geo.find((obj) => obj.id === activePopup) : undefined);

	function openPopup(event: MouseEvent, id: string) {
		event.preventDefault();
		event.stopPropagation();
		activePopup = id;
	}

	function closestPointId(point: maplibregl.PointLike) {
		if (!map) return null;
		const clickPoint = maplibregl.Point.convert(point);
		let closest: { id: string; distance: number } | null = null;

		for (const obj of geo) {
			const markerPoint = map.project([obj.lng, obj.lat]);
			const distance = clickPoint.dist(markerPoint);
			if (distance <= 28 && (!closest || distance < closest.distance)) {
				closest = { id: obj.id, distance };
			}
		}

		return closest?.id ?? null;
	}

	$effect(() => {
		if (!map) return;

		function handleMapClick(event: maplibregl.MapMouseEvent) {
			const id = closestPointId(event.point);
			if (id) activePopup = id;
		}

		map.on('click', handleMapClick);
		return () => {
			map?.off('click', handleMapClick);
		};
	});

	$effect(() => {
		if (!map || geo.length === 0) return;
		const geoKey = geo.map((obj) => obj.id).join('|');
		if (geoKey === fittedGeoKey) return;
		fittedGeoKey = geoKey;
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

	$effect(() => {
		if (!activePopup || visibleData.some((obj) => obj.id === activePopup)) return;
		activePopup = null;
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
			{createHref}
			{createLabel}
			onFilteredDataChange={(rows) => (tableFilteredData = rows)}
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
				<Marker lnglat={{ lng: obj.lng, lat: obj.lat }}>
					{#snippet content()}
						<button
							type="button"
							class="map-marker"
							aria-label={`Details zu ${obj.adresse} anzeigen`}
							onclick={(event) => openPopup(event, obj.id)}
						></button>
					{/snippet}
				</Marker>
			{/each}

			{#if activeObj}
				<Popup lnglat={[activeObj.lng, activeObj.lat]} offset={16} onclose={() => (activePopup = null)}>
					<div class="space-y-2 text-sm">
						<div class="font-medium">{activeObj.adresse}</div>
						<div class="text-muted-foreground">
							{activeObj.zimmer} Zi · {activeObj.flaeche} m² · {activeObj.kaltmiete.toLocaleString(
								'de-DE',
								{
									style: 'currency',
									currency: 'EUR',
								},
							)}
						</div>
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						<a
							href={resolveDynamicHref(`${basePath}/${activeObj.id}`)}
							class={buttonVariants({ variant: 'outline', size: 'sm' })}
							data-sveltekit-preload-data
						>
							Details
						</a>
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</div>
				</Popup>
			{/if}
		</MapLibre>
	</div>
</div>

<style>
	:global(.maplibregl-marker) {
		pointer-events: auto;
		z-index: 3;
	}

	.map-marker {
		display: block;
		width: 18px;
		height: 18px;
		cursor: pointer;
		border: 2px solid #ffffff;
		border-radius: 9999px;
		background: #008b7d;
		box-shadow: 0 2px 8px rgb(0 0 0 / 0.25);
	}

	.map-marker:hover,
	.map-marker:focus-visible {
		background: #006f65;
		outline: 2px solid #0f766e;
		outline-offset: 2px;
	}
</style>
