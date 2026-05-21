<script lang="ts">
  import {
    LogOutIcon,
    CreditCardIcon,
    ChevronsUpDownIcon,
    BadgeCheckIcon,
    BellIcon,
    SettingsIcon,
  } from '@lucide/svelte';

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { useSidebar } from '$lib/components/ui/sidebar/index.js';
  import { page } from '$app/state';

  const sidebar = useSidebar();
  const user = $derived(page.data.user);
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		{#if !user}
			<Sidebar.MenuButton size="lg">
				{#snippet child({ props })}
					<a href="/login" {...props}>
						<LogOutIcon class="rotate-180" />
						<span>Log in</span>
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		{:else}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						{...props}
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
					>
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user.image} alt={user.name} />
							<Avatar.Fallback class="rounded-lg">
								{user.name
									.split(' ')
									.map((n) => n[0])
									.join('')
									.toUpperCase()
									.slice(0, 2)}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs">{user.email}</span>
						</div>
						<ChevronsUpDownIcon class="ms-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
						<Avatar.Root class="size-8 rounded-lg">
							<Avatar.Image src={user.image} alt={user.name} />
							<Avatar.Fallback class="rounded-lg">
								{user.name
									.split(' ')
									.map((n) => n[0])
									.join('')
									.toUpperCase()
									.slice(0, 2)}
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs">{user.email}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item>
						<BellIcon />
						Notifications
					</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a href="/settings" {...props}>
							<SettingsIcon />
							Settings
						</a>
					{/snippet}
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="w-full">
					{#snippet child({ props })}
						<form method="POST" action="/auth/signout">
							<button {...props} type="submit">
								<LogOutIcon />
								Log out
							</button>
						</form>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		{/if}
	</Sidebar.MenuItem>
</Sidebar.Menu>

