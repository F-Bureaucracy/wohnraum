<script lang="ts">
import { CommandIcon, EllipsisIcon } from '@lucide/svelte';
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
import { Button } from '$lib/components/ui/button/index.js';
import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
import { Spinner } from '$lib/components/ui/spinner/index.js';

let {
	ids,
	floating = false,
	entitySingular = 'Eintrag',
	entityPlural = 'Einträge',
	idFieldName = 'id',
	deleteAction,
	editHref,
}: {
	ids: string[];
	floating?: boolean;
	entitySingular?: string;
	entityPlural?: string;
	idFieldName?: string;
	deleteAction?: string;
	/** Link to the detail page in edit mode; reuses the working edit form there. */
	editHref?: string;
} = $props();
const isSingle = $derived(ids.length === 1);

let deleteDialogOpen = $state(false);
let deleting = $state(false);

const resolveDynamicHref = resolve as unknown as (href: string) => string;
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			{#if floating}
				<Button {...props} variant="ghost" size="sm" class="rounded-full px-4 hover:bg-muted">
					<CommandIcon class="mr-2 size-4" /> Aktionen
				</Button>
			{:else}
				<Button {...props} variant="ghost" size="icon" class="relative size-8 p-0">
					<span class="sr-only">Menü öffnen</span>
					<EllipsisIcon />
				</Button>
			{/if}
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Label>
				{isSingle ? 'Aktionen' : `${ids.length} ausgewählt`}
			</DropdownMenu.Label>
			{#if isSingle}
				<DropdownMenu.Item onclick={() => navigator.clipboard.writeText(ids[0])}>
					ID kopieren
				</DropdownMenu.Item>
				{#if editHref}
					<DropdownMenu.Item onclick={() => goto(resolveDynamicHref(editHref))}>
						{entitySingular} bearbeiten
					</DropdownMenu.Item>
				{/if}
			{/if}
		</DropdownMenu.Group>
		{#if deleteAction}
			<DropdownMenu.Separator />
			<DropdownMenu.Item
				class="text-destructive focus:text-destructive"
				onclick={() => (deleteDialogOpen = true)}
			>
				{isSingle
					? `${entitySingular} löschen`
					: `${ids.length} ${entityPlural} löschen`}
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Delete dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>
				{isSingle ? entitySingular : `${ids.length} ${entityPlural}`} löschen?
			</AlertDialog.Title>
			<AlertDialog.Description>
				Diese Aktion kann nicht rückgängig gemacht werden.
				{isSingle ? entitySingular : `${ids.length} ${entityPlural}`} und alle zugehörigen Daten werden
				dauerhaft gelöscht.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={deleting}>Abbrechen</AlertDialog.Cancel>
			<form
				method="POST"
				use:enhance={() => {
					deleting = true;
					return async ({ update }) => {
						await update();
						deleting = false;
						deleteDialogOpen = false;
					};
				}}
			>
				{#each ids as id (id)}
					<input type="hidden" name={idFieldName} value={id} />
				{/each}
				<Button type="submit" variant="destructive" disabled={deleting} formaction={deleteAction}>
					{#if deleting}
						<Spinner class="mr-2" /> Wird gelöscht…
					{:else}
						Löschen
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
