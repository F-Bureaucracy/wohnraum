<script lang="ts">
	import 'prosekit/basic/style.css';
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
	class="report-content mx-auto w-full max-w-3xl rounded-md border bg-background p-6 sm:p-8"
></div>

<style>
	/* The report HTML comes from an external service with its own print-oriented
	   styling. We drop prosekit's typography.css and apply our own so the report
	   inherits the app's font (Inter) and reads like the rest of the UI. */
	.report-content :global(.ProseMirror) {
		font-family: inherit;
		font-size: 0.875rem;
		line-height: 1.6;
		color: var(--color-foreground);
		outline: none;
	}
	.report-content :global(.ProseMirror > :first-child) {
		margin-top: 0;
	}
	.report-content :global(h1) {
		font-size: 1.5rem;
		font-weight: 600;
		line-height: 1.25;
		margin: 1.5rem 0 0.75rem;
	}
	.report-content :global(h2) {
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1.3;
		margin: 1.75rem 0 0.5rem;
		padding-bottom: 0.25rem;
		border-bottom: 1px solid var(--color-border);
	}
	.report-content :global(h3) {
		font-size: 1rem;
		font-weight: 600;
		margin: 1.25rem 0 0.5rem;
	}
	.report-content :global(p) {
		margin: 0 0 0.75rem;
	}
	.report-content :global(ul),
	.report-content :global(ol) {
		margin: 0 0 0.75rem;
		padding-left: 1.5rem;
	}
	.report-content :global(li) {
		margin: 0.25rem 0;
	}
	.report-content :global(a) {
		color: var(--color-primary);
		text-decoration: underline;
	}
	.report-content :global(code) {
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.8125em;
		background: var(--color-muted);
		border-radius: 0.25rem;
		padding: 0.1em 0.3em;
	}
	.report-content :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
		margin: 0.75rem 0;
	}
	.report-content :global(th),
	.report-content :global(td) {
		border: 1px solid var(--color-border);
		padding: 0.375rem 0.5rem;
		text-align: left;
		vertical-align: top;
	}
	.report-content :global(th) {
		font-weight: 600;
		background: var(--color-muted);
	}
	.report-content :global(img),
	.report-content :global(svg) {
		max-width: 100%;
		height: auto;
	}
</style>
