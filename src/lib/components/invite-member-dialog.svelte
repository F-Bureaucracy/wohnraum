<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { buttonVariants } from '$lib/components/ui/button/index.js';
import * as Dialog from '$lib/components/ui/dialog/index.js';
import * as Form from '$lib/components/ui/form/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import * as Select from '$lib/components/ui/select/index.js';
import { Spinner } from '$lib/components/ui/spinner/index.js';
import { notify } from '$lib/notify';
import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { type InviteMemberSchema, inviteMemberSchema } from '../../routes/(app)/users/schema';

let {
	open = $bindable(false),
	data,
}: {
	open: boolean;
	data: SuperValidated<Infer<InviteMemberSchema>>;
} = $props();

const roleOptions = [
	{ value: 'member', label: 'Mitglied' },
	{ value: 'admin', label: 'Administrator' },
] as const;

const form = superForm(data, {
	validators: zod4Client(inviteMemberSchema),
	onUpdated: async ({ form }) => {
		notify(form);
		if (form.valid && !form.errors._errors) {
			open = false;
			await invalidateAll();
		}
	},
});
const { form: formData, enhance, submitting } = form;

const roleLabel = $derived(
	roleOptions.find((o) => o.value === $formData.role)?.label ?? 'Rolle wählen'
);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[480px]">
		<form method="POST" action="/users?/inviteMember" use:enhance>
			<Dialog.Header>
				<Dialog.Title>Mitglied einladen</Dialog.Title>
				<Dialog.Description>
					Die eingeladene Person erhält eine E-Mail mit einem Link, um der Organisation beizutreten.
				</Dialog.Description>
			</Dialog.Header>
			<div class="grid gap-4 py-4">
				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>E-Mail</Form.Label>
							<Input {...props} bind:value={$formData.email} placeholder="person@beispiel.de" />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="role">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Rolle</Form.Label>
							<Select.Root type="single" bind:value={$formData.role} name={props.name}>
								<Select.Trigger {...props}>{roleLabel}</Select.Trigger>
								<Select.Content>
									{#each roleOptions as option (option.value)}
										<Select.Item value={option.value} label={option.label}>
											{option.label}
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
			<Dialog.Footer>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
					Abbrechen
				</Dialog.Close>
				<Form.Button type="submit" disabled={$submitting}>
					{#if $submitting}
						<Spinner />
					{/if}
					Einladung senden
				</Form.Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
