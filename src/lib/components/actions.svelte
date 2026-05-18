<script lang="ts">
import { CommandIcon, EllipsisIcon } from '@lucide/svelte';
import { enhance } from '$app/forms';
import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
import { Button } from '$lib/components/ui/button/index.js';
import * as Dialog from '$lib/components/ui/dialog/index.js';
import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { Spinner } from '$lib/components/ui/spinner/index.js';
import Textarea from '$ui/textarea/textarea.svelte';

let {
	ids,
	title,
	description,
	floating = false,
	entitySingular = 'project',
	entityPlural = 'projects',
	idFieldName = 'threadId',
	deleteAction = '/projects?/deleteProject',
	editAction = '/projects?/renameProject',
}: {
	ids: string[];
	title?: string;
	description?: string;
	floating?: boolean;
	entitySingular?: string;
	entityPlural?: string;
	idFieldName?: string;
	deleteAction?: string;
	editAction?: string;
} = $props();
const isSingle = $derived(ids.length === 1);

let deleteDialogOpen = $state(false);
let deleting = $state(false);

let renameDialogOpen = $state(false);
let renaming = $state(false);
let renameValue = $state('');
let descriptionValue = $state('');

function openRenameDialog() {
	renameValue = title ?? '';
	descriptionValue = description ?? '';
	renameDialogOpen = true;
}

function capitalize(s: string) {
	return s.charAt(0).toUpperCase() + s.slice(1);
}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			{#if floating}
				<Button {...props} variant="ghost" size="sm" class="rounded-full px-4 hover:bg-muted">
					<CommandIcon class="mr-2 size-4" /> Actions
				</Button>
			{:else}
				<Button {...props} variant="ghost" size="icon" class="relative size-8 p-0">
					<span class="sr-only">Open menu</span>
					<EllipsisIcon />
				</Button>
			{/if}
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Label>{isSingle ? 'Actions' : `${ids.length} selected`}</DropdownMenu.Label>
			{#if isSingle}
				<DropdownMenu.Item onclick={() => navigator.clipboard.writeText(ids[0])}>
					Copy ID
				</DropdownMenu.Item>
			{/if}
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Item
			class="text-destructive focus:text-destructive"
			onclick={() => (deleteDialogOpen = true)}
		>
			{isSingle
				? `Delete ${capitalize(entitySingular)}`
				: `Delete ${ids.length} ${capitalize(entityPlural)}`}
		</DropdownMenu.Item>
		{#if isSingle}
			<DropdownMenu.Item onclick={openRenameDialog}>
				Edit {capitalize(entitySingular)}
			</DropdownMenu.Item>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Delete dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>
				Delete {isSingle ? entitySingular : `${ids.length} ${entityPlural}`}?
			</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone.
				{isSingle ? `This ${entitySingular}` : `These ${ids.length} ${entityPlural}`} and all associated
				data will be permanently deleted.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={deleting}>Cancel</AlertDialog.Cancel>
			<form
				method="POST"
				use:enhance={() => {
					deleting = true;
					return async ({ update }) => {
						await update();
						deleting = false;
					};
				}}
			>
				{#each ids as id (id)}
					<input type="hidden" name={idFieldName} value={id} />
				{/each}
				<Button
					type="submit"
					variant="destructive"
					disabled={deleting}
					formaction={deleteAction}
				>
					{#if deleting}
						<Spinner class="mr-2" /> Deleting...
					{:else}
						Delete
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- Rename dialog -->
<Dialog.Root bind:open={renameDialogOpen}>
	<Dialog.Content class="sm:max-w-sm">
		<form
			method="POST"
			use:enhance={() => {
				renaming = true;
				return async ({ update }) => {
					await update();
					renaming = false;
					renameDialogOpen = false;
				};
			}}
		>
			<input type="hidden" name={idFieldName} value={ids[0]} />
			<Dialog.Header>
				<Dialog.Title>Edit {entitySingular}</Dialog.Title>
			</Dialog.Header>
			<div class="grid gap-3 py-4">
				<Input
					name="title"
					bind:value={renameValue}
					placeholder="Name"
					disabled={renaming}
					autofocus
				/>
				<Textarea
					name="description"
					bind:value={descriptionValue}
					placeholder="Write a description..."
					disabled={renaming}
				/>
			</div>
			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={renaming}
					onclick={() => (renameDialogOpen = false)}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					disabled={renaming || !renameValue.trim()}
					formaction={editAction}
				>
					{#if renaming}
						<Spinner class="mr-2" /> Saving...
					{:else}
						Save
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
