<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as ButtonGroup from '$lib/components/ui/button-group/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import LinkIcon from '@lucide/svelte/icons/link';

	let { createHref, createLabel }: { createHref: string; createLabel?: string } = $props();

	type ImportSource = 'immoscout' | 'immowelt';

	const sourceMeta: Record<ImportSource, { name: string; example: string }> = {
		immoscout: {
			name: 'ImmobilienScout24',
			example: 'https://www.immobilienscout24.de/expose/123456789',
		},
		immowelt: {
			name: 'Immowelt',
			example: 'https://www.immowelt.de/expose/abcd1234',
		},
	};

	let dialogOpen = $state(false);
	let source = $state<ImportSource>('immoscout');
	let importUrl = $state('');

	function openImport(next: ImportSource) {
		source = next;
		importUrl = '';
		dialogOpen = true;
	}

	const meta = $derived(sourceMeta[source]);
</script>

<ButtonGroup.Root class="ms-auto">
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
	<Button href={createHref} size="sm">
		<PlusIcon class="size-4" />
		{createLabel}
	</Button>
	<ButtonGroup.Separator class="bg-primary-foreground/30" />
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} size="icon-sm" aria-label="Weitere Optionen">
					<EllipsisVerticalIcon class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-auto min-w-52">
			<DropdownMenu.Label>Importieren aus</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Item onSelect={() => openImport('immoscout')}>
				<DownloadIcon class="size-4" />
				ImmobilienScout24
			</DropdownMenu.Item>
			<DropdownMenu.Item onSelect={() => openImport('immowelt')}>
				<DownloadIcon class="size-4" />
				Immowelt
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</ButtonGroup.Root>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Aus {meta.name} importieren</Dialog.Title>
			<Dialog.Description>
				Fügen Sie den Link zum Exposé bei {meta.name} ein. Wir übernehmen die verfügbaren Angaben
				(Adresse, Zimmer, Fläche, Miete) automatisch in das Formular für ein neues Mietobjekt.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-2 py-2">
			<Label for="import-url">Exposé-Link</Label>
			<div class="relative">
				<LinkIcon
					class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					id="import-url"
					type="url"
					placeholder={meta.example}
					bind:value={importUrl}
					class="pl-9"
				/>
			</div>
			<p class="text-xs text-muted-foreground">Beispiel: {meta.example}</p>
		</div>
		<Dialog.Footer>
			<Dialog.Close class={buttonVariants({ variant: 'outline' })}>Abbrechen</Dialog.Close>
			<Button disabled={importUrl.trim().length === 0}>
				<DownloadIcon class="size-4" />
				Importieren
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
