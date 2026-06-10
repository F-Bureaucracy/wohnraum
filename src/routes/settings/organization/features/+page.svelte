<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { ChevronLeftIcon } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { MediaQuery } from 'svelte/reactivity';
	import { DEMO_IMPORT_FEATURE, FEATURES } from '$lib/features';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { PageData } from './$types';

	const isWide = new MediaQuery('(min-width: 1024px)');

	let { data }: { data: PageData } = $props();

	// Optimistic local copy of the flags; the server is updated on each toggle.
	let enabled = $state<Record<string, boolean>>({ ...data.features });
	let formEls: HTMLFormElement[] = $state([]);

	const demo = data.demoListing ?? {};
	let savingDemo = $state(false);
	// Comma is the locale decimal separator the server parser expects.
	const numStr = (v: number | undefined) =>
		v === undefined ? '' : String(v).replace('.', ',');

	async function toggle(key: string, value: boolean, index: number) {
		enabled[key] = value;
		// Wait for the hidden input to reflect the new value before submitting.
		await tick();
		formEls[index]?.requestSubmit();
	}
</script>

<div class="flex h-full flex-col">
	<header class="flex h-14 shrink-0 items-center gap-3 border-b px-6">
		{#if !isWide.current}
			<a href="/settings" class="text-muted-foreground transition-colors hover:text-foreground">
				<ChevronLeftIcon class="h-5 w-5" />
			</a>
		{/if}
		<h1 class="text-base font-semibold">Features</h1>
	</header>
	<div class="flex-1 overflow-auto p-6">
		<div class="max-w-2xl space-y-3">
			<p class="text-sm text-muted-foreground">
				Aktivieren oder deaktivieren Sie optionale Funktionen für Ihre Organisation.
			</p>
			{#each FEATURES as feature, index (feature.key)}
				<form
					bind:this={formEls[index]}
					method="POST"
					action="?/toggle"
					class="flex items-start justify-between gap-4 rounded-lg border p-4"
					use:enhance={() => {
						const previous = !enabled[feature.key];
						return async ({ result, update }) => {
							if (result.type === 'failure') {
								// Revert the optimistic toggle on error.
								enabled[feature.key] = previous;
								toast.error('Einstellung konnte nicht gespeichert werden.');
							}
							await update({ reset: false });
						};
					}}
				>
					<input type="hidden" name="key" value={feature.key} />
					<input type="hidden" name="enabled" value={enabled[feature.key] ? 'true' : 'false'} />
					<div class="space-y-1">
						<Label for={`feature-${feature.key}`} class="text-sm font-medium">
							{feature.title}
						</Label>
						<p class="text-sm text-muted-foreground">{feature.description}</p>
					</div>
					<Switch
						id={`feature-${feature.key}`}
						checked={enabled[feature.key] ?? false}
						onCheckedChange={(value) => toggle(feature.key, value, index)}
					/>
				</form>
			{/each}

			{#if enabled[DEMO_IMPORT_FEATURE]}
				<form
					method="POST"
					action="?/saveDemoListing"
					class="space-y-4 rounded-lg border p-4"
					use:enhance={() => {
						savingDemo = true;
						return async ({ result, update }) => {
							savingDemo = false;
							if (result.type === 'failure') {
								toast.error('Demo-Daten konnten nicht gespeichert werden.');
							} else {
								toast.success('Demo-Daten gespeichert.');
							}
							await update({ reset: false });
						};
					}}
				>
					<div class="space-y-1">
						<h2 class="text-sm font-medium">Demo-Daten für den Import</h2>
						<p class="text-sm text-muted-foreground">
							Diese Angaben werden bei aktivem Demo-Import unabhängig vom eingegebenen Link
							übernommen.
						</p>
					</div>

					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div class="space-y-1 sm:col-span-2">
							<Label for="demo-street">Straße</Label>
							<Input id="demo-street" name="street" value={demo.street ?? ''} />
						</div>
						<div class="space-y-1">
							<Label for="demo-houseNumber">Hausnummer</Label>
							<Input id="demo-houseNumber" name="houseNumber" value={demo.houseNumber ?? ''} />
						</div>
						<div class="space-y-1">
							<Label for="demo-postalCode">PLZ</Label>
							<Input id="demo-postalCode" name="postalCode" value={demo.postalCode ?? ''} />
						</div>
						<div class="space-y-1 sm:col-span-2">
							<Label for="demo-city">Stadt</Label>
							<Input id="demo-city" name="city" value={demo.city ?? ''} />
						</div>
						<div class="space-y-1">
							<Label for="demo-livingArea">Wohnfläche (m²)</Label>
							<Input id="demo-livingArea" name="livingArea" value={numStr(demo.livingArea)} />
						</div>
						<div class="space-y-1">
							<Label for="demo-rooms">Zimmer</Label>
							<Input id="demo-rooms" name="rooms" value={numStr(demo.rooms)} />
						</div>
						<div class="space-y-1">
							<Label for="demo-bedrooms">Schlafzimmer</Label>
							<Input id="demo-bedrooms" name="bedrooms" value={numStr(demo.bedrooms)} />
						</div>
						<div class="space-y-1">
							<Label for="demo-coldRent">Kaltmiete (€)</Label>
							<Input id="demo-coldRent" name="coldRent" value={numStr(demo.coldRent)} />
						</div>
						<div class="space-y-1">
							<Label for="demo-operatingCosts">Nebenkosten (€)</Label>
							<Input
								id="demo-operatingCosts"
								name="operatingCosts"
								value={numStr(demo.operatingCosts)}
							/>
						</div>
						<div class="space-y-1">
							<Label for="demo-heatingCosts">Heizkosten (€)</Label>
							<Input id="demo-heatingCosts" name="heatingCosts" value={numStr(demo.heatingCosts)} />
						</div>
						<div class="space-y-1">
							<Label for="demo-deposit">Kaution (€)</Label>
							<Input id="demo-deposit" name="deposit" value={numStr(demo.deposit)} />
						</div>
					</div>

					<div class="space-y-1">
						<Label for="demo-description">Beschreibung</Label>
						<Textarea
							id="demo-description"
							name="description"
							rows={4}
							value={demo.description ?? ''}
						/>
					</div>

					<div class="space-y-1">
						<Label for="demo-imageUrls">Bild-URLs (eine pro Zeile)</Label>
						<Textarea
							id="demo-imageUrls"
							name="imageUrls"
							rows={4}
							placeholder="https://…/foto-1.jpg"
							value={(demo.imageUrls ?? []).join('\n')}
						/>
						<p class="text-xs text-muted-foreground">
							Die Bilder müssen für den Server öffentlich erreichbar sein; sie werden beim Import in
							den eigenen Speicher kopiert.
						</p>
					</div>

					<div class="flex justify-end">
						<Button type="submit" disabled={savingDemo}>Demo-Daten speichern</Button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
