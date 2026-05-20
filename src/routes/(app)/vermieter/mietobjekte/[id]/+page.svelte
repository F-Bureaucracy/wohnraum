<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import MietobjektDetail from '$lib/components/mietobjekt-detail.svelte';
	import MietobjektForm from '../new/mietobjekt-form.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let editing = $state(false);
</script>

<PageHeader
	title={data.mietobjekt.adresse}
	parent={{ label: 'Mietobjekte', href: '/vermieter/mietobjekte' }}
/>

<div class="flex items-center justify-end px-4 pb-2">
	{#if !editing}
		<Button size="sm" variant="outline" onclick={() => (editing = true)}>
			<PencilIcon class="size-4" />
			Bearbeiten
		</Button>
	{/if}
</div>

{#if editing}
	<div class="mx-auto w-full max-w-5xl p-4 md:p-6">
		<MietobjektForm
			data={{ form: data.form, organizations: data.organizations }}
			title="Mietobjekt bearbeiten"
			description="Aktualisieren Sie die Angaben zu dieser Wohnung."
			action="?/updateMietobjekt"
			submitLabel="Speichern"
			submittingLabel="Wird gespeichert…"
			onCancel={() => (editing = false)}
			onSaved={() => (editing = false)}
		/>
	</div>
{:else}
	<MietobjektDetail mietobjekt={data.mietobjekt} showVermieter={false} />
{/if}
