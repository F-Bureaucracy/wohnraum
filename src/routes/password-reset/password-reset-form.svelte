<script lang="ts">
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { cn } from '$lib/utils.js';
import { type FormSchema, passwordResetSchema } from './schema';
import { toast } from 'svelte-sonner';

let { data }: { data: { form: SuperValidated<Infer<FormSchema>> } } = $props();

const form = superForm(data.form, {
	validators: zod4Client(passwordResetSchema),
	onUpdated: ({ form }) => {
		if (!form.message) return;
		if (form.valid) {
			toast.success(form.message);
		} else {
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
		<h1 class="text-2xl font-bold">Reset your password</h1>
		<p class="text-sm text-balance text-muted-foreground">
			Enter the email associated with your account and we'll send you a reset link.
		</p>
	</div>

	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} bind:value={$formData.email} type="email" placeholder="m@example.com" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button type="submit">Send reset link</Form.Button>

	<p class="px-6 text-center text-sm text-muted-foreground">
		Remembered it?
		<a href="/login" class="underline underline-offset-4 hover:text-primary">Back to login</a>
	</p>
</form>
