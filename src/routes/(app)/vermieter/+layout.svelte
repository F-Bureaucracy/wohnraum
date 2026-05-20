<script lang="ts">
import Building2Icon from "@lucide/svelte/icons/building-2";
import MessageSquareIcon from "@lucide/svelte/icons/message-square";
import AppSidebar from "$lib/components/app-sidebar.svelte";
import * as Sidebar from "$lib/components/ui/sidebar/index.js";
import type { LayoutData } from "./$types";

let { children, data }: { children: import("svelte").Snippet; data: LayoutData } = $props();

const navItems = [
	{
		title: "Mietobjekte",
		url: "/vermieter/mietobjekte",
		icon: Building2Icon,
	},
	{
		title: "Nachrichten",
		url: "/vermieter/nachrichten",
		icon: MessageSquareIcon,
	},
];
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
