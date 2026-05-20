<script lang="ts">
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
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import UsersIcon from '@lucide/svelte/icons/users';
	import UserIcon from '@lucide/svelte/icons/user';

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

	function formatDate(value: string | Date | null | undefined) {
		if (!value) return '—';
		const d = value instanceof Date ? value : new Date(value);
		return dateFmt.format(d);
	}

	const eckdaten = $derived([
		{ icon: HomeIcon, label: 'Zimmer', value: numberFmt.format(m.zimmer) },
		{
			icon: HomeIcon,
			label: 'Schlafzimmer',
			value: m.bedrooms != null ? numberFmt.format(m.bedrooms) : '—',
		},
		{ icon: RulerIcon, label: 'Wohnfläche', value: `${numberFmt.format(m.flaeche)} m²` },
		{ icon: BuildingIcon, label: 'Etage', value: m.floor ?? '—' },
		{ icon: BuildingIcon, label: 'Einheit', value: m.unit ?? '—' },
		{ icon: UsersIcon, label: 'Max. Bewohner', value: numberFmt.format(m.maxOccupants) },
		{ icon: CalendarIcon, label: 'Verfügbar ab', value: formatDate(m.availableFrom) },
		{
			icon: CalendarIcon,
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

	const merkmale = $derived(
		[
			m.hasKitchen ? 'Einbauküche' : null,
			m.hasBalcony ? 'Balkon' : null,
			m.barrierFree ? 'Barrierefrei' : null,
			m.petsAllowed ? 'Haustiere erlaubt' : null,
		].filter((v): v is string => v !== null),
	);
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
					<Breadcrumb.Link href="/admin/mietobjekte">Mietobjekte</Breadcrumb.Link>
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
		<div class="space-y-2">
			<h1 class="text-2xl font-semibold">{m.adresse}</h1>
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="secondary">{m.zimmer} Zimmer</Badge>
				<Badge variant="secondary">{numberFmt.format(m.flaeche)} m²</Badge>
				{#each merkmale as merkmal (merkmal)}
					<Badge variant="outline">{merkmal}</Badge>
				{/each}
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
					{#each eckdaten as row (row.label)}
						{@const Icon = row.icon}
						<div class="flex items-center gap-3">
							<div class="bg-muted flex size-9 items-center justify-center rounded-md">
								<Icon class="size-4" />
							</div>
							<div>
								<div class="text-muted-foreground text-xs">{row.label}</div>
								<div class="text-sm font-medium">{row.value}</div>
							</div>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Kosten</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 sm:grid-cols-2">
					{#each kostenliste as row (row.label)}
						<div class="flex items-center gap-3">
							<div class="bg-muted flex size-9 items-center justify-center rounded-md">
								<EuroIcon class="size-4" />
							</div>
							<div>
								<div class="text-muted-foreground text-xs">{row.label}</div>
								<div class="text-sm font-medium">{row.value}</div>
							</div>
						</div>
					{/each}
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

		<div class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Vermieter</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="flex items-center gap-3">
						<div class="bg-muted flex size-9 items-center justify-center rounded-full">
							<UserIcon class="size-4" />
						</div>
						<div class="text-sm font-medium">{m.vermieter ?? '—'}</div>
					</div>
				</Card.Content>
				<Card.Footer class="text-muted-foreground text-xs">
					Erstellt am {formatDate(m.createdAt)}
				</Card.Footer>
			</Card.Root>
		</div>
	</div>
</div>
