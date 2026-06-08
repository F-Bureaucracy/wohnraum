<script lang="ts">
import { page } from '$app/state';
import { ChevronLeftIcon } from '@lucide/svelte';
import { MediaQuery } from 'svelte/reactivity';
import { buildSettingsNav } from './settings-nav';
import type { LayoutProps } from './$types';

const { children, data }: LayoutProps = $props();

const isWide = new MediaQuery('(min-width: 1024px)');
const settingsNav = $derived(
	buildSettingsNav({
		canManageOrg: data.canManageOrg,
		isAdministration: data.isAdministration,
	}),
);
</script>

{#if isWide.current}
	<div class="flex h-screen bg-background">
		<aside class="flex w-56 shrink-0 flex-col border-r">
			<div class="p-4">
				<a
					href="/"
					class="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
				>
					<ChevronLeftIcon class="h-4 w-4" />
					Zurück
				</a>
			</div>
			<nav class="flex-1 overflow-auto px-3 pb-4">
				{#each settingsNav as group (group.section)}
					<p class="mb-1 px-2 pt-4 text-xs font-medium text-muted-foreground">{group.section}</p>
					{#each group.items as item (item.href)}
						<a
							href={item.href}
							class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground {page
								.url.pathname === item.href
								? 'bg-accent font-medium text-accent-foreground'
								: 'text-muted-foreground'}"
						>
							<item.icon class="h-4 w-4 shrink-0" />
							{item.title}
						</a>
					{/each}
				{/each}
			</nav>
		</aside>
		<main class="flex-1 overflow-auto">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}
