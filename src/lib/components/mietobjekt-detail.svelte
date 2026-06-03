<script lang="ts">
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import DetailTable from '$lib/components/detail-table.svelte';
	import UserIcon from '@lucide/svelte/icons/user';
	import { type FilterDefinition, getMietobjektFeatureLabels } from '$lib/matching-flags';
	import type { MietobjektBewohner, MietobjektDetail } from '$lib/server/mietobjekt-mapping';

	let {
		mietobjekt: m,
		filterDefinitions,
		showVermieter = true,
		showBewohner = true,
		bewohner = []
	}: {
		mietobjekt: MietobjektDetail;
		filterDefinitions: FilterDefinition[];
		showVermieter?: boolean;
		showBewohner?: boolean;
		bewohner?: MietobjektBewohner[];
	} = $props();

	const currencyFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
	const numberFmt = new Intl.NumberFormat('de-DE');
	const dateFmt = new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});

	function formatDate(value: string | Date | null | undefined) {
		if (!value) return '—';
		const d = value instanceof Date ? value : new Date(value);
		return dateFmt.format(d);
	}

	const eckdaten = $derived([
		{ label: 'Zimmer', value: numberFmt.format(m.zimmer) },
		{ label: 'Schlafzimmer', value: m.bedrooms != null ? numberFmt.format(m.bedrooms) : '—' },
		{ label: 'Wohnfläche', value: `${numberFmt.format(m.flaeche)} m²` },
		{ label: 'Etage', value: m.floor ?? '—' },
		{ label: 'Einheit', value: m.unit ?? '—' },
		{ label: 'Max. Bewohner', value: numberFmt.format(m.maxOccupants) },
		{ label: 'Verfügbar ab', value: formatDate(m.availableFrom) },
		{
			label: 'Mindestmietdauer',
			value: m.minLeaseMonths != null ? `${m.minLeaseMonths} Monate` : '—',
		},
	]);

	const kostenliste = $derived([
		{ label: 'Kaltmiete', value: currencyFmt.format(m.kaltmiete) },
		{ label: 'Nebenkosten', value: currencyFmt.format(m.nebenkosten) },
		{ label: 'Heizkosten', value: currencyFmt.format(m.heizkosten) },
		{ label: 'Kaution', value: currencyFmt.format(m.kaution) },
	]);

	const meta = $derived(
		`${numberFmt.format(m.zimmer)} Zimmer · ${numberFmt.format(m.flaeche)} m² · Max. ${numberFmt.format(m.maxOccupants)} ${m.maxOccupants === 1 ? 'Person' : 'Personen'}`,
	);
	const merkmale = $derived(getMietobjektFeatureLabels(filterDefinitions, m.features));
</script>

<div class="flex flex-1 flex-col gap-6 p-4 pt-0">
	<div class="flex items-start justify-between gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-semibold">{m.adresse}</h1>
			<p class="text-muted-foreground text-sm">{meta}</p>
			{#if merkmale.length > 0}
				<div class="flex flex-wrap gap-1.5 pt-1">
					{#each merkmale as merkmal (merkmal)}
						<Badge variant="outline" class="font-normal">{merkmal}</Badge>
					{/each}
				</div>
			{/if}
		</div>
		<div class="text-right">
			<div class="text-muted-foreground text-xs">Kaltmiete</div>
			<div class="text-2xl font-semibold">{currencyFmt.format(m.kaltmiete)}</div>
		</div>
	</div>

	{#if m.images && m.images.length > 0}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each m.images as image (image.id)}
				<img
					src={resolve(`/api/mietobjekt-images/${image.id}`)}
					alt={image.fileName}
					class="aspect-[4/3] w-full rounded-md border object-cover"
				/>
			{/each}
		</div>
	{/if}

	<div class="grid gap-4 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">
			<Card.Root>
				<Card.Header>
					<Card.Title>Eckdaten</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-x-10 sm:grid-cols-2">
					<DetailTable rows={eckdaten.slice(0, 4)} />
					<DetailTable rows={eckdaten.slice(4)} />
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Kosten</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-x-10 sm:grid-cols-2">
					<DetailTable rows={kostenliste.slice(0, 2)} />
					<DetailTable rows={kostenliste.slice(2)} />
				</Card.Content>
			</Card.Root>

			{#if m.beschreibung}
				<Card.Root>
					<Card.Header>
						<Card.Title>Beschreibung</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-muted-foreground text-sm leading-relaxed">{m.beschreibung}</p>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>

		<div class="space-y-4 lg:col-span-1">
			{#if showVermieter}
				<Card.Root>
					<Card.Header>
						<Card.Title>Vermieter</Card.Title>
					</Card.Header>
					<Card.Content>
						<a
							href={resolve(`/admin/vermieter/${m.vermieterId}`)}
							class="hover:bg-muted -m-2 flex items-center gap-3 rounded-md p-2 transition-colors"
							data-sveltekit-preload-data
						>
							<div class="bg-muted flex size-9 items-center justify-center rounded-full">
								<UserIcon class="size-4" />
							</div>
							<div class="text-sm font-medium hover:underline">{m.vermieter ?? '—'}</div>
						</a>
					</Card.Content>
					<Card.Footer class="text-muted-foreground text-xs">
						Erstellt am {formatDate(m.createdAt)}
					</Card.Footer>
				</Card.Root>

				{#if showBewohner}
					<Card.Root>
						<Card.Header>
							<Card.Title>Bewohner</Card.Title>
						</Card.Header>
						<Card.Content>
							{#if bewohner.length === 0}
								<p class="text-muted-foreground text-sm">Noch keine Bewohner zugewiesen.</p>
							{:else}
								<ul class="flex flex-col gap-1">
									{#each bewohner as person (person.id)}
										<li>
											<a
													href={resolve(`/admin/mieter/${person.id}`)}
												class="hover:bg-muted -mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors"
												data-sveltekit-preload-data
											>
												<div class="bg-muted flex size-9 items-center justify-center rounded-full">
													<UserIcon class="size-4" />
												</div>
												<div class="text-sm font-medium hover:underline">{person.name}</div>
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
			{:else}
				<Card.Root>
					<Card.Header>
						<Card.Title>Erstellt</Card.Title>
					</Card.Header>
					<Card.Content class="text-muted-foreground text-sm">
						{formatDate(m.createdAt)}
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</div>
</div>
