<script lang="ts">
import BookmarkIcon from "@lucide/svelte/icons/bookmark";
import { enhance } from "$app/forms";
import { Button } from "$lib/components/ui/button/index.js";
import type {
	ButtonSize,
	ButtonVariant,
} from "$lib/components/ui/button/index.js";

let {
	entityType,
	entityId,
	bookmarked,
	action,
	label,
	variant = "ghost",
	size = "icon",
}: {
	entityType: "mietobjekt" | "mieter";
	entityId: string;
	bookmarked: boolean;
	action: string;
	label?: string;
	variant?: ButtonVariant;
	size?: ButtonSize;
} = $props();

let saving = $state(false);
</script>

<form
	method="POST"
	{action}
	use:enhance={() => {
		saving = true;
		return async ({ update }) => {
			await update();
			saving = false;
		};
	}}
>
	<input type="hidden" name="entityType" value={entityType} />
	<input type="hidden" name="entityId" value={entityId} />
	<Button
		type="submit"
		{variant}
		{size}
		disabled={saving}
		aria-pressed={bookmarked}
		aria-label={bookmarked ? "Lesezeichen entfernen" : "Lesezeichen hinzufügen"}
		title={bookmarked ? "Lesezeichen entfernen" : "Lesezeichen hinzufügen"}
	>
		<BookmarkIcon class="size-4 {bookmarked ? 'fill-current' : ''}" />
		{#if label}{label}{/if}
	</Button>
</form>
