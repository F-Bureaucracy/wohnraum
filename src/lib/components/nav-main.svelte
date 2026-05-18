<script lang="ts">
	import { page } from "$app/state";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	let {
		items,
	}: {
		items: {
			title: string;
			url: string;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			icon?: any;
		}[];
	} = $props();

	function isActive(url: string, pathname: string) {
		if (url === "/") return pathname === "/";
		return pathname === url || pathname.startsWith(url + "/");
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as item (item.title)}
			{@const active = isActive(item.url, page.url.pathname)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton tooltipContent={item.title} isActive={active}>
					{#snippet child({ props })}
						<a href={item.url} {...props}>
							{#if item.icon}
								<item.icon />
							{/if}
							<span>{item.title}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
