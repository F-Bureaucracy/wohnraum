<script lang="ts" module>
	export type Message = {
		from: 'me' | 'them';
		text: string;
		time: string;
	};

	export type Contact = {
		id: string;
		name: string;
		subtitle: string;
		initials: string;
		lastMessage: string;
		lastTime: string;
		unread: number;
		online: boolean;
		messages: Message[];
	};
</script>

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

	let { contacts, title = 'Nachrichten' }: { contacts: Contact[]; title?: string } = $props();

	let selectedId = $state(contacts[0].id);
	let draft = $state('');
	const selected = $derived(contacts.find((c) => c.id === selectedId)!);
</script>

<PageHeader {title} />
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
			{#each contacts as c (c.id)}
				<button
					type="button"
					onclick={() => (selectedId = c.id)}
					class="hover:bg-accent flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors {selectedId ===
					c.id
						? 'bg-accent'
						: ''}"
				>
					<div class="relative">
						<Avatar.Root class="size-10">
							<Avatar.Fallback>{c.initials}</Avatar.Fallback>
						</Avatar.Root>
						{#if c.online}
							<span
								class="border-background absolute right-0 bottom-0 size-2.5 rounded-full border-2 bg-green-500"
							></span>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline justify-between gap-2">
							<span class="truncate text-sm font-medium">{c.name}</span>
							<span class="text-muted-foreground shrink-0 text-xs">{c.lastTime}</span>
						</div>
						<p class="text-muted-foreground truncate text-xs">{c.subtitle}</p>
						<div class="mt-1 flex items-center justify-between gap-2">
							<p class="text-muted-foreground truncate text-xs">{c.lastMessage}</p>
							{#if c.unread > 0}
								<span
									class="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium"
								>
									{c.unread}
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
						{selected.online ? 'Online' : 'Zuletzt online'} · {selected.subtitle}
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
