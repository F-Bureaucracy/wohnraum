<script lang="ts">
import { ChevronLeftIcon } from '@lucide/svelte';
import { MediaQuery } from 'svelte/reactivity';
import type { PageData } from './$types.js';
import EmailForm from './forms/email-form.svelte';
import PasswordForm from './forms/password-form.svelte';
import ProfileForm from './forms/profile-form.svelte';

const isWide = new MediaQuery('(min-width: 1024px)');

let { data }: { data: PageData } = $props();
</script>

<div class="flex h-full flex-col">
	<header class="flex h-14 shrink-0 items-center gap-3 border-b px-6">
		{#if !isWide.current}
			<a href="/settings" class="text-muted-foreground transition-colors hover:text-foreground">
				<ChevronLeftIcon class="h-5 w-5" />
			</a>
		{/if}
		<h1 class="text-base font-semibold">User</h1>
	</header>
	<div class="flex-1 overflow-auto p-6">
		<div class="max-w-2xl space-y-4">
			<ProfileForm form={data.profileForm} email={data.user.email} />
			<EmailForm form={data.emailForm} />
			<PasswordForm form={data.passwordForm} />
		</div>
	</div>
</div>
