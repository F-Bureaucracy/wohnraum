<script lang="ts">
import { onMount } from "svelte";
import { type Infer, type SuperValidated, superForm } from "sveltekit-superforms";
import { zod4Client } from "sveltekit-superforms/adapters";
import * as Form from "$lib/components/ui/form/index.js";
import * as Select from "$lib/components/ui/select/index.js";
import { Input } from "$lib/components/ui/input/index.js";
import { Textarea } from "$lib/components/ui/textarea/index.js";
import { Checkbox } from "$lib/components/ui/checkbox/index.js";
import FormStepper, { type StepperStep } from "$lib/components/form-stepper.svelte";
import { type FilterDefinition, mietobjektDefs } from "$lib/matching-flags";
import { type FormSchema, mietobjektSchema } from "./schema.ts";
import { toast } from "svelte-sonner";

let {
	data,
	filterDefinitions,
	title = "Neues Mietobjekt",
	description = "Erfassen Sie eine Wohnung, die zur Vermietung angeboten wird.",
	submitLabel = "Mietobjekt anlegen",
	submittingLabel = "Wird gespeichert…",
	action,
	onCancel,
	onSaved,
}: {
	data: {
		form: SuperValidated<Infer<FormSchema>>;
		organizations: Array<{ id: string; name: string }>;
	};
	filterDefinitions: FilterDefinition[];
	title?: string;
	description?: string;
	submitLabel?: string;
	submittingLabel?: string;
	action?: string;
	onCancel?: () => void;
	onSaved?: () => void;
} = $props();

const form = superForm(data.form, {
	validators: zod4Client(mietobjektSchema),
	dataType: "json",
	onUpdated: ({ form }) => {
		if (!form.valid && form.message) toast.error(form.message);
		else if (form.valid) onSaved?.();
	},
	onError: ({ result }) => {
		toast.error(result.error.message ?? "Unerwarteter Fehler");
	},
});
const { form: formData, enhance, submitting } = form;

const featureDefs = $derived(mietobjektDefs(filterDefinitions));

const orgs = data.organizations;
const selectedOrgLabel = $derived(
	orgs.find((o) => o.id === $formData.organizationId)?.name ?? "Organisation wählen",
);

const steps: StepperStep[] = [
	{ id: "adresse", label: "Adresse" },
	{ id: "groesse", label: "Größe & Aufteilung" },
	{ id: "kosten", label: "Kosten" },
	{ id: "verfuegbarkeit", label: "Verfügbarkeit" },
	{ id: "eignung", label: "Eignung" },
	{ id: "beschreibung", label: "Beschreibung" },
];

let activeId = $state(steps[0].id);

onMount(() => {
	const observer = new IntersectionObserver(
		(entries) => {
			const visible = entries
				.filter((e) => e.isIntersecting)
				.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
			if (visible[0]) activeId = visible[0].target.id;
		},
		{ rootMargin: "-30% 0px -60% 0px", threshold: 0 },
	);
	for (const step of steps) {
		const el = document.getElementById(step.id);
		if (el) observer.observe(el);
	}
	return () => observer.disconnect();
});

function scrollToStep(id: string) {
	const el = document.getElementById(id);
	if (!el) return;
	el.scrollIntoView({ behavior: "smooth", block: "start" });
	activeId = id;
}
</script>

<form
	method="POST"
	{action}
	use:enhance
	class="flex flex-col gap-8 lg:flex-row lg:gap-12"
