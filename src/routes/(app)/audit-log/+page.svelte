<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import UserMinusIcon from '@lucide/svelte/icons/user-minus';
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import BookmarkXIcon from '@lucide/svelte/icons/bookmark-x';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import HistoryIcon from '@lucide/svelte/icons/history';
	import type { Component } from 'svelte';
	import type { PageData } from './$types';

	type Log = PageData['logs'][number];
	type EntityRef = { label: string; href: string | null };

	let { data }: { data: PageData } = $props();

	let search = $state('');
	let typeFilter = $state<'all' | 'mietobjekt' | 'mieter' | 'vermieter-note' | 'mieter-note'>(
		'all'
	);
	let visibleCount = $state(40);

	const typeOptions = [
		{ value: 'all', label: 'Alle Bereiche' },
		{ value: 'mietobjekt', label: 'Mietobjekte' },
		{ value: 'mieter', label: 'Mieter' },
		{ value: 'vermieter-note', label: 'Vermieter-Notizen' },
		{ value: 'mieter-note', label: 'Mieter-Notizen' },
	] as const;

	const timeFmt = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' });
	const dayFmt = new Intl.DateTimeFormat('de-DE', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	function toDate(raw: Date | string) {
		return raw instanceof Date ? raw : new Date(raw);
	}

	function dayKey(d: Date) {
		return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
	}

	function dayHeading(d: Date) {
		const today = new Date();
		const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
		if (dayKey(d) === dayKey(today)) return 'Heute';
		if (dayKey(d) === dayKey(yesterday)) return 'Gestern';
		return dayFmt.format(d);
	}

	// Visual mapping per verb; `tone` drives the icon colour.
	const verbStyles: Record<string, { icon: Component; tone: string }> = {
		create: { icon: PlusIcon, tone: 'text-emerald-600 bg-emerald-50' },
		update: { icon: PencilIcon, tone: 'text-blue-600 bg-blue-50' },
		delete: { icon: Trash2Icon, tone: 'text-red-600 bg-red-50' },
		assign: { icon: UserPlusIcon, tone: 'text-emerald-600 bg-emerald-50' },
		unassign: { icon: UserMinusIcon, tone: 'text-amber-600 bg-amber-50' },
		reserve: { icon: BookmarkIcon, tone: 'text-violet-600 bg-violet-50' },
		unreserve: { icon: BookmarkXIcon, tone: 'text-amber-600 bg-amber-50' },
	};
	const fallbackStyle = { icon: ActivityIcon, tone: 'text-muted-foreground bg-muted' };

	const nouns: Record<string, string> = {
		mietobjekt: 'das Mietobjekt',
		mieter: 'den Mieter',
		'vermieter-note': 'eine Notiz',
		'mieter-note': 'eine Notiz',
	};
	const pasts: Record<string, string> = {
		create: 'angelegt',
		update: 'bearbeitet',
		delete: 'gelöscht',
		reserve: 'reserviert',
		unreserve: 'freigegeben',
	};

	const verbOf = (log: Log) => log.action.split(':')[1] ?? '';
	const styleFor = (log: Log) => verbStyles[verbOf(log)] ?? fallbackStyle;

	const filtered = $derived(
		data.logs.filter((log) => {
			if (typeFilter !== 'all' && log.entityType !== typeFilter) return false;
			if (search.trim()) {
				const q = search.trim().toLowerCase();
				const haystack =
					`${log.subject?.label ?? ''} ${log.target?.label ?? ''} ${log.actor}`.toLowerCase();
				if (!haystack.includes(q)) return false;
			}
			return true;
		}),
	);

	const visible = $derived(filtered.slice(0, visibleCount));

	const groups = $derived.by(() => {
		const result: { key: string; heading: string; items: Log[] }[] = [];
		for (const log of visible) {
			const d = toDate(log.createdAt);
			const key = dayKey(d);
			const last = result[result.length - 1];
			if (last && last.key === key) last.items.push(log);
			else result.push({ key, heading: dayHeading(d), items: [log] });
		}
		return result;
	});

	// Reset paging whenever the filters change.
	let lastFilterKey = '';
	$effect(() => {
		const key = `${search}|${typeFilter}`;
		if (key !== lastFilterKey) {
			lastFilterKey = key;
			visibleCount = 40;
		}
	});
</script>

{#snippet entityRef(ref: EntityRef)}
	{#if ref.href}
		<a href={ref.href} class="font-medium underline-offset-2 hover:underline">{ref.label}</a>
	{:else}
		<span class="font-medium">„{ref.label}“</span>
	{/if}
{/snippet}

<PageHeader title="Änderungen" />

<main class="flex flex-1 flex-col gap-4 p-4 pt-2">
	<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
		<Input bind:value={search} placeholder="Nach Name oder Adresse suchen…" class="sm:max-w-sm" />
		<div class="flex flex-wrap gap-1 rounded-md border p-1">
			{#each typeOptions as opt (opt.value)}
				<button
					type="button"
					onclick={() => (typeFilter = opt.value)}
					class="rounded px-2.5 py-1 text-sm transition-colors {typeFilter === opt.value
						? 'bg-primary text-primary-foreground font-medium'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{opt.label}
				</button>
			{/each}
		</div>
	</div>

	{#if filtered.length === 0}
		<div
			class="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed p-12 text-center"
		>
			<HistoryIcon class="size-6" />
			<p class="text-sm">Keine Änderungen gefunden.</p>
		</div>
	{:else}
		{#each groups as group (group.key)}
			<section>
				<h2 class="text-muted-foreground mb-2 px-1 text-xs font-medium tracking-wide uppercase">
					{group.heading}
				</h2>
				<ul class="overflow-hidden rounded-lg border">
					{#each group.items as log (log.id)}
						{@const style = styleFor(log)}
						{@const Icon = style.icon}
						{@const verb = verbOf(log)}
						<li class="flex items-start gap-3 border-b p-3 last:border-b-0">
							<div
								class="flex size-8 shrink-0 items-center justify-center rounded-full {style.tone}"
							>
								<Icon class="size-4" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-sm leading-snug">
									<span class="font-medium">{log.actor}</span>
									{#if verb === 'assign' || verb === 'unassign'}
										hat
										{#if log.subject}{@render entityRef(log.subject)}{:else}einen Mieter{/if}
										{verb === 'assign' ? 'der Wohnung' : 'von der Wohnung'}
										{#if log.target}{@render entityRef(log.target)}{:else}<span class="font-medium"
												>(unbekannt)</span
											>{/if}
										{verb === 'assign' ? 'zugewiesen' : 'entfernt'}
									{:else}
										hat {nouns[log.entityType] ?? 'einen Eintrag'}
										{#if log.subject}{@render entityRef(log.subject)}{/if}
										{pasts[verb] ?? ''}
									{/if}
									{#if log.status === 'failed'}
										<span class="text-red-600">(fehlgeschlagen)</span>
									{/if}
								</p>

								{#if log.changes.length > 0}
									<ul class="mt-1.5 flex flex-col gap-1">
										{#each log.changes as change (change.label)}
											<li
												class="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs"
											>
												<span class="text-foreground font-medium">{change.label}:</span>
												<span class="line-through">{change.from}</span>
												<ArrowRightIcon class="size-3 shrink-0" />
												<span class="text-foreground">{change.to}</span>
											</li>
										{/each}
									</ul>
								{/if}
							</div>
							<time
								class="text-muted-foreground shrink-0 text-xs tabular-nums"
								datetime={toDate(log.createdAt).toISOString()}
							>
								{timeFmt.format(toDate(log.createdAt))}
							</time>
						</li>
					{/each}
				</ul>
			</section>
		{/each}

		{#if filtered.length > visible.length}
			<div class="flex justify-center pt-1">
				<Button variant="outline" size="sm" onclick={() => (visibleCount += 40)}>
					Weitere anzeigen
				</Button>
			</div>
		{/if}
	{/if}
</main>
