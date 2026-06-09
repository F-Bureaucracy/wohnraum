<script lang="ts">
import { onMount } from "svelte";
import { resolve } from "$app/paths";
import { type Infer, type SuperValidated, superForm } from "sveltekit-superforms";
import { zod4Client } from "sveltekit-superforms/adapters";
import * as Form from "$lib/components/ui/form/index.js";
import * as Select from "$lib/components/ui/select/index.js";
import { Button } from "$lib/components/ui/button/index.js";
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
	{ id: "bilder", label: "Bilder" },
	{ id: "beschreibung", label: "Beschreibung" },
];

let activeId = $state(steps[0].id);
let addressSuggestions = $state<AddressSuggestion[]>([]);
let addressSearchOpen = $state(false);
let addressSearchLoading = $state(false);
let selectedSuggestionIndex = $state(0);
let addressSearchRequest = 0;
let selectedAddressQuery = $state("");
let imageInput: HTMLInputElement;
let imageUploading = $state(0);

type AddressSuggestion = {
	id: string;
	label: string;
	street: string;
	houseNumber: string;
	postalCode: string;
	city: string;
};

type MietobjektImage = {
	id?: string;
	fileName: string;
	mimeType?: string;
	size?: number;
	storageKey: string;
};

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

const addressQuery = $derived(
	[$formData.street, $formData.houseNumber, $formData.postalCode, $formData.city]
		.filter(Boolean)
		.join(" ")
		.trim(),
);

$effect(() => {
	const query = addressQuery;
	if (query.length < 3) {
		addressSuggestions = [];
		addressSearchOpen = false;
		addressSearchLoading = false;
		return;
	}
	if (query === selectedAddressQuery) {
		addressSuggestions = [];
		addressSearchOpen = false;
		addressSearchLoading = false;
		return;
	}

	const requestId = ++addressSearchRequest;
	addressSearchLoading = true;

	const timeout = window.setTimeout(async () => {
		try {
			const params = new URLSearchParams({ q: query });
			const response = await fetch(resolve(`/vermieter/mietobjekte/new/address-search?${params}`));
			if (!response.ok) throw new Error(`Address search failed: ${response.status}`);
			const data = (await response.json()) as { suggestions?: AddressSuggestion[] };
			if (requestId !== addressSearchRequest) return;
			addressSuggestions = data.suggestions ?? [];
			selectedSuggestionIndex = 0;
			addressSearchOpen = addressSuggestions.length > 0;
		} catch {
			if (requestId !== addressSearchRequest) return;
			addressSuggestions = [];
			addressSearchOpen = false;
		} finally {
			if (requestId === addressSearchRequest) addressSearchLoading = false;
		}
	}, 300);

	return () => window.clearTimeout(timeout);
});

function selectAddressSuggestion(suggestion: AddressSuggestion) {
	$formData.street = suggestion.street;
	$formData.houseNumber = suggestion.houseNumber;
	$formData.postalCode = suggestion.postalCode;
	$formData.city = suggestion.city;
	selectedAddressQuery = [suggestion.street, suggestion.houseNumber, suggestion.postalCode, suggestion.city]
		.filter(Boolean)
		.join(" ")
		.trim();
	addressSearchOpen = false;
	addressSuggestions = [];
}

function handleAddressKeydown(event: KeyboardEvent) {
	if (!addressSearchOpen || addressSuggestions.length === 0) return;

	if (event.key === "ArrowDown") {
		event.preventDefault();
		selectedSuggestionIndex = (selectedSuggestionIndex + 1) % addressSuggestions.length;
	} else if (event.key === "ArrowUp") {
		event.preventDefault();
		selectedSuggestionIndex =
			(selectedSuggestionIndex - 1 + addressSuggestions.length) % addressSuggestions.length;
	} else if (event.key === "Enter") {
		event.preventDefault();
		selectAddressSuggestion(addressSuggestions[selectedSuggestionIndex]);
	} else if (event.key === "Escape") {
		addressSearchOpen = false;
	}
}

function imageUrl(image: MietobjektImage) {
	if (image.id) return resolve(`/api/mietobjekt-images/${image.id}`);
	if (image.storageKey) {
		return resolve(`/api/s3/preview?key=${encodeURIComponent(image.storageKey)}`);
	}
	return "";
}

