<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import MietobjekteView from '$lib/components/mietobjekte-view.svelte';
	import { mietobjekte } from '$lib/data/mietobjekte';
</script>

<PageHeader title="Mietobjekte" />
<MietobjekteView data={mietobjekte} basePath="/admin/mietobjekte" />
