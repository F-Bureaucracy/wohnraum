<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { caseworkerNav, companyNav } from '$lib/nav-items';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	const navItems = $derived(
		data.activeOrganization?.orgType === 'company' ? companyNav : caseworkerNav,
	);
</script>

<Sidebar.Provider>
	<AppSidebar
		items={navItems}
		organizations={data.organizations}
		activeOrganizationId={data.activeOrganization?.id ?? null}
		createOrganizationForm={data.createOrganizationForm}
	/>
	<Sidebar.Inset class="min-w-0">
		{@render children()}
	</Sidebar.Inset>
</Sidebar.Provider>
