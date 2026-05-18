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

<Card.Root>
	<Card.Header>
		<Card.Title>Email</Card.Title>
		<Card.Description>Change the email address used for your account.</Card.Description>
	</Card.Header>
	<form method="POST" action="?/updateEmail" use:enhance>
		<Card.Content class="space-y-4">
			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Email</Form.Label>
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
					Save email
				{/if}
			</Form.Button>
		</Card.Footer>
	</form>
</Card.Root>
