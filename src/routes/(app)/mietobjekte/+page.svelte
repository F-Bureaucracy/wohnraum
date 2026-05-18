<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { MapLibre, Marker, Popup } from 'svelte-maplibre-gl';
	import DataTable from '$lib/components/data-table.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import { mietobjekteColumns } from '$lib/components/columns-mietobjekte';
	import { mietobjekte as data } from '$lib/data/mietobjekte';

	let activePopup: string | null = $state(null);
</script>

<PageHeader title="Mietobjekte" />
<div class="flex flex-1 gap-4 p-4 pt-0">
	<div class="min-w-0 flex-1">
		<DataTable
			columns={mietobjekteColumns}
			{data}
			filterColumnId="adresse"
			filterPlaceholder="Mietobjekt suchen..."
			entitySingular="Mietobjekt"
			entityPlural="Mietobjekte"
			idFieldName="mietobjektId"
			deleteAction="/mietobjekte?/deleteMietobjekt"
			editAction="/mietobjekte?/updateMietobjekt"
		/>
	</div>
	<div class="w-[420px] shrink-0 overflow-hidden rounded-md border">
		<MapLibre
			class="h-full w-full"
			style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
			center={{ lng: 8.0473, lat: 52.2799 }}
			zoom={12}
		>
			{#each data as obj (obj.id)}
				<Marker lnglat={{ lng: obj.lng, lat: obj.lat }} onclick={() => (activePopup = obj.id)}>
					{#if activePopup === obj.id}
						<Popup offset={24} onclose={() => (activePopup = null)}>
							<div class="space-y-1 text-sm">
								<div class="font-medium">{obj.adresse}</div>
								<div class="text-muted-foreground">
									{obj.zimmer} Zi · {obj.flaeche} m² · {obj.kaltmiete.toLocaleString('de-DE', {
										style: 'currency',
										currency: 'EUR',
									})}
								</div>
							</div>
						</Popup>
					{/if}
				</Marker>
			{/each}
		</MapLibre>
	</div>
</div>
