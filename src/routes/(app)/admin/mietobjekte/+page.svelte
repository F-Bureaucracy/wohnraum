<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import MietobjekteView from '$lib/components/mietobjekte-view.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Mietobjekte" />
<MietobjekteView
	data={data.mietobjekte}
	basePath="/admin/mietobjekte"
	bookmarkAction="/admin/mietobjekte?/toggleBookmark"
/>
