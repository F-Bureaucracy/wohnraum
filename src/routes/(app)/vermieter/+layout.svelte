<script lang="ts">
	let { children } = $props();
</script>

<div class="flex min-h-svh flex-col">
	<header class="border-b px-6 py-3">
		<div class="text-sm font-medium">Vermieter-Bereich</div>
	</header>
	<main class="flex-1">
		{@render children()}
	</main>
</div>
