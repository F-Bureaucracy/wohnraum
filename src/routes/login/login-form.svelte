<script lang="ts">
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { cn } from '$lib/utils.js';
import { type FormSchema, loginSchema } from './schema.ts';
import { toast } from 'svelte-sonner';

let { data }: { data: { form: SuperValidated<Infer<FormSchema>> } } = $props();

const form = superForm(data.form, {
	validators: zod4Client(loginSchema),
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
		<h1 class="text-2xl font-bold">Login to your account</h1>
		<p class="text-sm text-balance text-muted-foreground">
			Enter your email below to login to your account
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

	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<div class="flex items-center">
					<Form.Label>Password</Form.Label>
					<a href="/password-reset" class="ms-auto text-sm underline-offset-4 hover:underline">
						Forgot your password?
					</a>
				</div>
				<Input {...props} bind:value={$formData.password} type="password" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button type="submit">Login</Form.Button>

	<p class="px-6 text-center text-sm text-muted-foreground">
		Don't have an account?
		<a href="/signup" class="underline underline-offset-4 hover:text-primary">Sign up</a>
	</p>
</form>

