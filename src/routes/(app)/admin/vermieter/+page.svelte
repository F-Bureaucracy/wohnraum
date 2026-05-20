<script lang="ts">
	import DataTable from '$lib/components/data-table.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import { vermieterColumns } from '$lib/components/columns-vermieter';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<PageHeader title="Vermieter" />
<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<DataTable
		columns={vermieterColumns}
		data={data.vermieter}
		filterColumnId="name"
		filterPlaceholder="Vermieter suchen..."
	/>
</div>
