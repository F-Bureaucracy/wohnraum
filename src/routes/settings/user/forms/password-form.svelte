<script lang="ts">
import { Loader2Icon } from '@lucide/svelte';
import * as Card from '$lib/components/ui/card/index.js';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { type PasswordFormSchema, passwordSchema } from '../schema';
import { notify } from '$lib/notify';

let { form: initialForm }: { form: SuperValidated<Infer<PasswordFormSchema>> } = $props();

const form = superForm(initialForm, {
	validators: zod4Client(passwordSchema),
	onUpdated: ({ form }) => notify(form),
});
const { form: formData, enhance, submitting } = form;
</script>

<div class="grid gap-x-8 gap-y-3 md:grid-cols-3">
	<div class="md:pt-1">
		<h2 class="text-base font-semibold">Passwort</h2>
		<p class="mt-1 text-sm text-muted-foreground">Wählen Sie ein neues Passwort für die Anmeldung per E-Mail.</p>
	</div>
	<Card.Root class="md:col-span-2">
		<form method="POST" action="?/updatePassword" use:enhance>
			<Card.Content class="space-y-4">
			<Form.Field {form} name="currentPassword">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Aktuelles Passwort</Form.Label>
						<Input {...props} type="password" bind:value={$formData.currentPassword} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="newPassword">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Neues Passwort</Form.Label>
						<Input {...props} type="password" bind:value={$formData.newPassword} />
					{/snippet}
				</Form.Control>
				<Form.Description>Muss mindestens 12 Zeichen lang sein.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="confirmPassword">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Neues Passwort bestätigen</Form.Label>
						<Input {...props} type="password" bind:value={$formData.confirmPassword} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</Card.Content>
		<Card.Footer class="justify-end">
			<Form.Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Loader2Icon class="h-4 w-4 animate-spin" />
				{:else}
					Passwort speichern
				{/if}
			</Form.Button>
		</Card.Footer>
		</form>
	</Card.Root>
</div>
