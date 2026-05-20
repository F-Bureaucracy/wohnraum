<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let {
		title,
		parent,
	}: {
		title: string;
		parent?: { label: string; href: string };
	} = $props();
</script>

<header
	class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
>
	<div class="flex items-center gap-2 px-4">
		<Sidebar.Trigger class="-ms-1" />
		<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
		<Breadcrumb.Root>
			<Breadcrumb.List>
				{#if parent}
					<Breadcrumb.Item>
						<Breadcrumb.Link href={parent.href}>{parent.label}</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator />
				{/if}
				<Breadcrumb.Item>
					<Breadcrumb.Page>{title}</Breadcrumb.Page>
				</Breadcrumb.Item>
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
</header>
