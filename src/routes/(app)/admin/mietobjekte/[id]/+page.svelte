<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import MietobjektDetail from '$lib/components/mietobjekt-detail.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHeader
	title={data.mietobjekt.adresse}
	parent={{ label: 'Mietobjekte', href: '/admin/mietobjekte' }}
/>
<MietobjektDetail mietobjekt={data.mietobjekt} />
