<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import MietobjektDetail from '$lib/components/mietobjekt-detail.svelte';
	import BookmarkButton from '$lib/components/bookmark-button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import UserIcon from '@lucide/svelte/icons/user';
	import XIcon from '@lucide/svelte/icons/x';
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import LockIcon from '@lucide/svelte/icons/lock';
	import LockOpenIcon from '@lucide/svelte/icons/lock-open';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedMieterId = $state('');
	let assigning = $state(false);
	let comboOpen = $state(false);
	let reserving = $state(false);

	const reservedByOther = $derived(Boolean(data.reservation && !data.reservation.isCurrentUser));

	const selectedLabel = $derived(
		data.assignableMieter.find((m) => m.id === selectedMieterId)?.name ?? 'Mieter auswählen'
	);
</script>

<PageHeader
	title={data.mietobjekt.adresse}
	parent={{ label: 'Mietobjekte', href: '/admin/mietobjekte' }}
/>
<div class="flex flex-wrap items-center justify-end gap-2 px-4 pb-2">
	{#if data.reservation}
		<div class="text-muted-foreground mr-auto flex items-center gap-2 text-sm">
			<LockIcon class="size-4" />
			<span>
				Reserviert durch {data.reservation.isCurrentUser ? 'Sie' : data.reservation.userName}
			</span>
		</div>
	{:else}
		<div class="text-muted-foreground mr-auto flex items-center gap-2 text-sm">
			<LockOpenIcon class="size-4" />
			<span>Nicht reserviert</span>
		</div>
	{/if}
	{#if data.reservation?.isCurrentUser}
		<form
			method="POST"
			action="?/unreserveMietobjekt"
			use:enhance={() => {
				reserving = true;
				return async ({ update }) => {
					await update();
					reserving = false;
				};
			}}
		>
			<Button type="submit" variant="outline" size="sm" disabled={reserving}>
				<LockOpenIcon class="size-4" />
				Freigeben
			</Button>
		</form>
	{:else if !data.reservation}
		<form
			method="POST"
			action="?/reserveMietobjekt"
			use:enhance={() => {
				reserving = true;
				return async ({ update }) => {
					await update();
					reserving = false;
				};
			}}
		>
			<Button type="submit" variant="outline" size="sm" disabled={reserving}>
				<LockIcon class="size-4" />
				Reservieren
			</Button>
		</form>
	{/if}
	<BookmarkButton
		entityType="mietobjekt"
		entityId={data.mietobjekt.id}
		bookmarked={data.bookmarked}
		action="?/toggleBookmark"
		variant="outline"
		size="sm"
		label={data.bookmarked ? 'Gemerkt' : 'Merken'}
	/>
</div>
{#if form?.reservationError}
	<p class="text-destructive px-4 pb-2 text-sm">{form.reservationError}</p>
{/if}
<MietobjektDetail
	mietobjekt={data.mietobjekt}
	filterDefinitions={data.filterDefinitions}
	bewohner={data.bewohner}
	showBewohner={false}
/>

<div class="flex flex-col gap-4 p-4 pt-0">
	<Card.Root>
		<Card.Header>
			<Card.Title>Bewohner</Card.Title>
			<Card.Description>
				{#if reservedByOther}
					Dieses Mietobjekt ist reserviert. Nur {data.reservation?.userName} kann Mieter zuweisen.
				{:else}
					Mieter dieser Wohnung zuweisen oder entfernen.
				{/if}
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			{#if form?.assignmentError}
				<p class="text-destructive text-sm">{form.assignmentError}</p>
			{/if}
			{#if data.bewohner.length === 0}
				<p class="text-muted-foreground text-sm">Noch keine Bewohner zugewiesen.</p>
			{:else}
				<ul class="flex flex-col gap-1">
					{#each data.bewohner as person (person.id)}
						<li class="hover:bg-muted -mx-2 flex items-center gap-3 rounded-md px-2 py-1.5">
							<a
								href={resolve('/(app)/admin/mieter/[id]', { id: person.id })}
								class="flex flex-1 items-center gap-3"
								data-sveltekit-preload-data
							>
								<div class="bg-muted flex size-9 items-center justify-center rounded-full">
									<UserIcon class="size-4" />
								</div>
								<div class="text-sm font-medium hover:underline">{person.name}</div>
							</a>
							<form method="POST" action="?/unassignMieter" use:enhance>
								<input type="hidden" name="mieterId" value={person.id} />
								<Button
									type="submit"
									variant="ghost"
									size="icon"
									aria-label="Zuweisung entfernen"
									title="Zuweisung entfernen"
								>
									<XIcon class="size-4" />
								</Button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}

			<form
				method="POST"
				action="?/assignMieter"
				class="flex items-end gap-2 border-t pt-4"
				use:enhance={() => {
					assigning = true;
					return async ({ update }) => {
						await update();
						selectedMieterId = '';
						assigning = false;
					};
				}}
			>
				<input type="hidden" name="mieterId" value={selectedMieterId} />
				<div class="flex-1">
					<Popover.Root bind:open={comboOpen}>
						<Popover.Trigger
							class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 {selectedMieterId
								? ''
								: 'text-muted-foreground'}"
							disabled={data.assignableMieter.length === 0 || reservedByOther}
						>
							{selectedLabel}
							<ChevronsUpDownIcon class="size-4 opacity-50" />
						</Popover.Trigger>
						<Popover.Content class="w-(--bits-popover-anchor-width) p-0" align="start">
							<Command.Root>
								<Command.Input placeholder="Mieter suchen…" />
								<Command.List>
									<Command.Empty>Kein Mieter gefunden.</Command.Empty>
									<Command.Group>
										{#each data.assignableMieter as m (m.id)}
											<Command.Item
												value="{m.name} {m.id}"
												onSelect={() => {
													selectedMieterId = m.id;
													comboOpen = false;
												}}
											>
												<UserIcon class="size-4 opacity-60" />
												<span class="flex-1">{m.name}</span>
												{#if m.bookmarked}
													<BookmarkIcon class="size-4 fill-current" />
												{/if}
											</Command.Item>
										{/each}
									</Command.Group>
								</Command.List>
							</Command.Root>
						</Popover.Content>
					</Popover.Root>
				</div>
				<Button type="submit" disabled={!selectedMieterId || assigning || reservedByOther}>
					Zuweisen
				</Button>
			</form>
			{#if data.assignableMieter.length === 0}
				<p class="text-muted-foreground text-xs">Keine zuweisbaren Mieter verfügbar.</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
