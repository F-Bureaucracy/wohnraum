<script lang="ts">
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { cn } from '$lib/utils.js';
import { type FormSchema, loginSchema } from './schema.ts';
import { toast } from 'svelte-sonner';
import { authClient } from '$lib/auth-client';
import { Button } from '$lib/components/ui/button/index.js';

async function signInWithFbau() {
	const { error } = await authClient.signIn.oauth2({
		providerId: 'fbau',
		callbackURL: '/',
	});
	if (error) toast.error(error.message ?? 'OAuth-Anmeldung fehlgeschlagen');
}

let { data }: { data: { form: SuperValidated<Infer<FormSchema>> } } = $props();

const form = superForm(data.form, {
	validators: zod4Client(loginSchema),
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
		<h1 class="text-2xl font-bold">Bei Ihrem Konto anmelden</h1>
		<p class="text-sm text-balance text-muted-foreground">
			Geben Sie unten Ihre E-Mail-Adresse ein, um sich anzumelden
		</p>
	</div>

	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>E-Mail</Form.Label>
				<Input {...props} bind:value={$formData.email} type="email" placeholder="m@example.com" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="password">
		<Form.Control>
			{#snippet children({ props })}
				<div class="flex items-center">
					<Form.Label>Passwort</Form.Label>
					<a href="/password-reset" class="ms-auto text-sm underline-offset-4 hover:underline">
						Passwort vergessen?
					</a>
				</div>
				<Input {...props} bind:value={$formData.password} type="password" />
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button type="submit">Anmelden</Form.Button>

	<!-- <div class="relative text-center text-sm"> -->
	<!-- 	<span class="bg-background relative z-10 px-2 text-muted-foreground">Oder fortfahren mit</span> -->
	<!-- 	<div class="absolute inset-0 top-1/2 border-t"></div> -->
	<!-- </div> -->
	<!---->
	<!-- <Button type="button" variant="outline" onclick={signInWithFbau}> -->
	<!-- 	Mit f-bau fortfahren -->
	<!-- </Button> -->

	<p class="px-6 text-center text-sm text-muted-foreground">
		Noch kein Konto?
		<a href="/signup" class="underline underline-offset-4 hover:text-primary">Registrieren</a>
	</p>
</form>

