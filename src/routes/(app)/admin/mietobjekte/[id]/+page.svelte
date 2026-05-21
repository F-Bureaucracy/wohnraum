<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import MietobjektDetail from '$lib/components/mietobjekt-detail.svelte';
	import BookmarkButton from '$lib/components/bookmark-button.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHeader
	title={data.mietobjekt.adresse}
	parent={{ label: 'Mietobjekte', href: '/admin/mietobjekte' }}
/>
<div class="flex items-center justify-end px-4 pb-2">
	<BookmarkButton
		entityType="mietobjekt"
		entityId={data.mietobjekt.id}
		bookmarked={data.bookmarked}
		action="?/toggleBookmark"
		variant="outline"
		size="sm"
		label={data.bookmarked ? 'Gemerkt' : 'Merken'}
	/>
</div>
<MietobjektDetail mietobjekt={data.mietobjekt} bewohner={data.bewohner} />
