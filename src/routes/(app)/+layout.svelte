<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { caseworkerNav, companyNav, navWithAuditLog } from '$lib/nav-items';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	const navItems = $derived(
		navWithAuditLog(
			data.activeOrganization?.orgType === 'company' ? companyNav : caseworkerNav,
			data.canViewAuditLog,
		),
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
