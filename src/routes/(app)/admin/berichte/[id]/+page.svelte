<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import PageHeader from '$lib/components/page-header.svelte';
	import ReportViewer from '$lib/components/report-viewer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const bericht = $derived(data.bericht);

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
		{#if bericht.status === 'ready' && bericht.hasPdf}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<Button href={`/admin/berichte/${bericht.id}/pdf`} download class="shrink-0">
				<DownloadIcon class="size-4" />
				PDF herunterladen
			</Button>
		{/if}
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
