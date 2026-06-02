<script lang="ts">
	let { rows }: { rows: { label: string; value: string }[] } = $props();
</script>

<table class="w-full text-sm">
	<tbody>
		{#each rows as row (row.label)}
			<tr class="border-b last:border-b-0">
				<th
					scope="row"
					class="text-muted-foreground py-2 pr-6 text-left align-top font-normal whitespace-nowrap"
				>
					{row.label}
				</th>
				<td class="py-2 text-right font-medium">{row.value}</td>
			</tr>
		{/each}
	</tbody>
</table>
