<script lang="ts">
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { MapLibre, Marker } from 'svelte-maplibre-gl';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import HomeIcon from '@lucide/svelte/icons/home';
	import RulerIcon from '@lucide/svelte/icons/ruler';
	import EuroIcon from '@lucide/svelte/icons/euro';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import FlameIcon from '@lucide/svelte/icons/flame';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import UserIcon from '@lucide/svelte/icons/user';
	import KeyIcon from '@lucide/svelte/icons/key';

	let { data } = $props();
	const m = $derived(data.mietobjekt);

	const currencyFmt = new Intl.NumberFormat('de-DE', {
		style: 'currency',
		currency: 'EUR',
	});
	const numberFmt = new Intl.NumberFormat('de-DE');
	const dateFmt = new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
</script>

<header
	class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
>
	<div class="flex items-center gap-2 px-4">
		<Sidebar.Trigger class="-ms-1" />
		<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item>
					<Breadcrumb.Link href="/mietobjekte">Mietobjekte</Breadcrumb.Link>
				</Breadcrumb.Item>
				<Breadcrumb.Separator />
				<Breadcrumb.Item>
					<Breadcrumb.Page>{m.adresse}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
</header>

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<div class="flex items-start justify-between gap-4">
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<Button href="/mietobjekte" variant="ghost" size="sm">
					<ArrowLeftIcon class="size-4" />
					Zurück
				</Button>
			</div>
			<h1 class="text-2xl font-semibold">{m.adresse}</h1>
			<div class="flex items-center gap-2">
				<Badge variant="secondary">{m.zimmer} Zimmer</Badge>
				<Badge variant="secondary">{numberFmt.format(m.flaeche)} m²</Badge>
				<Badge variant={m.mieter ? 'default' : 'outline'}>
					{m.mieter ? 'Vermietet' : 'Frei'}
				</Badge>
			</div>
		</div>
		<div class="text-right">
			<div class="text-muted-foreground text-xs">Kaltmiete</div>
			<div class="text-2xl font-semibold">{currencyFmt.format(m.kaltmiete)}</div>
		</div>
	</div>

	<div class="grid gap-4 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">
			<Card.Root>
				<Card.Header>
					<Card.Title>Eckdaten</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 sm:grid-cols-2">
					<DetailRow icon={HomeIcon} label="Zimmer" value={numberFmt.format(m.zimmer)} />
					<DetailRow
						icon={RulerIcon}
						label="Wohnfläche"
						value={`${numberFmt.format(m.flaeche)} m²`}
					/>
					<DetailRow icon={EuroIcon} label="Kaltmiete" value={currencyFmt.format(m.kaltmiete)} />
					<DetailRow
						icon={EuroIcon}
						label="Nebenkosten"
						value={currencyFmt.format(m.nebenkosten)}
					/>
					<DetailRow icon={EuroIcon} label="Kaution" value={currencyFmt.format(m.kaution)} />
					<DetailRow icon={BuildingIcon} label="Etage" value={m.etage} />
					<DetailRow icon={CalendarIcon} label="Baujahr" value={String(m.baujahr)} />
					<DetailRow icon={FlameIcon} label="Heizung" value={m.heizung} />
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Beschreibung</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-muted-foreground text-sm leading-relaxed">{m.beschreibung}</p>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Beteiligte</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					<div class="flex items-center gap-3">
						<div class="bg-muted flex size-9 items-center justify-center rounded-full">
							<UserIcon class="size-4" />
						</div>
						<div>
							<div class="text-muted-foreground text-xs">Vermieter</div>
							<div class="text-sm font-medium">{m.vermieter}</div>
						</div>
					</div>
					<Separator />
					<div class="flex items-center gap-3">
						<div class="bg-muted flex size-9 items-center justify-center rounded-full">
							<KeyIcon class="size-4" />
						</div>
						<div>
							<div class="text-muted-foreground text-xs">Mieter</div>
							<div class="text-sm font-medium">
								{m.mieter ?? 'Aktuell nicht vermietet'}
							</div>
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="overflow-hidden">
				<Card.Header>
					<Card.Title>Lage</Card.Title>
				</Card.Header>
				<div class="h-64 w-full">
					<MapLibre
						class="h-full w-full"
						style="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
						center={{ lng: m.lng, lat: m.lat }}
						zoom={14}
					>
						<Marker lnglat={{ lng: m.lng, lat: m.lat }} />
					</MapLibre>
				</div>
				<Card.Footer class="text-muted-foreground text-xs">
					Erstellt am {dateFmt.format(m.createdAt)}
				</Card.Footer>
			</Card.Root>
		</div>
	</div>
</div>

{#snippet DetailRow(...)}{/snippet}
