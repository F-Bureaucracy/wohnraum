<script lang="ts">
import { Loader2Icon } from '@lucide/svelte';
import * as Avatar from '$lib/components/ui/avatar/index.js';
import * as Card from '$lib/components/ui/card/index.js';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { type ProfileFormSchema, profileSchema } from '../schema';
import { notify } from '$lib/notify';

let {
	form: initialForm,
	email,
}: {
	form: SuperValidated<Infer<ProfileFormSchema>>;
	email: string;
} = $props();

const form = superForm(initialForm, {
	validators: zod4Client(profileSchema),
	resetForm: false,
	onUpdated: ({ form }) => notify(form),
});
const { form: formData, enhance, submitting } = form;

const initials = $derived(
	$formData.name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('') || 'U',
);
</script>

<div class="grid gap-x-8 gap-y-3 md:grid-cols-3">
	<div class="md:pt-1">
		<h2 class="text-base font-semibold">Profile</h2>
		<p class="mt-1 text-sm text-muted-foreground">Update your display name and avatar.</p>
	</div>
	<Card.Root class="md:col-span-2">
		<form method="POST" action="?/updateProfile" use:enhance>
			<Card.Content class="space-y-4">
			<div class="flex items-center gap-4">
				<Avatar.Root size="lg">
					{#if $formData.image}
						<Avatar.Image src={$formData.image} alt={$formData.name} />
					{/if}
					<Avatar.Fallback>{initials}</Avatar.Fallback>
				</Avatar.Root>
				<div class="min-w-0">
					<p class="truncate text-sm font-medium">{$formData.name}</p>
					<p class="truncate text-xs text-muted-foreground">{email}</p>
				</div>
			</div>

			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Name</Form.Label>
						<Input {...props} bind:value={$formData.name} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="image">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Avatar URL</Form.Label>
						<Input
							{...props}
							type="url"
							placeholder="https://example.com/avatar.png"
							bind:value={$formData.image}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>Leave blank to remove your avatar.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		</Card.Content>
		<Card.Footer class="justify-end">
			<Form.Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Loader2Icon class="h-4 w-4 animate-spin" />
				{:else}
					Save profile
				{/if}
			</Form.Button>
		</Card.Footer>
		</form>
	</Card.Root>
</div>
