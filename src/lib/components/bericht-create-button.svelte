<script lang="ts">
	import { enhance } from '$app/forms';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

	let dialogOpen = $state(false);
	let prompt = $state('');
	let submitting = $state(false);
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Trigger class={[buttonVariants({ variant: 'default', size: 'sm' }), 'ms-auto']}>
		<PlusIcon class="size-4" />
		Neuen Bericht erstellen
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-lg">
		<form
			method="POST"
			action="/admin/berichte?/create"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					// On success the action redirects to the detail page; on failure we
					// stop the spinner so the user can retry.
					await update();
					submitting = false;
				};
			}}
		>
			<Dialog.Header>
				<Dialog.Title>Neuen Bericht erstellen</Dialog.Title>
				<Dialog.Description>
					Beschreiben Sie, welchen Bericht Sie erstellen möchten. Der Bericht wird anschließend
					automatisch generiert.
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-2 py-4">
				<Label for="report-prompt">Prompt</Label>
				<Textarea
					id="report-prompt"
					name="prompt"
					required
					rows={5}
					placeholder="z. B. Erstelle eine ausführliche Übersicht aller Mietobjekte und Interessenten."
					bind:value={prompt}
					disabled={submitting}
				/>
			</div>
			<Dialog.Footer>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })} disabled={submitting}>
					Abbrechen
				</Dialog.Close>
				<Button type="submit" disabled={prompt.trim().length === 0 || submitting}>
					{#if submitting}
						<LoaderCircleIcon class="size-4 animate-spin" />
						Wird erstellt…
					{:else}
						<PlusIcon class="size-4" />
						Erstellen
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