>
	<aside class="lg:w-56 lg:shrink-0">
		<div class="lg:sticky lg:top-6">
			<div class="mb-4">
				<h1 class="text-xl font-semibold">{title}</h1>
				<p class="text-muted-foreground mt-1 text-sm">{description}</p>
			</div>
			<FormStepper {steps} {activeId} onSelect={scrollToStep} />
		</div>
	</aside>

	<div class="flex min-w-0 flex-1 flex-col gap-6">
		{#if orgs.length > 1}
			<div class="bg-card rounded-lg border p-6">
				<Form.Field {form} name="organizationId">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Organisation</Form.Label>
							<Select.Root
								type="single"
								bind:value={$formData.organizationId}
								name={props.name}
							>
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
			</div>
		{:else}
			<input type="hidden" name="organizationId" bind:value={$formData.organizationId} />
		{/if}

		<section id="adresse" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Adresse</h2>
				<p class="text-muted-foreground text-sm">Wo befindet sich die Wohnung?</p>
			</header>
			<div class="flex flex-col gap-4">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
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
								<Form.Label>Etage <span class="text-muted-foreground">(optional)</span></Form.Label>
								<Input {...props} bind:value={$formData.floor} placeholder="z. B. 2. OG" />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="unit">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									Wohnungsnummer <span class="text-muted-foreground">(optional)</span>
								</Form.Label>
								<Input {...props} bind:value={$formData.unit} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>
			</div>
		</section>

		<section id="groesse" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Größe & Aufteilung</h2>
				<p class="text-muted-foreground text-sm">Grunddaten zum Grundriss.</p>
			</header>
			<div class="flex flex-col gap-4">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<Form.Field {form} name="livingArea">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Wohnfläche (m²)</Form.Label>
								<Input
									{...props}
									type="number"
									min="1"
									bind:value={$formData.livingArea}
								/>
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
								<Form.Label>
									Schlafzimmer <span class="text-muted-foreground">(optional)</span>
								</Form.Label>
								<Input {...props} type="number" min="0" bind:value={$formData.bedrooms} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>
			</div>
		</section>

		<section id="kosten" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Kosten</h2>
				<p class="text-muted-foreground text-sm">Alle monatlichen Beträge in Euro.</p>
			</header>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Form.Field {form} name="coldRent">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Kaltmiete</Form.Label>
							<Input
								{...props}
								type="number"
								min="0"
								step="0.01"
								bind:value={$formData.coldRent}
							/>
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
							<Form.Label>Kaution <span class="text-muted-foreground">(einmalig)</span></Form.Label>
							<Input
								{...props}
								type="number"
								min="0"
								step="0.01"
								bind:value={$formData.deposit}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		</section>

		<section id="verfuegbarkeit" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Verfügbarkeit</h2>
				<p class="text-muted-foreground text-sm">Wann kann eingezogen werden?</p>
			</header>
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
							<Form.Label>
								Mindestmietdauer <span class="text-muted-foreground">(Monate, optional)</span>
							</Form.Label>
							<Input
								{...props}
								type="number"
								min="1"
								bind:value={$formData.minLeaseMonths}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		</section>

		<section id="eignung" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Eignung</h2>
				<p class="text-muted-foreground text-sm">Für wen ist die Wohnung geeignet?</p>
			</header>
			<div class="flex flex-col gap-4">
				<Form.Field {form} name="maxOccupants">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Max. Personen</Form.Label>
							<Input {...props} type="number" min="1" bind:value={$formData.maxOccupants} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				{#if featureDefs.length > 0}
					<div class="flex flex-wrap gap-6 border-t pt-4">
						{#each featureDefs as def (def.key)}
							<label class="flex cursor-pointer flex-row items-center gap-2">
								<Checkbox
									checked={$formData.features[def.key] === true}
									onCheckedChange={(v) => ($formData.features[def.key] = v === true)}
								/>
								<span class="text-sm font-medium">{def.label}</span>
							</label>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<section id="beschreibung" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Beschreibung</h2>
				<p class="text-muted-foreground text-sm">
					Zusätzliche Hinweise für Interessent:innen.
				</p>
			</header>
			<Form.Field {form} name="description">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="sr-only">Beschreibung</Form.Label>
						<Textarea
							{...props}
							rows={5}
							bind:value={$formData.description}
							placeholder="Weitere Hinweise zur Wohnung…"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</section>

		<div
			class="bg-background sticky bottom-0 -mx-4 flex justify-end gap-2 border-t px-4 py-3 sm:-mx-6 sm:px-6"
		>
			{#if onCancel}
				<button
					type="button"
					class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
					disabled={$submitting}
					onclick={onCancel}
				>
					Abbrechen
				</button>
			{/if}
			<Form.Button type="submit" disabled={$submitting}>
				{$submitting ? submittingLabel : submitLabel}
			</Form.Button>
		</div>
	</div>
</form>
