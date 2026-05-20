<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import SendIcon from '@lucide/svelte/icons/send-horizontal';
	import SearchIcon from '@lucide/svelte/icons/search';
	import PaperclipIcon from '@lucide/svelte/icons/paperclip';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import VideoIcon from '@lucide/svelte/icons/video';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';

	type Message = {
		from: 'me' | 'them';
		text: string;
		time: string;
	};

	type Vermieter = {
		id: string;
		name: string;
		objekt: string;
		initials: string;
		lastMessage: string;
		lastTime: string;
		unread: number;
		online: boolean;
		messages: Message[];
	};

	const vermieter: Vermieter[] = [
		{
			id: '1',
			name: 'Klaus Hoffmann',
			objekt: 'Goethestraße 14, Berlin',
			initials: 'KH',
			lastMessage: 'Die Nebenkostenabrechnung sende ich Ihnen morgen zu.',
			lastTime: '09:42',
			unread: 2,
			online: true,
			messages: [
				{ from: 'them', text: 'Guten Morgen Frau Müller!', time: '09:30' },
				{
					from: 'them',
					text: 'Ich wollte mich kurz wegen der Nebenkostenabrechnung melden.',
					time: '09:31'
				},
				{ from: 'me', text: 'Guten Morgen Herr Hoffmann, gerne.', time: '09:35' },
				{ from: 'me', text: 'Wann darf ich damit rechnen?', time: '09:35' },
				{
					from: 'them',
					text: 'Die Nebenkostenabrechnung sende ich Ihnen morgen zu.',
					time: '09:42'
				}
			]
		},
		{
			id: '2',
			name: 'Sabine Wagner',
			objekt: 'Lindenallee 7, München',
			initials: 'SW',
			lastMessage: 'Danke, der Handwerker kommt am Donnerstag.',
			lastTime: 'Gestern',
			unread: 0,
			online: false,
			messages: [
				{ from: 'me', text: 'Die Heizung im Wohnzimmer funktioniert nicht.', time: 'Gestern 14:02' },
				{ from: 'them', text: 'Oh, das tut mir leid. Ich kümmere mich sofort darum.', time: 'Gestern 14:18' },
				{ from: 'them', text: 'Danke, der Handwerker kommt am Donnerstag.', time: 'Gestern 16:05' }
			]
		},
		{
			id: '3',
			name: 'Dr. Thomas Becker',
			objekt: 'Hafenweg 22, Hamburg',
			initials: 'TB',
			lastMessage: 'Bitte unterschreiben Sie den neuen Mietvertrag.',
			lastTime: 'Di',
			unread: 1,
			online: true,
			messages: [
				{ from: 'them', text: 'Hallo, anbei der überarbeitete Mietvertrag.', time: 'Di 10:00' },
				{ from: 'them', text: 'Bitte unterschreiben Sie den neuen Mietvertrag.', time: 'Di 10:01' }
			]
		},
		{
			id: '4',
			name: 'Maria Schulz',
			objekt: 'Rosenweg 3, Köln',
			initials: 'MS',
			lastMessage: 'Schönen Sonntag noch!',
			lastTime: 'So',
			unread: 0,
			online: false,
			messages: [
				{ from: 'me', text: 'Die Miete ist überwiesen.', time: 'So 11:00' },
				{ from: 'them', text: 'Vielen Dank, ist angekommen.', time: 'So 11:30' },
				{ from: 'them', text: 'Schönen Sonntag noch!', time: 'So 11:30' }
			]
		},
		{
			id: '5',
			name: 'Jörg Brandt',
			objekt: 'Schillerplatz 9, Leipzig',
			initials: 'JB',
			lastMessage: 'Ich melde mich nächste Woche wegen der Besichtigung.',
			lastTime: '12.05.',
			unread: 0,
			online: false,
			messages: [
				{
					from: 'them',
					text: 'Ich melde mich nächste Woche wegen der Besichtigung.',
					time: '12.05. 17:20'
				}
			]
		},
		{
			id: '6',
			name: 'Elena Petrova',
			objekt: 'Mozartstraße 18, Dresden',
			initials: 'EP',
			lastMessage: 'Können wir den Termin verschieben?',
			lastTime: '08.05.',
			unread: 0,
			online: true,
			messages: [
				{ from: 'them', text: 'Können wir den Termin verschieben?', time: '08.05. 13:14' }
			]
		}
	];

	let selectedId = $state(vermieter[0].id);
	let draft = $state('');
	const selected = $derived(vermieter.find((v) => v.id === selectedId)!);
