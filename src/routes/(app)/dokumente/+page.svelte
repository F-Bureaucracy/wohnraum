<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import {
		FileTextIcon,
		HomeIcon,
		HandCoinsIcon,
		ShieldCheckIcon,
		ClipboardListIcon,
		UserCheckIcon,
		GavelIcon,
		KeyRoundIcon,
		HeartHandshakeIcon,
		BanknoteIcon,
		PlusIcon,
		SearchIcon,
		DownloadIcon,
		MoreHorizontalIcon,
		PenLineIcon,
		SendIcon,
	} from '@lucide/svelte';

	type TemplateKey =
		| 'wohnungsangebot'
		| 'mietvertrag'
		| 'kostenuebernahme'
		| 'wbs'
		| 'einweisung'
		| 'wohnungsgeber'
		| 'uebergabeprotokoll'
		| 'hilfeplan'
		| 'mietschuldenfrei'
		| 'wohngeld';

	const templates: {
		key: TemplateKey;
		title: string;
		description: string;
		category: 'Vermittlung' | 'Sozialleistungen' | 'Unterbringung' | 'Betreuung';
		icon: typeof FileTextIcon;
	}[] = [
		{
			key: 'wohnungsangebot',
			title: 'Wohnungsangebot',
			description: 'Vorschlag einer konkreten Wohnung an einen Klienten inkl. Besichtigungstermin.',
			category: 'Vermittlung',
			icon: HomeIcon,
		},
		{
			key: 'mietvertrag',
			title: 'Mietvertrag (Kommunal)',
			description: 'Standardmietvertrag der Kommune für vermittelten Wohnraum.',
			category: 'Vermittlung',
			icon: FileTextIcon,
		},
		{
			key: 'kostenuebernahme',
			title: 'Kostenübernahmeerklärung',
			description:
				'Zusicherung der Übernahme von Miete und Kaution durch Sozialamt oder Jobcenter.',
			category: 'Sozialleistungen',
			icon: HandCoinsIcon,
		},
		{
			key: 'wbs',
			title: 'Wohnberechtigungsschein',
			description: 'Bescheinigung nach §5 WoFG zur Anmietung einer geförderten Wohnung.',
			category: 'Sozialleistungen',
			icon: ShieldCheckIcon,
		},
		{
			key: 'einweisung',
			title: 'Einweisungsverfügung (OBG)',
			description: 'Ordnungsbehördliche Einweisung in eine Notunterkunft zur Gefahrenabwehr.',
			category: 'Unterbringung',
			icon: GavelIcon,
		},
		{
			key: 'wohnungsgeber',
			title: 'Wohnungsgeberbestätigung',
			description: 'Bestätigung des Einzugs nach §19 BMG für die Meldebehörde.',
			category: 'Vermittlung',
			icon: UserCheckIcon,
		},
		{
			key: 'uebergabeprotokoll',
			title: 'Wohnungsübergabeprotokoll',
			description: 'Protokoll zur Übergabe inkl. Zählerstände, Schlüsselübergabe und Mängel.',
			category: 'Vermittlung',
			icon: KeyRoundIcon,
		},
		{
			key: 'hilfeplan',
			title: 'Hilfeplan §67 SGB XII',
			description: 'Individueller Hilfeplan zur Überwindung sozialer Schwierigkeiten.',
			category: 'Betreuung',
			icon: HeartHandshakeIcon,
		},
		{
			key: 'mietschuldenfrei',
			title: 'Mietschuldenfreiheitsbescheinigung',
			description: 'Bestätigung über offene oder beglichene Mietverbindlichkeiten.',
			category: 'Vermittlung',
			icon: ClipboardListIcon,
		},
		{
			key: 'wohngeld',
			title: 'Wohngeldantrag',
			description: 'Vorausgefüllter Antrag auf Wohngeld inkl. Anlagen.',
			category: 'Sozialleistungen',
			icon: BanknoteIcon,
		},
	];

	type Status = 'Entwurf' | 'Versendet' | 'Unterzeichnet' | 'Archiviert';

	const dokumente: {
		id: string;
		titel: string;
		typ: string;
		mieter: string;
		objekt: string;
		bearbeiter: string;
		erstelltAm: Date;
		status: Status;
	}[] = [
		{
			id: 'DOK-2026-0142',
			titel: 'Wohnungsangebot Lindenstr. 14, 2. OG',
			typ: 'Wohnungsangebot',
			mieter: 'Markus Reinhardt',
			objekt: 'Lindenstr. 14, 04275 Leipzig',
			bearbeiter: 'S. Köhler',
			erstelltAm: new Date('2026-05-17'),
			status: 'Versendet',
		},
		{
			id: 'DOK-2026-0141',
			titel: 'Mietvertrag – Adlerweg 7',
			typ: 'Mietvertrag',
			mieter: 'Fatima Yilmaz',
			objekt: 'Adlerweg 7, 04315 Leipzig',
			bearbeiter: 'M. Becker',
			erstelltAm: new Date('2026-05-15'),
			status: 'Unterzeichnet',
		},
		{
			id: 'DOK-2026-0140',
			titel: 'Kostenübernahme Kaution & Erstausstattung',
			typ: 'Kostenübernahmeerklärung',
			mieter: 'Fatima Yilmaz',
			objekt: 'Adlerweg 7, 04315 Leipzig',
			bearbeiter: 'M. Becker',
			erstelltAm: new Date('2026-05-14'),
			status: 'Unterzeichnet',
		},
		{
			id: 'DOK-2026-0139',
			titel: 'Einweisungsverfügung Notunterkunft Eutritzscher Str.',
			typ: 'Einweisungsverfügung (OBG)',
			mieter: 'Andreas Polenz',
			objekt: 'Notunterkunft Eutritzscher Str. 88',
			bearbeiter: 'S. Köhler',
			erstelltAm: new Date('2026-05-12'),
			status: 'Unterzeichnet',
		},
		{
			id: 'DOK-2026-0138',
			titel: 'Wohnberechtigungsschein – §5 WoFG',
			typ: 'Wohnberechtigungsschein',
			mieter: 'Daria Kowalski',
			objekt: '—',
			bearbeiter: 'A. Hartmann',
			erstelltAm: new Date('2026-05-11'),
			status: 'Versendet',
		},
		{
			id: 'DOK-2026-0137',
			titel: 'Hilfeplan §67 SGB XII – Q2/2026',
			typ: 'Hilfeplan',
			mieter: 'Andreas Polenz',
			objekt: 'Notunterkunft Eutritzscher Str. 88',
			bearbeiter: 'A. Hartmann',
			erstelltAm: new Date('2026-05-08'),
			status: 'Entwurf',
		},
		{
			id: 'DOK-2026-0136',
			titel: 'Wohnungsgeberbestätigung – Adlerweg 7',
			typ: 'Wohnungsgeberbestätigung',
			mieter: 'Fatima Yilmaz',
			objekt: 'Adlerweg 7, 04315 Leipzig',
			bearbeiter: 'M. Becker',
			erstelltAm: new Date('2026-05-06'),
			status: 'Unterzeichnet',
		},
		{
			id: 'DOK-2026-0135',
			titel: 'Übergabeprotokoll – Schulstr. 21',
			typ: 'Übergabeprotokoll',
			mieter: 'Jürgen Hoffmann',
			objekt: 'Schulstr. 21, 04229 Leipzig',
			bearbeiter: 'S. Köhler',
			erstelltAm: new Date('2026-04-29'),
			status: 'Archiviert',
		},
		{
			id: 'DOK-2026-0134',
			titel: 'Wohngeldantrag – Erstantrag',
			typ: 'Wohngeldantrag',
			mieter: 'Jürgen Hoffmann',
			objekt: 'Schulstr. 21, 04229 Leipzig',
			bearbeiter: 'A. Hartmann',
			erstelltAm: new Date('2026-04-26'),
			status: 'Archiviert',
		},
	];

	let query = $state('');

	const filtered = $derived(
		dokumente.filter((d) => {
			if (!query.trim()) return true;
			const q = query.toLowerCase();
			return (
				d.titel.toLowerCase().includes(q) ||
				d.mieter.toLowerCase().includes(q) ||
				d.typ.toLowerCase().includes(q) ||
				d.id.toLowerCase().includes(q)
			);
		}),
	);

	function fmtDate(d: Date) {
		return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
	}

	function statusVariant(s: Status): 'default' | 'secondary' | 'outline' | 'destructive' {
		switch (s) {
			case 'Unterzeichnet':
				return 'default';
			case 'Versendet':
				return 'secondary';
			case 'Entwurf':
				return 'outline';
			case 'Archiviert':
				return 'outline';
		}
	}

	const categoryStyles: Record<string, string> = {
		Vermittlung: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
		Sozialleistungen: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
		Unterbringung: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
		Betreuung: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
	};
