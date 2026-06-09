<script lang="ts">
	import DataTable from '$lib/components/data-table.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import BerichtCreateButton from '$lib/components/bericht-create-button.svelte';
	import { berichtColumns } from '$lib/components/columns-berichte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Berichte" />
<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<DataTable
		columns={berichtColumns}
		data={data.berichte}
		filterColumnId="prompt"
		filterPlaceholder="Berichte suchen..."
	>
		{#snippet createAction()}
			<BerichtCreateButton />
		{/snippet}
	</DataTable>
</div>
