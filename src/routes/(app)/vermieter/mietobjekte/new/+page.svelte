<script lang="ts">
import type { PageData } from "./$types";
import PageHeader from "$lib/components/page-header.svelte";
import MietobjektForm from "./mietobjekt-form.svelte";

let { data }: { data: PageData } = $props();
</script>

<PageHeader
	title="Neues Mietobjekt"
	parent={{ label: "Mietobjekte", href: "/vermieter/mietobjekte" }}
/>
<div class="mx-auto w-full max-w-5xl p-4 md:p-6">
	<MietobjektForm {data} />
</div>
