<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import PageHeader from '$lib/components/page-header.svelte';
	import ReportViewer from '$lib/components/report-viewer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const bericht = $derived(data.bericht);

	let deleteDialogOpen = $state(false);
	let deleting = $state(false);

	// While the report is still generating, poll the status endpoint and reload
	// the page data once it flips to ready/error.
	onMount(() => {
		if (bericht.status !== 'generating') return;
		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/admin/berichte/${bericht.id}/status`);
				if (!res.ok) return;
				const { status } = (await res.json()) as { status: string };
				if (status !== 'generating') {
					clearInterval(interval);
					await invalidateAll();
				}
			} catch {
				// transient network error — keep polling
			}
		}, 2000);
		return () => clearInterval(interval);
	});
</script>

<PageHeader title="Bericht" parent={{ label: 'Berichte', href: '/admin/berichte' }} />

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div class="min-w-0">
			<p class="text-sm text-muted-foreground">Prompt</p>
			<p class="font-medium break-words">{bericht.prompt}</p>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			{#if bericht.status === 'ready' && bericht.hasPdf}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<Button href={`/admin/berichte/${bericht.id}/pdf`} target="_blank" rel="noopener">
					<DownloadIcon class="size-4" />
					PDF öffnen
				</Button>
			{/if}
			<Button variant="outline" onclick={() => (deleteDialogOpen = true)}>
				<Trash2Icon class="size-4" />
				Löschen
			</Button>
		</div>
	</div>

	{#if bericht.status === 'generating'}
		<div
			class="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-20 text-center"
		>
			<Spinner class="size-8 text-muted-foreground" />
			<div>
				<p class="font-medium">Bericht wird erstellt…</p>
				<p class="text-sm text-muted-foreground">
					Dies kann einen Moment dauern. Die Seite aktualisiert sich automatisch.
				</p>
			</div>
		</div>
	{:else if bericht.status === 'error'}
		<Alert.Root variant="destructive">
			<TriangleAlertIcon class="size-4" />
			<Alert.Title>Bericht konnte nicht erstellt werden</Alert.Title>
			<Alert.Description>
				{bericht.errorMessage ?? 'Bei der Erstellung des Berichts ist ein Fehler aufgetreten.'}
			</Alert.Description>
		</Alert.Root>
	{:else if bericht.sourceHtml}
		<ReportViewer html={bericht.sourceHtml} />
	{:else}
		<p class="text-sm text-muted-foreground">Keine Inhalte verfügbar.</p>
	{/if}
</div>

<AlertDialog.Root bind:open={deleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Bericht löschen?</AlertDialog.Title>
			<AlertDialog.Description>
				Diese Aktion kann nicht rückgängig gemacht werden. Der Bericht und das zugehörige PDF werden
				dauerhaft gelöscht.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={deleting}>Abbrechen</AlertDialog.Cancel>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					deleting = true;
					return async ({ update }) => {
						await update();
						deleting = false;
						deleteDialogOpen = false;
					};
				}}
			>
				<Button type="submit" variant="destructive" disabled={deleting}>
					{#if deleting}
						<Spinner class="mr-2" /> Wird gelöscht…
					{:else}
						Löschen
					{/if}
				</Button>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
