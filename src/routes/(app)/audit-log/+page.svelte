<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let filterForm: HTMLFormElement;
	let actionFilterTimeout: ReturnType<typeof setTimeout> | undefined;

	const impactLabels: Record<string, string> = {
		low: 'Niedrig',
		medium: 'Mittel',
		high: 'Hoch',
		critical: 'Kritisch',
	};

	const impactVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		low: 'secondary',
		medium: 'outline',
		high: 'default',
		critical: 'destructive',
	};

	const statusLabels: Record<string, string> = {
		success: 'Erfolgreich',
		failed: 'Fehlgeschlagen',
	};

	const dateFmt = new Intl.DateTimeFormat('de-DE', {
		dateStyle: 'medium',
		timeStyle: 'short',
	});

	function formatDate(raw: Date | string) {
		return dateFmt.format(raw instanceof Date ? raw : new Date(raw));
	}

	function formatMetadata(metadata: string | null) {
		if (!metadata) return '—';
		try {
			return JSON.stringify(JSON.parse(metadata));
		} catch {
			return metadata;
		}
	}

	function submitFilters() {
		filterForm.requestSubmit();
	}

	function submitActionFilter() {
		if (actionFilterTimeout) clearTimeout(actionFilterTimeout);
		actionFilterTimeout = setTimeout(submitFilters, 300);
	}
</script>

<PageHeader title="Änderungen" />

<main class="flex flex-1 flex-col gap-4 p-4 pt-0">
	<form
		bind:this={filterForm}
		method="GET"
		class="flex flex-col gap-2 rounded-md border bg-background p-3 md:flex-row md:items-end"
	>
		<label class="grid gap-1 text-sm md:w-48">
			<span class="font-medium">Auswirkung</span>
			<select
				name="impact"
				value={data.filters.impact}
				onchange={submitFilters}
				class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
			>
				<option value="">Alle</option>
				<option value="low">Niedrig</option>
				<option value="medium">Mittel</option>
				<option value="high">Hoch</option>
				<option value="critical">Kritisch</option>
			</select>
		</label>
		<label class="grid gap-1 text-sm md:w-48">
			<span class="font-medium">Status</span>
			<select
				name="status"
				value={data.filters.status}
				onchange={submitFilters}
				class="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
			>
				<option value="">Alle</option>
				<option value="success">Erfolgreich</option>
				<option value="failed">Fehlgeschlagen</option>
			</select>
		</label>
		<label class="grid gap-1 text-sm md:min-w-64 md:flex-1">
			<span class="font-medium">Aktion</span>
			<Input
				name="action"
				value={data.filters.action}
				placeholder="Aktion filtern"
				oninput={submitActionFilter}
			/>
		</label>
		<div class="flex gap-2">
			<Button href="/audit-log" variant="outline">Zurücksetzen</Button>
		</div>
	</form>

	<div class="audit-table-scroll overflow-x-auto rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="min-w-44">Zeitpunkt</Table.Head>
					<Table.Head class="min-w-56">Benutzer</Table.Head>
					<Table.Head class="min-w-36">Objekt</Table.Head>
					<Table.Head class="min-w-52">Aktion</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Auswirkung</Table.Head>
					<Table.Head class="min-w-80">Details</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.logs as log (log.id)}
					<Table.Row>
						<Table.Cell>{formatDate(log.createdAt)}</Table.Cell>
						<Table.Cell>
							<div class="truncate font-medium">{log.userName ?? log.userEmail ?? 'Unbekannt'}</div>
							{#if log.userEmail}
								<div class="truncate text-xs text-muted-foreground">{log.userEmail}</div>
							{/if}
						</Table.Cell>
						<Table.Cell>
							<div class="truncate">{log.entityType}</div>
							{#if log.entityId}
								<div class="truncate text-xs text-muted-foreground">{log.entityId}</div>
							{/if}
						</Table.Cell>
						<Table.Cell class="font-mono text-xs">{log.action}</Table.Cell>
						<Table.Cell>
							<Badge variant={log.status === 'failed' ? 'destructive' : 'secondary'}>
								{statusLabels[log.status] ?? log.status}
							</Badge>
						</Table.Cell>
						<Table.Cell>
							<Badge variant={impactVariants[log.severity] ?? 'outline'}>
								{impactLabels[log.severity] ?? log.severity}
							</Badge>
						</Table.Cell>
						<Table.Cell
							class="max-w-96 truncate font-mono text-xs"
							title={formatMetadata(log.after ?? log.metadata)}
						>
							{formatMetadata(log.after ?? log.metadata)}
						</Table.Cell>
					</Table.Row>
				{:else}
					<Table.Row>
						<Table.Cell colspan={7} class="h-24 text-center text-muted-foreground">
							Keine Änderungen gefunden.
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</main>

<style>
	.audit-table-scroll {
		scrollbar-width: thin;
		scrollbar-color: var(--color-muted) transparent;
	}

	.audit-table-scroll::-webkit-scrollbar {
		height: 10px;
	}

	.audit-table-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.audit-table-scroll::-webkit-scrollbar-thumb {
		background-color: var(--color-muted);
		border-radius: 9999px;
	}

	.audit-table-scroll::-webkit-scrollbar-thumb:hover {
		background-color: var(--color-muted-foreground);
	}
</style>
