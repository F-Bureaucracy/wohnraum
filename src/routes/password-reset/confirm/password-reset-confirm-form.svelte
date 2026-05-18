<script lang="ts">
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { cn } from '$lib/utils.js';
import { type FormSchema, passwordResetConfirmSchema } from './schema';
import { toast } from 'svelte-sonner';

let { data }: { data: { form: SuperValidated<Infer<FormSchema>> } } = $props();

const form = superForm(data.form, {
	validators: zod4Client(passwordResetConfirmSchema),
	onUpdated: ({ form }) => {
		if (!form.valid && form.message) {
			toast.error(form.message);
		}
	},
	onError: ({ result }) => {
		toast.error(result.error.message ?? 'Unexpected error');
	},
});
const { form: formData, enhance } = form;
</script>

<form class={cn('flex flex-col gap-6')} method="POST" use:enhance>
	<div class="flex flex-col items-center gap-1 text-center">
		<h1 class="text-2xl font-bold">Choose a new password</h1>
		<p class="text-sm text-balance text-muted-foreground">
			Enter a new password for your account.
		</p>
	</div>

	<input type="hidden" name="token" bind:value={$formData.token} />

	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>New password</Form.Label>
				<Input {...props} bind:value={$formData.password} type="password" />
			{/snippet}
		</Form.Control>
		<Form.Description>Must be at least 12 characters long.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button type="submit">Reset password</Form.Button>

	<p class="px-6 text-center text-sm text-muted-foreground">
		<a href="/login" class="underline underline-offset-4 hover:text-primary">Back to login</a>
	</p>
</form>
