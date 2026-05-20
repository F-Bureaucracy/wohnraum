<script lang="ts">
import type { PageData } from "./$types";
import MietobjektForm from "./mietobjekt-form.svelte";

let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto w-full max-w-2xl p-6 md:p-10">
	<MietobjektForm {data} />
</div>
