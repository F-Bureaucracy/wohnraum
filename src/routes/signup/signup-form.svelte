<script lang="ts">
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { Button } from '$lib/components/ui/button/index.js';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { cn } from '$lib/utils.js';
import { type FormSchema, signupSchema } from './schema';
import { toast } from 'svelte-sonner';

let { data }: { data: { form: SuperValidated<Infer<FormSchema>> } } = $props();

const form = superForm(data.form, {
	validators: zod4Client(signupSchema),
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
		<h1 class="text-2xl font-bold">Create your account</h1>
		<p class="text-sm text-balance text-muted-foreground">
			Fill in the form below to create your account
		</p>
	</div>

	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Full Name</Form.Label>
				<Input {...props} bind:value={$formData.name} type="text" placeholder="John Doe" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Email</Form.Label>
				<Input {...props} bind:value={$formData.email} type="email" placeholder="m@example.com" />
			{/snippet}
		</Form.Control>
		<Form.Description>
			We'll use this to contact you. We will not share your email with anyone else.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Password</Form.Label>
				<Input {...props} bind:value={$formData.password} type="password" />
			{/snippet}
		</Form.Control>
		<Form.Description>Must be at least 12 characters long.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<!-- <Form.Field {form} name="confirmPassword"> -->
	<!--         <Form.Control> -->
	<!--     {#snippet children({ props })} -->
	<!--                 <Form.Label>Confirm Password</Form.Label> -->
	<!--                 <Input {...props} bind:value={$formData.confirmPassword} type="password" /> -->
	<!--             {/snippet} -->
	<!--         </Form.Control> -->
	<!--         <Form.Description>Please confirm your password.</Form.Description> -->
	<!--         <Form.FieldErrors /> -->
	<!-- </Form.Field> -->

	<Form.Button type="submit">Create Account</Form.Button>

	<p class="px-6 text-center text-sm text-muted-foreground">
		Already have an account? <a
			href="/login"
			class="underline underline-offset-4 hover:text-primary">Log in</a
		>
	</p>
</form>

