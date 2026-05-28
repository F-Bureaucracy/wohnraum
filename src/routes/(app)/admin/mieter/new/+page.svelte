<script lang="ts">
import type { PageData } from "./$types";
import PageHeader from "$lib/components/page-header.svelte";
import MieterForm from "./mieter-form.svelte";

let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Neuer Mieter" parent={{ label: "Mieter", href: "/admin/mieter" }} />
<div class="mx-auto w-full max-w-5xl p-4 md:p-6">
	<MieterForm {data} filterDefinitions={data.filterDefinitions} />
</div>
