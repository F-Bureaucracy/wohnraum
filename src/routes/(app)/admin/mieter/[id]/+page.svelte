<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/page-header.svelte';
	import DeleteButton from '$lib/components/delete-button.svelte';
	import BookmarkButton from '$lib/components/bookmark-button.svelte';
	import MieterForm from '../new/mieter-form.svelte';
	import DetailTable from '$lib/components/detail-table.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		addMieterRequirementSearchParams,
		getMieterRequirementLabels
	} from '$lib/matching-flags';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import HomeSearchIcon from '@lucide/svelte/icons/house';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let editing = $state(false);

	let newNote = $state('');
	let submitting = $state(false);
	let editingId = $state<string | null>(null);
	let editValue = $state('');

	function startEdit(id: string, body: string) {
		editingId = id;
		editValue = body;
	}

	function cancelEdit() {
		editingId = null;
		editValue = '';
	}

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
	const dateTimeFmt = new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
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
						<Badge variant="outline" class="font-normal">{merkmal}</Badge>
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
				<Card.Content class="grid gap-x-10 sm:grid-cols-2">
					<DetailTable rows={stammdaten.slice(0, 3)} />
					<DetailTable rows={stammdaten.slice(3)} />
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header>
					<Card.Title>Notizen</Card.Title>
					<Card.Description>
						Alle Admins können alle Notizen sehen. Du kannst nur deine eigenen Notizen bearbeiten oder
						löschen.
					</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<form
						method="POST"
						action="?/createNote"
						use:enhance={() => {
							submitting = true;
							return async ({ update }) => {
								await update();
								submitting = false;
								newNote = '';
							};
						}}
						class="space-y-2"
					>
						<Textarea
							name="body"
							bind:value={newNote}
							placeholder="Neue Notiz hinzufügen..."
							rows={3}
							disabled={submitting}
						/>
						<div class="flex justify-end">
							<Button type="submit" size="sm" disabled={submitting || !newNote.trim()}>
								Notiz speichern
							</Button>
						</div>
					</form>

					{#if data.notes.length > 0}
						<Separator />
						<ul class="space-y-3">
							{#each data.notes as note (note.id)}
								{@const isOwn = note.authorId === data.currentUserId}
								<li class="rounded-md border p-3">
									<div class="mb-2 flex items-center justify-between gap-2">
										<div class="text-muted-foreground flex items-center gap-2 text-xs">
											<span class="text-foreground font-medium">{note.authorName}</span>
											<span>·</span>
											<span>{dateTimeFmt.format(note.createdAt)}</span>
											{#if note.updatedAt.getTime() - note.createdAt.getTime() > 1000}
												<span>· bearbeitet</span>
											{/if}
										</div>
										{#if isOwn && editingId !== note.id}
											<div class="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													class="size-7"
													onclick={() => startEdit(note.id, note.body)}
													aria-label="Bearbeiten"
												>
													<PencilIcon class="size-3.5" />
												</Button>
												<form method="POST" action="?/deleteNote" use:enhance class="contents">
													<input type="hidden" name="noteId" value={note.id} />
													<Button
														type="submit"
														variant="ghost"
														size="icon"
														class="text-destructive hover:text-destructive size-7"
														aria-label="Löschen"
													>
														<TrashIcon class="size-3.5" />
													</Button>
												</form>
											</div>
										{/if}
									</div>
									{#if editingId === note.id}
										<form
											method="POST"
											action="?/updateNote"
											use:enhance={() => {
												return async ({ update }) => {
													await update();
													cancelEdit();
												};
											}}
											class="space-y-2"
										>
											<input type="hidden" name="noteId" value={note.id} />
											<Textarea name="body" bind:value={editValue} rows={3} />
											<div class="flex justify-end gap-2">
												<Button type="button" variant="outline" size="sm" onclick={cancelEdit}>
													Abbrechen
												</Button>
												<Button type="submit" size="sm" disabled={!editValue.trim()}>Speichern</Button>
											</div>
										</form>
									{:else}
										<p class="text-sm whitespace-pre-wrap">{note.body}</p>
									{/if}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-muted-foreground text-sm">Noch keine Notizen.</p>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<div class="space-y-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>Kontakt</Card.Title>
				</Card.Header>
				<Card.Content>
					<DetailTable rows={kontakt} />
				</Card.Content>
				<Card.Footer class="text-muted-foreground text-xs">
					Erstellt am {formatDate(m.createdAt)}
				</Card.Footer>
			</Card.Root>
		</div>
	</div>
</div>
{/if}
