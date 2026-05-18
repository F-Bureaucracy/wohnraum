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

<Card.Root>
	<Card.Header>
		<Card.Title>Password</Card.Title>
		<Card.Description>Choose a new password for email sign-in.</Card.Description>
	</Card.Header>
	<form method="POST" action="?/updatePassword" use:enhance>
		<Card.Content class="space-y-4">
			<Form.Field {form} name="currentPassword">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Current password</Form.Label>
						<Input {...props} type="password" bind:value={$formData.currentPassword} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="newPassword">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>New password</Form.Label>
						<Input {...props} type="password" bind:value={$formData.newPassword} />
					{/snippet}
				</Form.Control>
				<Form.Description>Must be at least 12 characters long.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="confirmPassword">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Confirm new password</Form.Label>
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
					Save password
				{/if}
			</Form.Button>
		</Card.Footer>
	</form>
</Card.Root>
