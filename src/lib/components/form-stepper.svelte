<script lang="ts" module>
	export type StepperStep = { id: string; label: string };
</script>

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils';

	let {
		steps,
		activeId,
		onSelect,
	}: {
		steps: StepperStep[];
		activeId: string;
		onSelect?: (id: string) => void;
	} = $props();

	const activeIndex = $derived(steps.findIndex((s) => s.id === activeId));
</script>

<nav aria-label="Formular-Schritte" class="flex flex-col gap-1">
	{#each steps as step, i (step.id)}
		{@const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'upcoming'}
		<button
			type="button"
			onclick={() => onSelect?.(step.id)}
			class={cn(
				'group flex items-start gap-3 rounded-md px-2 py-2 text-start transition-colors',
				state === 'active' && 'bg-muted/60',
				state !== 'active' && 'hover:bg-muted/40',
			)}
		>
			<span
				class={cn(
					'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
					state === 'done' && 'border-primary bg-primary text-primary-foreground',
					state === 'active' && 'border-primary text-primary',
					state === 'upcoming' && 'border-muted-foreground/30 text-muted-foreground',
				)}
			>
				{#if state === 'done'}
					<CheckIcon class="size-3.5" />
				{:else}
					{i + 1}
				{/if}
			</span>
			<span
				class={cn(
					'pt-0.5 text-sm',
					state === 'active' && 'font-medium text-foreground',
					state === 'done' && 'text-foreground',
					state === 'upcoming' && 'text-muted-foreground',
				)}
			>
				{step.label}
			</span>
		</button>
	{/each}
</nav>
