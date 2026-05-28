<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import DeleteButton from '$lib/components/delete-button.svelte';
	import BookmarkButton from '$lib/components/bookmark-button.svelte';
	import MieterForm from '../new/mieter-form.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		addMieterRequirementSearchParams,
		getMieterRequirementLabels
	} from '$lib/matching-flags';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import HomeSearchIcon from '@lucide/svelte/icons/house';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let editing = $state(false);

	const m = $derived(data.mieter);
	const fullName = $derived(`${m.firstName} ${m.lastName}`);

	const sucheHref = $derived.by(() => {
		const params = new SvelteURLSearchParams();
		addMieterRequirementSearchParams(params, data.filterDefinitions, m.features);
		if (m.maxColdRentCents != null) {
			params.set('kaltmiete_max', String(Math.round(m.maxColdRentCents / 100)));
		}
		if (m.householdSize > 1) params.set('maxOccupants_min', String(m.householdSize));
		const qs = params.toString();
		return qs ? `/admin/mietobjekte?${qs}` : '/admin/mietobjekte';
	});

	const currencyFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
	const dateFmt = new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});

	function formatDate(value: string | Date | null | undefined) {
		if (!value) return '—';
		const d = value instanceof Date ? value : new Date(value);
		return dateFmt.format(d);
	}

	const genderLabels: Record<string, string> = {
		female: 'Weiblich',
		male: 'Männlich',
		diverse: 'Divers',
		unspecified: 'Keine Angabe'
	};

	const kontakt = $derived([
		{ label: 'E-Mail', value: m.email || '—' },
		{ label: 'Telefon', value: m.phone || '—' }
	]);

	const stammdaten = $derived([
		{ label: 'Geburtsdatum', value: formatDate(m.dateOfBirth) },
		{ label: 'Geschlecht', value: m.gender ? (genderLabels[m.gender] ?? m.gender) : '—' },
		{ label: 'Haushaltsgröße', value: `${m.householdSize}` },
		{
			label: 'Max. Kaltmiete',
			value: m.maxColdRentCents != null ? currencyFmt.format(m.maxColdRentCents / 100) : '—'
		},
		{ label: 'Verfügbar ab', value: formatDate(m.availableFrom) }
	]);

	const merkmale = $derived(getMieterRequirementLabels(data.filterDefinitions, m.features));
</script>

<PageHeader title={fullName} parent={{ label: 'Mieter', href: '/admin/mieter' }} />

<div class="flex items-center justify-end gap-2 px-4 pb-2">
	{#if !editing}
		<Button href={sucheHref} size="sm">
			<HomeSearchIcon class="size-4" />
			Passende Wohnung suchen
		</Button>
		<BookmarkButton
			entityType="mieter"
			entityId={m.id}
			bookmarked={data.bookmarked}
			action="?/toggleBookmark"
			variant="outline"
			size="sm"
			label={data.bookmarked ? 'Gemerkt' : 'Merken'}
		/>
		<Button size="sm" variant="outline" onclick={() => (editing = true)}>
			<PencilIcon class="size-4" />
			Bearbeiten
		</Button>
		<DeleteButton
			action="?/deleteMieter"
			id={m.id}
			idFieldName="mieterId"
			entityLabel="den Mieter"
			name={fullName}
		/>
	{/if}
</div>

{#if editing}
	<div class="mx-auto w-full max-w-5xl p-4 md:p-6">
		<MieterForm
			data={{ form: data.form }}
			filterDefinitions={data.filterDefinitions}
			title="Mieter bearbeiten"
			description="Aktualisieren Sie die Angaben zu dieser Person."
			action="?/updateMieter"
			submitLabel="Speichern"
			onCancel={() => (editing = false)}
			onSaved={() => (editing = false)}
		/>
	</div>
{:else}
<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<div class="flex items-start justify-between gap-4">
		<div class="space-y-2">
			<h1 class="text-2xl font-semibold">{fullName}</h1>
			{#if merkmale.length > 0}
				<div class="flex flex-wrap items-center gap-2">
					{#each merkmale as merkmal (merkmal)}
						<Badge variant="outline">{merkmal}</Badge>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="grid gap-4 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">
			<Card.Root>
				<Card.Header>
					<Card.Title>Stammdaten</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 sm:grid-cols-2">
					{#each stammdaten as row (row.label)}
						<div>
							<div class="text-muted-foreground text-xs">{row.label}</div>
							<div class="text-sm font-medium">{row.value}</div>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>

			{#if m.notes}
				<Card.Root>
					<Card.Header>
						<Card.Title>Notizen</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-muted-foreground text-sm leading-relaxed">{m.notes}</p>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>

		<div class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Kontakt</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#each kontakt as row (row.label)}
						<div>
							<div class="text-muted-foreground text-xs">{row.label}</div>
							<div class="text-sm font-medium">{row.value}</div>
						</div>
					{/each}
				</Card.Content>
				<Card.Footer class="text-muted-foreground text-xs">
					Erstellt am {formatDate(m.createdAt)}
				</Card.Footer>
			</Card.Root>
		</div>
	</div>
</div>
{/if}
