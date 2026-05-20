<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import PageHeader from '$lib/components/page-header.svelte';
	import MietobjekteView from '$lib/components/mietobjekte-view.svelte';
	import { mietobjekte } from '$lib/data/mietobjekte';
	import PlusIcon from '@lucide/svelte/icons/plus';

	// TODO: replace with DB query filtered by the active company's id
	const ownListings = mietobjekte.slice(0, 2);
</script>

<PageHeader title="Mietobjekte" />
<div class="flex items-center justify-end px-4 pb-2">
	<a
		href="/vermieter/mietobjekte/new"
		class={buttonVariants({ variant: 'default', size: 'sm' })}
	>
		<PlusIcon class="size-4" />
		Neues Mietobjekt
	</a>
</div>
<MietobjekteView data={ownListings} basePath="/vermieter/mietobjekte" />
