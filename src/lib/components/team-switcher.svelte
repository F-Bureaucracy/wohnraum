<script lang="ts" module>
export type Organization = { id: string; name: string; slug: string };
</script>

<script lang="ts">
import { applyAction, deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { ActionResult } from '@sveltejs/kit';
import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
import * as Sidebar from '$lib/components/ui/sidebar/index.js';
import { useSidebar } from '$lib/components/ui/sidebar/index.js';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import { toast } from 'svelte-sonner';
import type { CreateOrganizationSchema } from '../../routes/(app)/organizations/schema';
import AddOrganizationDialog from './add-organization-dialog.svelte';
import { ChevronsUpDownIcon, PlusIcon } from '@lucide/svelte';
import faviconUrl from '$lib/assets/favicon.svg';

let {
	organizations,
	activeOrganizationId,
	createOrganizationForm,
}: {
	organizations: Organization[];
	activeOrganizationId: string | null;
	createOrganizationForm: SuperValidated<Infer<CreateOrganizationSchema>>;
} = $props();

const sidebar = useSidebar();
let dialogOpen = $state(false);

const activeOrg = $derived(
	organizations.find((o) => o.id === activeOrganizationId) ?? organizations[0],
);

async function setActive(organizationId: string) {
	if (organizationId === activeOrganizationId) return;
	const body = new FormData();
	body.append('organizationId', organizationId);
	const response = await fetch('/organizations?/setActiveOrganization', {
		method: 'POST',
		body,
	});
	const result: ActionResult = deserialize(await response.text());
	if (result.type === 'success') {
		await invalidateAll();
	} else if (result.type === 'failure' || result.type === 'error') {
		toast.error('Failed to switch organization');
	}
	await applyAction(result);
}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<div
							class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
						>
							<img src={faviconUrl} alt="Osnabrück" class="size-4" />
						</div>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">
								{activeOrg?.name ?? 'No organization'}
							</span>
							{#if activeOrg}
								<span class="truncate text-xs">{activeOrg.slug}</span>
							{/if}
						</div>
						<ChevronsUpDownIcon class="ms-auto" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				align="start"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				sideOffset={4}
			>
				<DropdownMenu.Label class="text-xs text-muted-foreground">Organizations</DropdownMenu.Label>
				{#each organizations as org, index (org.id)}
					<DropdownMenu.Item onSelect={() => setActive(org.id)} class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded-md border">
							<img src={faviconUrl} alt="" class="size-3.5 shrink-0" />
						</div>
						{org.name}
						<DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				{/each}
				<DropdownMenu.Separator />
				<DropdownMenu.Item onSelect={() => (dialogOpen = true)} class="gap-2 p-2">
					<div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
						<PlusIcon class="size-4" />
					</div>
					<div class="font-medium text-muted-foreground">Add organization</div>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>

<AddOrganizationDialog bind:open={dialogOpen} data={createOrganizationForm} />

