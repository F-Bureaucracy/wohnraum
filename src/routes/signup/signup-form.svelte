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
		toast.error(result.error.message ?? 'Unerwarteter Fehler');
	},
});
const { form: formData, enhance } = form;
</script>

<form class={cn('flex flex-col gap-6')} method="POST" use:enhance>
	<div class="flex flex-col items-center gap-1 text-center">
		<h1 class="text-2xl font-bold">Konto erstellen</h1>
		<p class="text-sm text-balance text-muted-foreground">
			Füllen Sie das Formular unten aus, um Ihr Konto zu erstellen
		</p>
	</div>

	<Form.Field {form} name="name">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Vollständiger Name</Form.Label>
				<Input {...props} bind:value={$formData.name} type="text" placeholder="Max Mustermann" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>E-Mail</Form.Label>
				<Input {...props} bind:value={$formData.email} type="email" placeholder="m@example.com" />
			{/snippet}
		</Form.Control>
		<Form.Description>
			Wir verwenden diese, um Sie zu kontaktieren. Wir geben Ihre E-Mail-Adresse nicht weiter.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Passwort</Form.Label>
				<Input {...props} bind:value={$formData.password} type="password" />
			{/snippet}
		</Form.Control>
		<Form.Description>Muss mindestens 12 Zeichen lang sein.</Form.Description>
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

	<Form.Button type="submit">Konto erstellen</Form.Button>

	<p class="px-6 text-center text-sm text-muted-foreground">
		Sie haben bereits ein Konto? <a
			href="/login"
			class="underline underline-offset-4 hover:text-primary">Anmelden</a
		>
	</p>
</form>

