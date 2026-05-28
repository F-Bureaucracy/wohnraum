<script lang="ts">
import { goto } from '$app/navigation';
import { ChevronRightIcon } from '@lucide/svelte';
import { MediaQuery } from 'svelte/reactivity';
import { buildSettingsNav } from './settings-nav';
import type { PageProps } from './$types';

const { data }: PageProps = $props();

const isWide = new MediaQuery('(min-width: 1024px)');
const settingsNav = $derived(
	buildSettingsNav({
		canManageOrg: data.canManageOrg,
		isAdministration: data.isAdministration,
	}),
);

$effect(() => {
	if (isWide.current) {
		goto('/settings/user', { replaceState: true });
	}
});
</script>

{#if !isWide.current}
	<div class="flex h-screen flex-col">
		<header class="flex h-14 items-center justify-center border-b px-4">
			<h1 class="text-base font-semibold">Settings</h1>
		</header>
		<nav class="flex-1 overflow-auto">
			{#each settingsNav as group (group.section)}
				<p class="px-4 pt-6 pb-2 text-xs font-medium text-muted-foreground">{group.section}</p>
				{#each group.items as item (item.href)}
					<a
						href={item.href}
						class="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent"
					>
						<item.icon class="h-5 w-5 text-muted-foreground" />
						<span class="flex-1">{item.title}</span>
						<ChevronRightIcon class="h-4 w-4 text-muted-foreground" />
					</a>
				{/each}
			{/each}
		</nav>
	</div>
{/if}
