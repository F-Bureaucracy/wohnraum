<script lang="ts">
import TrashIcon from "@lucide/svelte/icons/trash-2";
import { enhance } from "$app/forms";
import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
import { Spinner } from "$lib/components/ui/spinner/index.js";

let {
	action,
	id,
	idFieldName,
	entityLabel,
	name,
	label = "Löschen",
}: {
	action: string;
	id: string;
	idFieldName: string;
	entityLabel: string;
	name?: string;
	label?: string;
} = $props();

let open = $state(false);
let deleting = $state(false);
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Trigger class={buttonVariants({ variant: "outline", size: "sm" })}>
		<TrashIcon class="size-4" />
		{label}
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Wirklich löschen?</AlertDialog.Title>
			<AlertDialog.Description>
				Möchten Sie {entityLabel}{name ? ` „${name}“` : ""} wirklich löschen? Diese Aktion kann nicht
				rückgängig gemacht werden.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={deleting}>Abbrechen</AlertDialog.Cancel>
			<form
				method="POST"
				{action}
				use:enhance={() => {
					deleting = true;
					return async ({ update }) => {
						await update();
						deleting = false;
					};
				}}
			>
				<input type="hidden" name={idFieldName} value={id} />
				<Button type="submit" variant="destructive" disabled={deleting}>
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
