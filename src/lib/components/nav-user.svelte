<script lang="ts">
  import {
    LogOutIcon,
    ChevronsUpDownIcon,
    BellIcon,
    SettingsIcon,
  } from '@lucide/svelte';

  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { useSidebar } from '$lib/components/ui/sidebar/index.js';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';

  const sidebar = useSidebar();
  const user = $derived(page.data.user);
  const notifications = $derived(page.data.notifications ?? []);
  const unreadCount = $derived(notifications.length);
  let notificationsOpen = $state(false);

  const dateFmt = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  function initials(name: string) {
    return name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function formatDate(value: string | Date) {
    return dateFmt.format(value instanceof Date ? value : new Date(value));
  }

  function notificationTitle(type: string) {
    return type === 'incoming-invitation' ? 'Neue Einladung' : 'Offene Einladung';
  }

  function notificationDescription(notification: (typeof notifications)[number]) {
    if (notification.type === 'incoming-invitation') {
      return `${notification.inviterName ?? 'Jemand'} hat Sie zu ${notification.organizationName} eingeladen.`;
    }

    return `${notification.email} wurde zu ${notification.organizationName} eingeladen.`;
  }
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		{#if !user}
			<Sidebar.MenuButton size="lg">
				{#snippet child({ props })}
					<a href={resolve('/login')} {...props}>
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
								{initials(user.name)}
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
								{initials(user.name)}
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
					<DropdownMenu.Item onclick={() => (notificationsOpen = true)}>
						<BellIcon />
						<span class="flex-1">Benachrichtigungen</span>
						{#if unreadCount > 0}
							<Badge variant="secondary" class="ms-auto h-5 min-w-5 px-1.5">{unreadCount}</Badge>
						{/if}
					</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a href={resolve('/settings')} {...props}>
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

<Dialog.Root bind:open={notificationsOpen}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Benachrichtigungen</Dialog.Title>
			<Dialog.Description>Aktuelle Hinweise und offene Einladungen.</Dialog.Description>
		</Dialog.Header>

		{#if notifications.length === 0}
			<div class="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
				Keine neuen Benachrichtigungen.
			</div>
		{:else}
			<div class="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
				{#each notifications as notification (notification.id)}
					<div class="rounded-md border p-3">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0 space-y-1">
								<div class="text-sm font-medium">{notificationTitle(notification.type)}</div>
								<p class="text-muted-foreground text-sm">
									{notificationDescription(notification)}
								</p>
								<div class="text-muted-foreground text-xs">
									Rolle: {notification.role ?? 'member'} · Ablauf: {formatDate(notification.expiresAt)}
								</div>
							</div>
							<Badge variant="outline">Einladung</Badge>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<Dialog.Footer>
			<a
				href={resolve('/users')}
				class="border-border bg-background hover:bg-muted hover:text-foreground inline-flex h-8 items-center justify-center rounded-md border px-2.5 text-sm font-medium shadow-xs"
			>
				Einladungen verwalten
			</a>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
