<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar
		organizations={data.organizations}
		activeOrganizationId={data.activeOrganization?.id ?? null}
		createOrganizationForm={data.createOrganizationForm}
	/>
	<Sidebar.Inset class="min-w-0">
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
