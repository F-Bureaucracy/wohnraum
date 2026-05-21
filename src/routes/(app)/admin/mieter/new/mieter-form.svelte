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
import { matchingRequirementFlags } from "$lib/matching-flags";
import { type FormSchema, mieterSchema } from "./schema.ts";
import { toast } from "svelte-sonner";

let {
	data,
	title = "Neuer Mieter",
	description = "Erfassen Sie eine Person, die eine Wohnung sucht.",
	submitLabel = "Mieter anlegen",
	submittingLabel = "Wird gespeichert…",
	action,
	onCancel,
	onSaved,
}: {
	data: {
		form: SuperValidated<Infer<FormSchema>>;
	};
	title?: string;
	description?: string;
	submitLabel?: string;
	submittingLabel?: string;
	action?: string;
	onCancel?: () => void;
	onSaved?: () => void;
} = $props();

const form = superForm(data.form, {
	validators: zod4Client(mieterSchema),
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

const genderOptions = [
	{ value: "female", label: "Weiblich" },
	{ value: "male", label: "Männlich" },
	{ value: "diverse", label: "Divers" },
	{ value: "unspecified", label: "Keine Angabe" },
] as const;
const selectedGenderLabel = $derived(
	genderOptions.find((g) => g.value === $formData.gender)?.label ?? "Auswählen",
);

const steps: StepperStep[] = [
	{ id: "person", label: "Person" },
	{ id: "kontakt", label: "Kontakt" },
	{ id: "haushalt", label: "Haushalt & Bedarf" },
	{ id: "verfuegbarkeit", label: "Verfügbarkeit" },
	{ id: "notizen", label: "Notizen" },
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

<form method="POST" {action} use:enhance class="flex flex-col gap-8 lg:flex-row lg:gap-12">
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
		<section id="person" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Person</h2>
				<p class="text-muted-foreground text-sm">Grunddaten zur Person.</p>
			</header>
			<div class="flex flex-col gap-4">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Form.Field {form} name="firstName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Vorname</Form.Label>
								<Input {...props} bind:value={$formData.firstName} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="lastName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Nachname</Form.Label>
								<Input {...props} bind:value={$formData.lastName} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Form.Field {form} name="dateOfBirth">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									Geburtsdatum <span class="text-muted-foreground">(optional)</span>
								</Form.Label>
								<Input {...props} type="date" bind:value={$formData.dateOfBirth} />
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="gender">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									Geschlecht <span class="text-muted-foreground">(optional)</span>
								</Form.Label>
								<Select.Root
									type="single"
									bind:value={$formData.gender}
									name={props.name}
								>
									<Select.Trigger {...props}>{selectedGenderLabel}</Select.Trigger>
									<Select.Content>
										{#each genderOptions as g (g.value)}
											<Select.Item value={g.value} label={g.label}>{g.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>
			</div>
		</section>

		<section id="kontakt" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Kontakt</h2>
				<p class="text-muted-foreground text-sm">Erreichbarkeit (sofern bekannt).</p>
			</header>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Form.Field {form} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>
								E-Mail <span class="text-muted-foreground">(optional)</span>
							</Form.Label>
							<Input {...props} type="email" bind:value={$formData.email} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="phone">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>
								Telefon <span class="text-muted-foreground">(optional)</span>
							</Form.Label>
							<Input {...props} type="tel" bind:value={$formData.phone} />
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>
		</section>

		<section id="haushalt" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Haushalt & Bedarf</h2>
				<p class="text-muted-foreground text-sm">Was wird gesucht?</p>
			</header>
			<div class="flex flex-col gap-4">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Form.Field {form} name="householdSize">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Haushaltsgröße</Form.Label>
								<Input
									{...props}
									type="number"
									min="1"
									bind:value={$formData.householdSize}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
					<Form.Field {form} name="maxColdRent">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									Max. Kaltmiete <span class="text-muted-foreground">(€, optional)</span>
								</Form.Label>
								<Input
									{...props}
									type="number"
									min="0"
									step="0.01"
									bind:value={$formData.maxColdRent}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>
				<div class="flex flex-wrap gap-6 border-t pt-4">
					{#each matchingRequirementFlags as flag (flag.mieterField)}
						<Form.Field {form} name={flag.mieterField} class="flex flex-row items-center gap-2">
							<Form.Control>
								{#snippet children({ props })}
									<Checkbox {...props} bind:checked={$formData[flag.mieterField]} />
									<Form.Label class="!mt-0 cursor-pointer">{flag.mieterLabel}</Form.Label>
								{/snippet}
							</Form.Control>
						</Form.Field>
					{/each}
				</div>
			</div>
		</section>

		<section id="verfuegbarkeit" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Verfügbarkeit</h2>
				<p class="text-muted-foreground text-sm">Ab wann kann eingezogen werden?</p>
			</header>
			<Form.Field {form} name="availableFrom">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>
							Verfügbar ab <span class="text-muted-foreground">(optional)</span>
						</Form.Label>
						<Input {...props} type="date" bind:value={$formData.availableFrom} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</section>

		<section id="notizen" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Notizen</h2>
				<p class="text-muted-foreground text-sm">
					Hintergrund, besondere Bedarfe, Hinweise.
				</p>
			</header>
			<Form.Field {form} name="notes">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label class="sr-only">Notizen</Form.Label>
						<Textarea
							{...props}
							rows={5}
							bind:value={$formData.notes}
							placeholder="Weitere Hinweise zur Person…"
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
					class="hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium"
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
