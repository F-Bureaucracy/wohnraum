<script lang="ts">
import { ChevronLeftIcon } from '@lucide/svelte';
import PlusIcon from '@lucide/svelte/icons/plus';
import PencilIcon from '@lucide/svelte/icons/pencil';
import Trash2Icon from '@lucide/svelte/icons/trash-2';
import { MediaQuery } from 'svelte/reactivity';
import { superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { enhance as formEnhance } from '$app/forms';
import { toast } from 'svelte-sonner';
import * as Dialog from '$lib/components/ui/dialog/index.js';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { Switch } from '$lib/components/ui/switch/index.js';
import { Button } from '$lib/components/ui/button/index.js';
import { Badge } from '$lib/components/ui/badge/index.js';
import { filterSchema } from './schema';
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

const isWide = new MediaQuery('(min-width: 1024px)');

let dialogOpen = $state(false);
let editingKey = $state('');

const form = superForm(data.filterForm, {
	validators: zod4Client(filterSchema),
	dataType: 'json',
	resetForm: false,
	onUpdated: ({ form }) => {
		if (form.valid) {
			dialogOpen = false;
			if (form.message) toast.success(form.message);
		} else if (form.message) {
			toast.error(form.message);
		}
	},
});
const { form: formData, enhance, submitting } = form;

function openCreate() {
	editingKey = '';
	$formData.key = '';
	$formData.label = '';
	$formData.mieterLabel = '';
	$formData.appliesToMietobjekt = true;
	$formData.appliesToMieter = false;
	dialogOpen = true;
}

function openEdit(f: PageData['filters'][number]) {
	editingKey = f.key;
	$formData.key = f.key;
	$formData.label = f.label;
	$formData.mieterLabel = f.mieterLabel ?? '';
	$formData.appliesToMietobjekt = f.appliesToMietobjekt;
	$formData.appliesToMieter = f.appliesToMieter;
	dialogOpen = true;
}
</script>

<div class="flex h-full flex-col">
	<header class="flex h-14 shrink-0 items-center gap-3 border-b px-6">
		{#if !isWide.current}
			<a href="/settings" class="text-muted-foreground transition-colors hover:text-foreground">
				<ChevronLeftIcon class="h-5 w-5" />
			</a>
		{/if}
		<h1 class="text-base font-semibold">Filter</h1>
	</header>
	<div class="flex-1 overflow-auto p-6">
		<div class="max-w-2xl space-y-4">
			<div class="flex items-start justify-between gap-4">
				<p class="text-muted-foreground text-sm">
					Merkmale, mit denen Wohnungen und Mietende für die Vermittlung gefiltert und
					abgeglichen werden. Grunddaten wie Miete oder Fläche sind fest und hier nicht
					aufgeführt.
				</p>
				<Button size="sm" onclick={openCreate}>
					<PlusIcon class="size-4" />
					Neuer Filter
				</Button>
			</div>

			{#if data.filters.length === 0}
				<div class="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
					Noch keine Filter angelegt.
				</div>
			{:else}
				<ul class="divide-y rounded-lg border">
					{#each data.filters as f (f.key)}
						<li class="flex items-center justify-between gap-3 p-3">
							<div class="min-w-0">
								<div class="truncate text-sm font-medium">{f.label}</div>
								<div class="mt-1 flex flex-wrap gap-1.5">
									{#if f.appliesToMietobjekt}
										<Badge variant="secondary">Wohnungen</Badge>
									{/if}
									{#if f.appliesToMieter}
										<Badge variant="secondary">
											Mietende{f.mieterLabel ? `: ${f.mieterLabel}` : ''}
										</Badge>
									{/if}
								</div>
							</div>
							<div class="flex shrink-0 items-center gap-1">
								<Button variant="ghost" size="icon" onclick={() => openEdit(f)} title="Bearbeiten">
									<PencilIcon class="size-4" />
								</Button>
								<form method="POST" action="?/deleteFilter" use:formEnhance>
									<input type="hidden" name="key" value={f.key} />
									<Button
										type="submit"
										variant="ghost"
										size="icon"
										title="Löschen"
										class="text-destructive hover:text-destructive"
									>
										<Trash2Icon class="size-4" />
									</Button>
								</form>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{editingKey ? 'Filter bearbeiten' : 'Neuer Filter'}</Dialog.Title>
			<Dialog.Description>
				Bestimmen Sie die Bezeichnung und in welchen Bereichen der Filter erscheint.
			</Dialog.Description>
		</Dialog.Header>
		<form method="POST" action="?/saveFilter" use:enhance class="space-y-4">
			<input type="hidden" name="key" bind:value={$formData.key} />
			<Form.Field {form} name="label">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Bezeichnung</Form.Label>
						<Input {...props} bind:value={$formData.label} placeholder="z. B. Aufzug" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field
				{form}
				name="appliesToMietobjekt"
				class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2"
			>
				<Form.Control>
					{#snippet children({ props })}
						<div class="space-y-0.5">
							<Form.Label>Wohnungen</Form.Label>
							<p class="text-muted-foreground text-xs">Erscheint im Wohnungsformular und -filter.</p>
						</div>
						<Switch {...props} bind:checked={$formData.appliesToMietobjekt} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors class="col-span-2" />
			</Form.Field>

			<Form.Field
				{form}
				name="appliesToMieter"
				class="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2"
			>
				<Form.Control>
					{#snippet children({ props })}
						<div class="space-y-0.5">
							<Form.Label>Mietende</Form.Label>
							<p class="text-muted-foreground text-xs">Erscheint im Mietenden-Profil und -filter.</p>
						</div>
						<Switch {...props} bind:checked={$formData.appliesToMieter} />
					{/snippet}
				</Form.Control>
			</Form.Field>

			{#if $formData.appliesToMieter}
				<Form.Field {form} name="mieterLabel">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>
								Bezeichnung für Mietende <span class="text-muted-foreground">(optional)</span>
							</Form.Label>
							<Input
								{...props}
								bind:value={$formData.mieterLabel}
								placeholder={$formData.label ? `${$formData.label} benötigt` : 'z. B. Aufzug benötigt'}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>
					Abbrechen
				</Button>
				<Form.Button type="submit" disabled={$submitting}>
					{editingKey ? 'Speichern' : 'Erstellen'}
				</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
