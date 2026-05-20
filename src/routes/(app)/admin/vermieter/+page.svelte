<script lang="ts">
	import DataTable from '$lib/components/data-table.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import { vermieterColumns, type Vermieter } from '$lib/components/columns-vermieter';

	const data: Vermieter[] = [
		{
			id: 'v1',
			name: 'Anna Müller',
			unternehmen: 'Müller Immobilien GmbH',
			email: 'anna.mueller@example.de',
			telefon: '+49 30 1234567',
			anzahlMietobjekte: 12,
			createdAt: new Date('2024-01-15'),
		},
		{
			id: 'v2',
			name: 'Bernd Schäfer',
			unternehmen: 'Schäfer & Partner KG',
			email: 'b.schaefer@example.de',
			telefon: '+49 89 9876543',
			anzahlMietobjekte: 5,
			createdAt: new Date('2024-03-02'),
		},
		{
			id: 'v3',
			name: 'Clara Weiß',
			unternehmen: 'Weiß Hausverwaltung',
			email: 'clara.weiss@example.de',
			telefon: '+49 40 5551212',
			anzahlMietobjekte: 8,
			createdAt: new Date('2024-04-21'),
		},
		{
			id: 'v4',
			name: 'Dieter Hoffmann',
			unternehmen: 'Hoffmann Wohnbau AG',
			email: 'dieter.h@example.de',
			telefon: '+49 221 4433221',
			anzahlMietobjekte: 24,
			createdAt: new Date('2024-06-10'),
		},
		{
			id: 'v5',
			name: 'Elena Krause',
			unternehmen: 'Krause Privat',
			email: 'elena.krause@example.de',
			telefon: '+49 711 8877665',
			anzahlMietobjekte: 2,
			createdAt: new Date('2024-08-30'),
		},
		{
			id: 'v6',
			name: 'Friedrich Lang',
			unternehmen: 'Lang Immobilien UG',
			email: 'f.lang@example.de',
			telefon: '+49 69 1122334',
			anzahlMietobjekte: 7,
			createdAt: new Date('2024-11-05'),
		},
	];
</script>

<PageHeader title="Vermieter" />
<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<DataTable
		columns={vermieterColumns}
		{data}
		filterColumnId="name"
		filterPlaceholder="Vermieter suchen..."
		entitySingular="Vermieter"
		entityPlural="Vermieter"
		idFieldName="vermieterId"
		deleteAction="/vermieter?/deleteVermieter"
		editAction="/vermieter?/updateVermieter"
	/>
</div>