function formatImageSize(bytes?: number) {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function uploadImage(file: File) {
	const signRes = await fetch(resolve("/api/s3/sign"), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ filename: file.name, contentType: file.type }),
	});
	if (!signRes.ok) throw new Error("Upload konnte nicht vorbereitet werden");

	const { method, url, key } = (await signRes.json()) as {
		method: string;
		url: string;
		key: string;
	};

	const putRes = await fetch(url, {
		method,
		headers: { "Content-Type": file.type || "application/octet-stream" },
		body: file,
	});
	if (!putRes.ok) throw new Error(`Upload fehlgeschlagen: ${file.name}`);

	$formData.images = [
		...($formData.images ?? []),
		{
			fileName: file.name,
			mimeType: file.type || undefined,
			size: file.size,
			storageKey: key,
		},
	];
}

async function onImagesChosen(event: Event) {
	const target = event.currentTarget as HTMLInputElement;
	const files = Array.from(target.files ?? []).filter((file) => file.type.startsWith("image/"));
	if (files.length === 0) return;

	imageUploading += files.length;
	await Promise.all(
		files.map(async (file) => {
			try {
				await uploadImage(file);
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Upload fehlgeschlagen");
			} finally {
				imageUploading -= 1;
			}
		}),
	);
	target.value = "";
}

function removeImage(index: number) {
	$formData.images = ($formData.images ?? []).filter((_, i) => i !== index);
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
								<div class="relative">
									<Input
										{...props}
										bind:value={$formData.street}
										autocomplete="off"
										role="combobox"
										aria-expanded={addressSearchOpen}
										aria-controls="address-suggestions"
										onfocus={() => {
											if (addressSuggestions.length > 0) addressSearchOpen = true;
										}}
										onblur={() => {
											window.setTimeout(() => {
												addressSearchOpen = false;
											}, 120);
										}}
										onkeydown={handleAddressKeydown}
									/>
									{#if addressSearchOpen}
										<div
											id="address-suggestions"
											class="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border p-1 shadow-md"
											role="listbox"
										>
											{#each addressSuggestions as suggestion, i (suggestion.id)}
												<button
													type="button"
													class:bg-muted={i === selectedSuggestionIndex}
													class="hover:bg-muted flex w-full flex-col rounded-sm px-2 py-1.5 text-left text-sm"
													role="option"
													aria-selected={i === selectedSuggestionIndex}
													onpointerdown={(event) => event.preventDefault()}
													onclick={() => selectAddressSuggestion(suggestion)}
												>
													<span class="font-medium">
														{suggestion.street}
														{suggestion.houseNumber}
													</span>
													<span class="text-muted-foreground text-xs">
														{suggestion.postalCode}
														{suggestion.city}
													</span>
												</button>
											{/each}
										</div>
									{:else if addressSearchLoading}
										<div class="text-muted-foreground absolute top-full mt-1 text-xs">
											Adressen werden gesucht…
										</div>
									{/if}
								</div>
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

		<section id="bilder" class="bg-card scroll-mt-6 rounded-lg border p-6">
			<header class="mb-4">
				<h2 class="text-base font-semibold">Bilder</h2>
				<p class="text-muted-foreground text-sm">
					Fügen Sie Fotos der Wohnung hinzu.
				</p>
			</header>

			<div class="flex flex-col gap-4">
				<div class="flex flex-wrap items-center gap-3">
					<input
						bind:this={imageInput}
						type="file"
						accept="image/*"
						multiple
						class="sr-only"
						onchange={onImagesChosen}
					/>
					<Button type="button" variant="outline" onclick={() => imageInput.click()}>
						Bilder auswählen
					</Button>
					{#if imageUploading > 0}
						<span class="text-muted-foreground text-sm">
							{imageUploading} {imageUploading === 1 ? "Bild" : "Bilder"} werden hochgeladen…
						</span>
					{/if}
				</div>

				{#if ($formData.images ?? []).length > 0}
					<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{#each $formData.images ?? [] as image, i (image.storageKey)}
							<li class="overflow-hidden rounded-md border">
								{#if imageUrl(image)}
									<img
										src={imageUrl(image)}
										alt={image.fileName}
										class="aspect-[4/3] w-full object-cover"
									/>
								{:else}
									<div class="bg-muted flex aspect-[4/3] items-center justify-center text-sm text-muted-foreground">
										Hochgeladen
									</div>
								{/if}
								<div class="flex items-start justify-between gap-2 p-3">
									<div class="min-w-0">
										<div class="truncate text-sm font-medium">{image.fileName}</div>
										{#if formatImageSize(image.size)}
											<div class="text-muted-foreground text-xs">{formatImageSize(image.size)}</div>
										{/if}
									</div>
									<button
										type="button"
										class="text-muted-foreground hover:text-destructive text-sm"
										onclick={() => removeImage(i)}
									>
										Entfernen
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="text-muted-foreground text-sm">Noch keine Bilder hinzugefügt.</p>
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