</script>

<PageHeader title="Dokumente" />

<div class="flex flex-1 flex-col gap-8 p-4 pt-0">
	<!-- Vorlagen -->
	<section class="flex flex-col gap-4">
		<div class="flex items-end justify-between">
			<div>
				<h2 class="text-lg font-semibold">Vorlagen</h2>
				<p class="text-sm text-muted-foreground">
					Neues Dokument aus einer Vorlage erzeugen. Daten aus Mieter- und Objektakte werden
					automatisch eingefügt.
				</p>
			</div>
			<Button variant="outline" size="sm">
				<PlusIcon class="size-4" />
				Eigene Vorlage
			</Button>
		</div>

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
			{#each templates as t (t.key)}
				{@const Icon = t.icon}
				<Card.Root
					class="group cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/40"
				>
					<Card.Header class="gap-3">
						<div class="flex items-start justify-between">
							<div
								class="flex size-9 items-center justify-center rounded-md border bg-background"
							>
								<Icon class="size-5 text-muted-foreground" />
							</div>
							<span
								class="rounded-full px-2 py-0.5 text-xs font-medium {categoryStyles[t.category]}"
							>
								{t.category}
							</span>
						</div>
						<div class="flex flex-col gap-1">
							<Card.Title class="text-base leading-tight">{t.title}</Card.Title>
							<Card.Description class="line-clamp-2 text-xs">
								{t.description}
							</Card.Description>
						</div>
					</Card.Header>
					<Card.Footer class="justify-between pt-0">
						<Button variant="ghost" size="sm" class="px-2 text-xs">
							<PenLineIcon class="size-3.5" />
							Vorlage bearbeiten
						</Button>
						<Button size="sm" class="text-xs">
							Erstellen
						</Button>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	</section>

	<Separator />

	<!-- Erstellte Dokumente -->
	<section class="flex flex-col gap-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-lg font-semibold">Erstellte Dokumente</h2>
				<p class="text-sm text-muted-foreground">
					{filtered.length} von {dokumente.length} Dokumenten
				</p>
			</div>
			<div class="flex items-center gap-2">
				<div class="relative">
					<SearchIcon
						class="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						placeholder="Dokumente durchsuchen…"
						bind:value={query}
						class="w-72 pl-8"
					/>
				</div>
				<Button variant="outline" size="sm">
					<DownloadIcon class="size-4" />
					Exportieren
				</Button>
			</div>
		</div>

		<div class="rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-[140px]">ID</Table.Head>
						<Table.Head>Titel</Table.Head>
						<Table.Head class="w-[200px]">Typ</Table.Head>
						<Table.Head class="w-[180px]">Mieter</Table.Head>
						<Table.Head class="w-[220px]">Mietobjekt</Table.Head>
						<Table.Head class="w-[120px]">Bearbeiter</Table.Head>
						<Table.Head class="w-[110px]">Erstellt</Table.Head>
						<Table.Head class="w-[130px]">Status</Table.Head>
						<Table.Head class="w-[60px]"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filtered as d (d.id)}
						<Table.Row>
							<Table.Cell class="font-mono text-xs text-muted-foreground">{d.id}</Table.Cell>
							<Table.Cell class="font-medium">{d.titel}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{d.typ}</Table.Cell>
							<Table.Cell>{d.mieter}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{d.objekt}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{d.bearbeiter}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{fmtDate(d.erstelltAm)}</Table.Cell>
							<Table.Cell>
								<Badge variant={statusVariant(d.status)}>{d.status}</Badge>
							</Table.Cell>
							<Table.Cell>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<Button {...props} variant="ghost" size="icon" class="size-8">
												<MoreHorizontalIcon class="size-4" />
											</Button>
										{/snippet}
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item>
											<FileTextIcon class="size-4" />
											Öffnen
										</DropdownMenu.Item>
										<DropdownMenu.Item>
											<DownloadIcon class="size-4" />
											Als PDF herunterladen
										</DropdownMenu.Item>
										<DropdownMenu.Item>
											<SendIcon class="size-4" />
											Versenden
										</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item>
											<PenLineIcon class="size-4" />
											Duplizieren
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={9} class="h-24 text-center text-muted-foreground">
								Keine Dokumente gefunden.
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	</section>
</div>
