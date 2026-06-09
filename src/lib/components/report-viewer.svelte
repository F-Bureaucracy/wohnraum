<script lang="ts">
	import 'prosekit/basic/style.css';
	import 'prosekit/basic/typography.css';
	import 'prosekit/extensions/table/style.css';
	import { onMount } from 'svelte';
	import { createEditor, union } from 'prosekit/core';
	import { defineBasicExtension } from 'prosekit/basic';
	import { defineReadonly } from 'prosekit/extensions/readonly';

	let { html }: { html: string } = $props();

	let mountEl: HTMLDivElement;

	onMount(() => {
		// f-omnes returns a full HTML document; ProseMirror only understands the
		// body's flow content, so pull out the body and drop the head and styles.
		const body = new DOMParser().parseFromString(html, 'text/html').body.innerHTML;
		const editor = createEditor({
			extension: union(defineBasicExtension(), defineReadonly()),
			defaultContent: body
		});
		const unmount = editor.mount(mountEl);
		return unmount;
	});
</script>

<div
	bind:this={mountEl}
	class="report-content max-w-none rounded-md border bg-background p-6 sm:p-8"
></div>

<style>
	/* The report comes from an untrusted external service; keep the rendered
	   document readable but contained within the app's typography. */
	.report-content :global(.ProseMirror) {
		outline: none;
	}
	.report-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		margin: 0.75rem 0;
	}
	.report-content :global(th),
	.report-content :global(td) {
		border: 1px solid var(--color-border);
		padding: 0.375rem 0.5rem;
		text-align: left;
		vertical-align: top;
	}
</style>