</script>

<PageHeader title="Nachrichten" />
<div class="flex flex-1 overflow-hidden">
	<aside class="flex w-80 shrink-0 flex-col border-r">
		<div class="p-3">
			<div class="relative">
				<SearchIcon
					class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
				/>
				<Input placeholder="Suche..." class="pl-8" />
			</div>
		</div>
		<Separator />
		<div class="flex-1 overflow-y-auto">
			{#each vermieter as v (v.id)}
				<button
					type="button"
					onclick={() => (selectedId = v.id)}
					class="hover:bg-accent flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors {selectedId ===
					v.id
						? 'bg-accent'
						: ''}"
				>
					<div class="relative">
						<Avatar.Root class="size-10">
							<Avatar.Fallback>{v.initials}</Avatar.Fallback>
						</Avatar.Root>
						{#if v.online}
							<span
								class="border-background absolute right-0 bottom-0 size-2.5 rounded-full border-2 bg-green-500"
							></span>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline justify-between gap-2">
							<span class="truncate text-sm font-medium">{v.name}</span>
							<span class="text-muted-foreground shrink-0 text-xs">{v.lastTime}</span>
						</div>
						<p class="text-muted-foreground truncate text-xs">{v.objekt}</p>
						<div class="mt-1 flex items-center justify-between gap-2">
							<p class="text-muted-foreground truncate text-xs">{v.lastMessage}</p>
							{#if v.unread > 0}
								<span
									class="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
								>
									{v.unread}
								</span>
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>
	</aside>

	<section class="flex flex-1 flex-col">
		<header class="flex items-center justify-between border-b px-4 py-3">
			<div class="flex items-center gap-3">
				<Avatar.Root class="size-10">
					<Avatar.Fallback>{selected.initials}</Avatar.Fallback>
				</Avatar.Root>
				<div>
					<p class="text-sm font-medium">{selected.name}</p>
					<p class="text-muted-foreground text-xs">
						{selected.online ? 'Online' : 'Zuletzt online'} · {selected.objekt}
					</p>
				</div>
			</div>
			<div class="flex items-center gap-1">
				<Button variant="ghost" size="icon"><PhoneIcon class="size-4" /></Button>
				<Button variant="ghost" size="icon"><VideoIcon class="size-4" /></Button>
				<Button variant="ghost" size="icon"><MoreVerticalIcon class="size-4" /></Button>
			</div>
		</header>

		<div class="flex-1 space-y-3 overflow-y-auto p-4">
			{#each selected.messages as m, i (i)}
				<div class="flex {m.from === 'me' ? 'justify-end' : 'justify-start'}">
					<div
						class="max-w-[70%] rounded-2xl px-4 py-2 text-sm {m.from === 'me'
							? 'bg-primary text-primary-foreground rounded-br-sm'
							: 'bg-muted rounded-bl-sm'}"
					>
						<p class="whitespace-pre-wrap">{m.text}</p>
						<p
							class="mt-1 text-[10px] {m.from === 'me'
								? 'text-primary-foreground/70'
								: 'text-muted-foreground'}"
						>
							{m.time}
						</p>
					</div>
				</div>
			{/each}
		</div>

		<footer class="border-t p-3">
			<form
				class="flex items-center gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					if (!draft.trim()) return;
					selected.messages.push({ from: 'me', text: draft, time: 'jetzt' });
					draft = '';
				}}
			>
				<Button type="button" variant="ghost" size="icon">
					<PaperclipIcon class="size-4" />
				</Button>
				<Input bind:value={draft} placeholder="Nachricht schreiben..." class="flex-1" />
				<Button type="submit" size="icon">
					<SendIcon class="size-4" />
				</Button>
			</form>
		</footer>
	</section>
</div>
