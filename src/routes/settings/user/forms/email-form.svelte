<script lang="ts">
import { Loader2Icon } from '@lucide/svelte';
import * as Card from '$lib/components/ui/card/index.js';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { type EmailFormSchema, emailSchema } from '../schema';
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { notify } from '$lib/notify';

let { form: initialForm }: { form: SuperValidated<Infer<EmailFormSchema>> } = $props();

const form = superForm(initialForm, {
	validators: zod4Client(emailSchema),
	resetForm: false,
	onUpdated: ({ form }) => notify(form),
});
const { form: formData, enhance, submitting } = form;
</script>

<div class="grid gap-x-8 gap-y-3 md:grid-cols-3">
	<div class="md:pt-1">
		<h2 class="text-base font-semibold">E-Mail</h2>
		<p class="mt-1 text-sm text-muted-foreground">Ändern Sie die für Ihr Konto verwendete E-Mail-Adresse.</p>
	</div>
	<Card.Root class="md:col-span-2">
		<form method="POST" action="?/updateEmail" use:enhance>
			<Card.Content class="space-y-4">
			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>E-Mail</Form.Label>
						<Input {...props} type="email" bind:value={$formData.email} />
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
					E-Mail speichern
				{/if}
			</Form.Button>
		</Card.Footer>
		</form>
	</Card.Root>
</div>
