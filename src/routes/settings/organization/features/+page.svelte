<script lang="ts">
	import { enhance } from '$app/forms';
	import { tick } from 'svelte';
	import { ChevronLeftIcon } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { MediaQuery } from 'svelte/reactivity';
	import { FEATURES } from '$lib/features';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { PageData } from './$types';

	const isWide = new MediaQuery('(min-width: 1024px)');

	let { data }: { data: PageData } = $props();

	// Optimistic local copy of the flags; the server is updated on each toggle.
	let enabled = $state<Record<string, boolean>>({ ...data.features });
	let formEls: HTMLFormElement[] = $state([]);

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
		</div>
	</div>
</div>
