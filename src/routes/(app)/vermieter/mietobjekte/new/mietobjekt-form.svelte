<script lang="ts">
import { type Infer, type SuperValidated, superForm } from "sveltekit-superforms";
import { zod4Client } from "sveltekit-superforms/adapters";
import * as Form from "$lib/components/ui/form/index.js";
import * as Select from "$lib/components/ui/select/index.js";
import { Input } from "$lib/components/ui/input/index.js";
import { Textarea } from "$lib/components/ui/textarea/index.js";
import { Checkbox } from "$lib/components/ui/checkbox/index.js";
import { cn } from "$lib/utils.js";
import { type FormSchema, mietobjektSchema } from "./schema.ts";
import { toast } from "svelte-sonner";

let {
	data,
}: {
	data: {
		form: SuperValidated<Infer<FormSchema>>;
		organizations: Array<{ id: string; name: string }>;
	};
} = $props();

const form = superForm(data.form, {
	validators: zod4Client(mietobjektSchema),
	dataType: "json",
	onUpdated: ({ form }) => {
		if (!form.valid && form.message) toast.error(form.message);
	},
	onError: ({ result }) => {
		toast.error(result.error.message ?? "Unerwarteter Fehler");
	},
});
const { form: formData, enhance } = form;

const orgs = data.organizations;
const selectedOrgLabel = $derived(
	orgs.find((o) => o.id === $formData.organizationId)?.name ?? "Organisation wählen",
);
</script>

<form class={cn("flex flex-col gap-6")} method="POST" use:enhance>
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-bold">Neues Mietobjekt</h1>
		<p class="text-muted-foreground text-sm">
			Erfassen Sie eine Wohnung, die zur Vermietung angeboten wird.
		</p>
	</div>

	{#if orgs.length > 1}
		<Form.Field {form} name="organizationId">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Organisation</Form.Label>
					<Select.Root type="single" bind:value={$formData.organizationId} name={props.name}>
						<Select.Trigger {...props}>{selectedOrgLabel}</Select.Trigger>
						<Select.Content>
							{#each orgs as org (org.id)}
								<Select.Item value={org.id} label={org.name}>{org.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	{:else}
		<input type="hidden" name="organizationId" bind:value={$formData.organizationId} />
	{/if}

	<section class="flex flex-col gap-4">
		<h2 class="text-sm font-semibold">Adresse</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
			<Form.Field {form} name="street">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Straße</Form.Label>
						<Input {...props} bind:value={$formData.street} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="houseNumber">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Hausnummer</Form.Label>
						<Input {...props} bind:value={$formData.houseNumber} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
			<Form.Field {form} name="postalCode">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>PLZ</Form.Label>
						<Input {...props} bind:value={$formData.postalCode} inputmode="numeric" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="city">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Stadt</Form.Label>
						<Input {...props} bind:value={$formData.city} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<Form.Field {form} name="floor">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Etage (optional)</Form.Label>
						<Input {...props} bind:value={$formData.floor} placeholder="z. B. 2. OG" />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="unit">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Wohnungsnummer (optional)</Form.Label>
						<Input {...props} bind:value={$formData.unit} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</section>

	<section class="flex flex-col gap-4">
		<h2 class="text-sm font-semibold">Größe & Aufteilung</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<Form.Field {form} name="livingArea">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Wohnfläche (m²)</Form.Label>
						<Input {...props} type="number" min="1" bind:value={$formData.livingArea} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="rooms">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Zimmer</Form.Label>
						<Input {...props} type="number" min="1" bind:value={$formData.rooms} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="bedrooms">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Schlafzimmer (optional)</Form.Label>
						<Input {...props} type="number" min="0" bind:value={$formData.bedrooms} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
		<div class="flex flex-wrap gap-6">
			<Form.Field {form} name="hasKitchen" class="flex flex-row items-center gap-2">
				<Form.Control>
					{#snippet children({ props })}
						<Checkbox {...props} bind:checked={$formData.hasKitchen} />
						<Form.Label>Einbauküche</Form.Label>
					{/snippet}
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="hasBalcony" class="flex flex-row items-center gap-2">
				<Form.Control>
					{#snippet children({ props })}
						<Checkbox {...props} bind:checked={$formData.hasBalcony} />
						<Form.Label>Balkon / Terrasse</Form.Label>
					{/snippet}
				</Form.Control>
			</Form.Field>
		</div>
	</section>

	<section class="flex flex-col gap-4">
		<h2 class="text-sm font-semibold">Kosten (€ pro Monat)</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<Form.Field {form} name="coldRent">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Kaltmiete</Form.Label>
						<Input {...props} type="number" min="0" step="0.01" bind:value={$formData.coldRent} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="operatingCosts">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Nebenkosten</Form.Label>
						<Input
							{...props}
							type="number"
							min="0"
							step="0.01"
							bind:value={$formData.operatingCosts}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="heatingCosts">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Heizkosten</Form.Label>
						<Input
							{...props}
							type="number"
							min="0"
							step="0.01"
							bind:value={$formData.heatingCosts}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="deposit">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Kaution (einmalig, €)</Form.Label>
						<Input {...props} type="number" min="0" step="0.01" bind:value={$formData.deposit} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</section>

	<section class="flex flex-col gap-4">
		<h2 class="text-sm font-semibold">Verfügbarkeit</h2>
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<Form.Field {form} name="availableFrom">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Verfügbar ab</Form.Label>
						<Input {...props} type="date" bind:value={$formData.availableFrom} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="minLeaseMonths">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Mindestmietdauer (Monate, optional)</Form.Label>
						<Input {...props} type="number" min="1" bind:value={$formData.minLeaseMonths} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</section>

	<section class="flex flex-col gap-4">
		<h2 class="text-sm font-semibold">Eignung</h2>
		<Form.Field {form} name="maxOccupants">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Max. Personen</Form.Label>
					<Input {...props} type="number" min="1" bind:value={$formData.maxOccupants} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<div class="flex flex-wrap gap-6">
			<Form.Field {form} name="barrierFree" class="flex flex-row items-center gap-2">
				<Form.Control>
					{#snippet children({ props })}
						<Checkbox {...props} bind:checked={$formData.barrierFree} />
						<Form.Label>Barrierefrei</Form.Label>
					{/snippet}
				</Form.Control>
			</Form.Field>
			<Form.Field {form} name="petsAllowed" class="flex flex-row items-center gap-2">
				<Form.Control>
					{#snippet children({ props })}
						<Checkbox {...props} bind:checked={$formData.petsAllowed} />
						<Form.Label>Haustiere erlaubt</Form.Label>
					{/snippet}
				</Form.Control>
			</Form.Field>
		</div>
	</section>

	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Beschreibung (optional)</Form.Label>
				<Textarea
					{...props}
					rows={4}
					bind:value={$formData.description}
					placeholder="Weitere Hinweise zur Wohnung…"
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Button type="submit">Mietobjekt anlegen</Form.Button>
</form>
