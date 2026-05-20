<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import PageHeader from '$lib/components/page-header.svelte';
	import MietobjekteView from '$lib/components/mietobjekte-view.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
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
<MietobjekteView data={data.mietobjekte} basePath="/vermieter/mietobjekte" />
