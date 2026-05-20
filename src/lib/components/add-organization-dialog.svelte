<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { buttonVariants } from '$lib/components/ui/button/index.js';
import * as Dialog from '$lib/components/ui/dialog/index.js';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { Spinner } from '$lib/components/ui/spinner/index.js';
import { notify } from '$lib/notify';
import { slugify } from '$lib/utils';
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import {
	type CreateOrganizationSchema,
	createOrganizationSchema,
} from '../../routes/(app)/organizations/schema';


let {
	open = $bindable(false),
	data,
}: {
	open: boolean;
	data: SuperValidated<Infer<CreateOrganizationSchema>>;
} = $props();

let slugTouched = $state(false);

const form = superForm(data, {
	validators: zod4Client(createOrganizationSchema),
	onUpdated: async ({ form }) => {
		notify(form);
		if (form.valid && !form.message) {
			open = false;
			slugTouched = false;
			await invalidateAll();
		}
	},
});
const { form: formData, enhance, submitting } = form;

function onNameInput(event: Event) {
	const value = (event.currentTarget as HTMLInputElement).value;
	$formData.name = value;
	if (!slugTouched) {
		$formData.slug = slugify(value);
	}
}

function onSlugInput(event: Event) {
	slugTouched = true;
	$formData.slug = (event.currentTarget as HTMLInputElement).value;
}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[480px]">
		<form method="POST" action="/organizations?/createOrganization" use:enhance>
			<Dialog.Header>
				<Dialog.Title>Create a new organization</Dialog.Title>
				<Dialog.Description>
					Give your organization a name. The slug is generated automatically — edit it if you'd like
					a different URL identifier.
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
				<Form.Field {form} name="name">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Name</Form.Label>
							<Input
								{...props}
								value={$formData.name}
								oninput={onNameInput}
								placeholder="Acme Inc."
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="slug">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Slug</Form.Label>
							<Input
								{...props}
								value={$formData.slug}
								oninput={onSlugInput}
								placeholder="acme-inc"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
			<Dialog.Footer>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
					Cancel
				</Dialog.Close>
				<Form.Button type="submit" disabled={$submitting}>
					{#if $submitting}
						<Spinner />
					{/if}
					Create organization
				</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
