<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import PageHeader from '$lib/components/page-header.svelte';
	import MietobjekteView from '$lib/components/mietobjekte-view.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import HomeIcon from '@lucide/svelte/icons/home';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Mietobjekte" />
{#if data.mietobjekte.length === 0}
	<div class="flex flex-1 items-center justify-center p-6">
		<Empty.Root>
			<Empty.Header>
				<Empty.Media variant="icon">
					<HomeIcon />
				</Empty.Media>
				<Empty.Title>Noch keine Mietobjekte</Empty.Title>
				<Empty.Description>
					Legen Sie Ihr erstes Mietobjekt an, um es Fallmanagern verfügbar zu machen.
				</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button href="/vermieter/mietobjekte/new">
					<PlusIcon class="size-4" />
					Neues Mietobjekt
				</Button>
			</Empty.Content>
		</Empty.Root>
	</div>
{:else}
	<MietobjekteView
		data={data.mietobjekte}
		basePath="/vermieter/mietobjekte"
		filterDefinitions={data.filterDefinitions}
		createHref="/vermieter/mietobjekte/new"
		createLabel="Neues Mietobjekt"
	/>
{/if}
