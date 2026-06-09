<script lang="ts">
import { onMount } from "svelte";
import { toast } from "svelte-sonner";
import type { PageData } from "./$types";
import PageHeader from "$lib/components/page-header.svelte";
import MietobjektForm from "./mietobjekt-form.svelte";

let { data }: { data: PageData } = $props();

const sourceNames = { immoscout: "ImmobilienScout24", immowelt: "Immowelt" } as const;
const fieldLabels: Record<string, string> = {
	street: "Straße",
	houseNumber: "Hausnummer",
	postalCode: "PLZ",
	city: "Stadt",
	livingArea: "Wohnfläche",
	rooms: "Zimmer",
	coldRent: "Kaltmiete",
};

onMount(() => {
	const result = data.importResult;
	if (!result) return;
	if (result.status === "error") {
		toast.error(result.message);
		return;
	}
	const missing = result.missing.map((key) => fieldLabels[key] ?? key);
	const parts: string[] = [];
	if (result.imageCount > 0) {
		parts.push(`${result.imageCount} ${result.imageCount === 1 ? "Bild" : "Bilder"} übernommen.`);
	}
	parts.push(
		missing.length > 0
			? `Bitte ergänzen Sie noch: ${missing.join(", ")}.`
			: "Bitte prüfen Sie die übernommenen Angaben.",
	);
	toast.success(`Daten aus ${sourceNames[result.source]} übernommen.`, {
		description: parts.join(" "),
	});
});
</script>

<PageHeader
	title="Neues Mietobjekt"
	parent={{ label: "Mietobjekte", href: "/vermieter/mietobjekte" }}
/>
<div class="mx-auto w-full max-w-5xl p-4 md:p-6">
	<MietobjektForm {data} filterDefinitions={data.filterDefinitions} />
</div>
