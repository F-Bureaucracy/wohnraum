<script lang="ts">
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import { AreaChart } from 'layerchart';
	import PageHeader from '$lib/components/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import type { ChartConfig } from '$lib/components/ui/chart/index.js';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const isCompany = $derived(data.orgType === 'company');
	const chartTitle = $derived(
		isCompany ? 'Mietobjekte und Verfügbarkeit' : 'Neue Mietobjekte und Mieter',
	);
	const chartDescription = $derived(
		isCompany
			? 'Eingestellte Objekte und Verfügbarkeitsdaten der letzten sechs Monate'
			: 'Erfasste Mietobjekte und Mieter der letzten sechs Monate',
	);
	const emptyRecent = $derived(
		isCompany ? 'Noch keine Mietobjekte angelegt.' : 'Noch keine Mietobjekte erfasst.',
	);
	const recentTitle = $derived(isCompany ? 'Ihre letzten Mietobjekte' : 'Neue Mietobjekte');

	const chartConfig = $derived({
		mietobjekte: {
			label: 'Mietobjekte',
			color: 'var(--chart-1)',
		},
		mieter: {
			label: 'Mieter',
			color: 'var(--chart-2)',
		},
		verfuegbar: {
			label: 'Verfügbar ab',
			color: 'var(--chart-3)',
		},
	} satisfies ChartConfig);

	const chartSeries = $derived(
		isCompany
			? [
					{
						key: 'mietobjekte',
						label: 'Mietobjekte',
						color: 'var(--color-mietobjekte)',
					},
					{
						key: 'verfuegbar',
						label: 'Verfügbar ab',
						color: 'var(--color-verfuegbar)',
					},
				]
			: [
					{
						key: 'mietobjekte',
						label: 'Mietobjekte',
						color: 'var(--color-mietobjekte)',
					},
					{
						key: 'mieter',
						label: 'Mieter',
						color: 'var(--color-mieter)',
					},
				],
	);
</script>

<PageHeader title="Dashboard" />

<div class="flex flex-1 flex-col gap-6 p-4 pt-0 md:p-6 md:pt-0">
	<section class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div class="min-w-0">
			<p class="text-muted-foreground text-sm">
				{isCompany ? 'Vermieter-Übersicht' : 'Sachbearbeitung'}
			</p>
			<h1 class="mt-1 text-2xl font-semibold tracking-normal md:text-3xl">
				Aktueller Stand der Wohnraumvermittlung
			</h1>
		</div>
	</section>

	<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each data.stats as stat (stat.label)}
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Description>{stat.label}</Card.Description>
					<Card.Title class="text-3xl tabular-nums">{stat.value}</Card.Title>
				</Card.Header>
				<Card.Content>
					<p class="text-muted-foreground text-sm">{stat.detail}</p>
				</Card.Content>
			</Card.Root>
		{/each}
	</section>

	<section class="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
		<Card.Root class="min-w-0">
			<Card.Header>
				<Card.Title>{chartTitle}</Card.Title>
				<Card.Description>{chartDescription}</Card.Description>
			</Card.Header>
			<Card.Content>
				{#snippet chartTooltip()}
					<Chart.Tooltip />
				{/snippet}
				<Chart.Container config={chartConfig} class="h-[18rem] w-full">
					<AreaChart
						data={data.chart}
						x="month"
						series={chartSeries}
						seriesLayout="overlap"
						height={288}
						axis="x"
						grid={{ y: true }}
						tooltip={chartTooltip}
						props={{
							area: { fillOpacity: 0.24 },
							line: { strokeWidth: 2 },
						}}
					/>
				</Chart.Container>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>{recentTitle}</Card.Title>
				<Card.Description>Schneller Zugriff auf aktuelle Datensätze</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if data.recent.length > 0}
					<div class="grid gap-2">
						{#each data.recent as item (item.href)}
							<a
								href={item.href}
								class="border-border hover:bg-muted/60 block rounded-md border p-3 transition-colors"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-medium">{item.title}</p>
										<p class="text-muted-foreground mt-1 truncate text-xs">{item.meta}</p>
									</div>
									<ArrowUpRightIcon class="text-muted-foreground mt-0.5 size-4 shrink-0" />
								</div>
							</a>
						{/each}
					</div>
				{:else}
					<p class="text-muted-foreground text-sm">{emptyRecent}</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</section>
</div>
