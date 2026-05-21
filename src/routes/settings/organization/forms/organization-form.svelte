<script lang="ts">
import { Loader2Icon } from '@lucide/svelte';
import * as Avatar from '$lib/components/ui/avatar/index.js';
import * as Card from '$lib/components/ui/card/index.js';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { type OrganizationFormSchema, organizationSchema } from '../schema';
import { notify } from '$lib/notify';

let {
	form: initialForm,
}: {
	form: SuperValidated<Infer<OrganizationFormSchema>>;
} = $props();

const form = superForm(initialForm, {
	validators: zod4Client(organizationSchema),
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
		.join('') || 'O',
);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>General</Card.Title>
		<Card.Description>Update your organization's name, slug, and logo.</Card.Description>
	</Card.Header>
	<form method="POST" action="?/updateOrganization" use:enhance>
		<Card.Content class="space-y-4">
			<div class="flex items-center gap-4">
				<Avatar.Root size="lg">
					{#if $formData.logo}
						<Avatar.Image src={$formData.logo} alt={$formData.name} />
					{/if}
					<Avatar.Fallback>{initials}</Avatar.Fallback>
				</Avatar.Root>
				<div class="min-w-0">
					<p class="truncate text-sm font-medium">{$formData.name}</p>
					<p class="truncate text-xs text-muted-foreground">{$formData.slug}</p>
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

			<Form.Field {form} name="slug">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Slug</Form.Label>
						<Input {...props} bind:value={$formData.slug} />
					{/snippet}
				</Form.Control>
				<Form.Description>Used in URLs. Lowercase letters, numbers, and hyphens.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="logo">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Logo URL</Form.Label>
						<Input
							{...props}
							type="url"
							placeholder="https://example.com/logo.png"
							bind:value={$formData.logo}
						/>
					{/snippet}
				</Form.Control>
				<Form.Description>Leave blank to remove the logo.</Form.Description>
				<Form.FieldErrors />
			</Form.Field>
		</Card.Content>
		<Card.Footer class="justify-end">
			<Form.Button type="submit" disabled={$submitting}>
				{#if $submitting}
					<Loader2Icon class="h-4 w-4 animate-spin" />
				{:else}
					Save
				{/if}
			</Form.Button>
		</Card.Footer>
	</form>
</Card.Root>
