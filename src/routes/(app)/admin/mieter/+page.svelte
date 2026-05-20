<script lang="ts">
	import DataTable from '$lib/components/data-table.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import { mieterColumns, type Mieter } from '$lib/components/columns-mieter';

	const data: Mieter[] = [
		{
			id: 'm1',
			name: 'Jonas Becker',
			email: 'jonas.becker@example.de',
			telefon: '+49 151 1112223',
			mietobjekt: 'Hauptstraße 12, Berlin — WE 3',
			createdAt: new Date('2023-09-01'),
		},
		{
			id: 'm2',
			name: 'Lisa Wagner',
			email: 'lisa.wagner@example.de',
			telefon: '+49 162 3334445',
			mietobjekt: 'Marienplatz 4, München — WE 1',
			createdAt: new Date('2024-02-14'),
		},
		{
			id: 'm3',
			name: 'Tobias Fischer',
			email: 't.fischer@example.de',
			telefon: '+49 170 9998887',
			mietobjekt: 'Alster Allee 7, Hamburg — WE 5',
			createdAt: new Date('2024-05-20'),
		},
		{
			id: 'm4',
			name: 'Sophia Neumann',
			email: 'sophia.n@example.de',
			telefon: '+49 152 4445556',
			mietobjekt: 'Domstraße 22, Köln — WE 2',
			createdAt: new Date('2024-07-08'),
		},
		{
			id: 'm5',
			name: 'Max Schulz',
			email: 'max.schulz@example.de',
			telefon: '+49 176 7776665',
			mietobjekt: 'Königstraße 88, Stuttgart — WE 4',
			createdAt: new Date('2024-10-12'),
		},
		{
			id: 'm6',
			name: 'Nina Vogel',
			email: 'nina.vogel@example.de',
			telefon: '+49 157 2223334',
			mietobjekt: 'Zeil 30, Frankfurt — WE 6',
			createdAt: new Date('2025-01-03'),
		},
	];
</script>

<PageHeader title="Mieter" />
<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<DataTable
		columns={mieterColumns}
		{data}
		filterColumnId="name"
		filterPlaceholder="Mieter suchen..."
		entitySingular="Mieter"
		entityPlural="Mieter"
		idFieldName="mieterId"
		deleteAction="/admin/mieter?/deleteMieter"
		editAction="/admin/mieter?/updateMieter"
	/>
</div>
