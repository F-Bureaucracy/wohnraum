<script lang="ts">
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import BuildingIcon from '@lucide/svelte/icons/building';
	import UserIcon from '@lucide/svelte/icons/user';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const dateFmt = new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});

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
</script>

<PageHeader title={data.vermieter.name} parent={{ label: 'Vermieter', href: '/admin/vermieter' }} />

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<div class="grid gap-4 lg:grid-cols-3">
		<div class="space-y-4 lg:col-span-2">
			<Card.Root>
				<Card.Header>
					<Card.Title>Unternehmen</Card.Title>
				</Card.Header>
				<Card.Content class="grid gap-4 sm:grid-cols-2">
					<div class="flex items-center gap-3">
						<div class="bg-muted flex size-9 items-center justify-center rounded-md">
							<BuildingIcon class="size-4" />
						</div>
						<div>
							<div class="text-muted-foreground text-xs">Name</div>
							<div class="text-sm font-medium">{data.vermieter.name}</div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="bg-muted flex size-9 items-center justify-center rounded-md">
							<BuildingIcon class="size-4" />
						</div>
						<div>
							<div class="text-muted-foreground text-xs">Slug</div>
							<div class="text-sm font-medium">{data.vermieter.slug}</div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="bg-muted flex size-9 items-center justify-center rounded-md">
							<BuildingIcon class="size-4" />
						</div>
						<div>
							<div class="text-muted-foreground text-xs">Mietobjekte</div>
							<div class="text-sm font-medium">{data.vermieter.anzahlMietobjekte}</div>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="bg-muted flex size-9 items-center justify-center rounded-md">
							<BuildingIcon class="size-4" />
						</div>
						<div>
							<div class="text-muted-foreground text-xs">Erstellt am</div>
							<div class="text-sm font-medium">{dateFmt.format(data.vermieter.createdAt)}</div>
						</div>
					</div>
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
											<span class="font-medium text-foreground">{note.authorName}</span>
											<span>·</span>
											<span>{dateFmt.format(note.createdAt)}</span>
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
												<form
													method="POST"
													action="?/deleteNote"
													use:enhance
													class="contents"
												>
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
												<Button type="submit" size="sm" disabled={!editValue.trim()}>
													Speichern
												</Button>
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
					<Card.Title>Ansprechpartner</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					{#if data.owners.length === 0}
						<p class="text-muted-foreground text-sm">Keine Inhaber hinterlegt.</p>
					{:else}
						{#each data.owners as owner, i (owner.id)}
							{#if i > 0}<Separator />{/if}
							<div class="flex items-center gap-3">
								<div class="bg-muted flex size-9 items-center justify-center rounded-full">
									<UserIcon class="size-4" />
								</div>
								<div class="min-w-0">
									<div class="truncate text-sm font-medium">{owner.name}</div>
									<a
										href="mailto:{owner.email}"
										class="text-muted-foreground flex items-center gap-1 truncate text-xs hover:underline"
									>
										<MailIcon class="size-3" />
										{owner.email}
									</a>
								</div>
							</div>
						{/each}
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
