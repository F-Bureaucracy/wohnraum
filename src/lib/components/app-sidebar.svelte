<script lang="ts" module>
	import AudioWaveformIcon from "@lucide/svelte/icons/audio-waveform";
	import CommandIcon from "@lucide/svelte/icons/command";
	import UsersIcon from "@lucide/svelte/icons/users";
	import faviconUrl from "$lib/assets/favicon.svg";
	import KeyIcon from "@lucide/svelte/icons/key";
	import Building2Icon from "@lucide/svelte/icons/building-2";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";

	const data = {
		teams: [
			{
				name: "Osnabrück",
				logo: faviconUrl,
				plan: "Enterprise",
			},
			{
				name: "Acme Inc.",
				logo: AudioWaveformIcon,
				plan: "Startup",
			},
			{
				name: "Evil Corp.",
				logo: CommandIcon,
				plan: "Free",
			},
		],
		navMain: [
			{
				title: "Vermieter",
				url: "/admin/vermieter",
				icon: UsersIcon,
			},
			{
				title: "Mieter",
				url: "/admin/mieter",
				icon: KeyIcon,
			},
			{
				title: "Mietobjekte",
				url: "/admin/mietobjekte",
				icon: Building2Icon,
			},
			{
				title: "Dokumente",
				url: "/admin/dokumente",
				icon: FileTextIcon,
			},
			{
				title: "Nachrichten",
				url: "/admin/nachrichten",
				icon: MessageSquareIcon,
			},
		],
	};
</script>

<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import TeamSwitcher, { type Organization } from "./team-switcher.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps, Component } from "svelte";
	import type { Infer, SuperValidated } from "sveltekit-superforms";
	import type { CreateOrganizationSchema } from "../../routes/(app)/organizations/schema";

	type NavItem = { title: string; url: string; icon: Component };

	let {
		ref = $bindable(null),
		collapsible = "icon",
		items = data.navMain,
		organizations,
		activeOrganizationId,
		createOrganizationForm,
		...restProps
	}: ComponentProps<typeof Sidebar.Root> & {
		items?: NavItem[];
		organizations: Organization[];
		activeOrganizationId: string | null;
		createOrganizationForm: SuperValidated<Infer<CreateOrganizationSchema>>;
	} = $props();
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher
			{organizations}
			{activeOrganizationId}
			{createOrganizationForm}
		/>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain {items} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
