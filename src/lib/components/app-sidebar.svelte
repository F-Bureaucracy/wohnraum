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
				url: "/vermieter",
				icon: UsersIcon,
			},
			{
				title: "Mieter",
				url: "/mieter",
				icon: KeyIcon,
			},
			{
				title: "Mietobjekte",
				url: "/mietobjekte",
				icon: Building2Icon,
			},
			{
				title: "Dokumente",
				url: "/dokumente",
				icon: FileTextIcon,
			},
			{
				title: "Nachrichten",
				url: "/nachrichten",
				icon: MessageSquareIcon,
			},
		],
	};
</script>

<script lang="ts">
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";
	import TeamSwitcher from "./team-switcher.svelte";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		collapsible = "icon",
		...restProps
	}: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<TeamSwitcher teams={data.teams} />
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={data.navMain} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
