<script lang="ts">
	import PageHeader from '$lib/components/page-header.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const dateFmt = new Intl.DateTimeFormat('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});

	function formatDate(value: string | Date | null | undefined) {
		if (!value) return '—';
		const d = value instanceof Date ? value : new Date(value);
		return dateFmt.format(d);
	}

	const roleLabels: Record<string, string> = {
		owner: 'Inhaber',
		admin: 'Administrator',
		member: 'Mitglied'
	};

	function initials(name: string) {
		return name
			.split(' ')
			.map((p) => p[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}
</script>

<PageHeader title="Benutzer" />

<div class="flex flex-1 flex-col gap-4 p-4 pt-0">
	{#if data.users.length === 0}
		<div class="flex flex-1 items-center justify-center p-6">
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<UsersRoundIcon />
					</Empty.Media>
					<Empty.Title>Noch keine Benutzer</Empty.Title>
					<Empty.Description>
						Es sind keine Mitglieder in dieser Organisation vorhanden.
					</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		</div>
	{:else}
		<div class="w-full overflow-x-auto rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>E-Mail</Table.Head>
						<Table.Head>Rolle</Table.Head>
						<Table.Head>Mitglied seit</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.users as u (u.id)}
						<Table.Row>
							<Table.Cell>
								<div class="flex items-center gap-3">
									<Avatar.Root class="size-8">
										{#if u.image}
											<Avatar.Image src={u.image} alt={u.name} />
										{/if}
										<Avatar.Fallback class="text-xs">{initials(u.name)}</Avatar.Fallback>
									</Avatar.Root>
									<span class="font-medium">{u.name}</span>
								</div>
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">{u.email}</Table.Cell>
							<Table.Cell>
								<Badge variant="secondary">{roleLabels[u.role] ?? u.role}</Badge>
							</Table.Cell>
							<Table.Cell class="text-muted-foreground">{formatDate(u.joinedAt)}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
