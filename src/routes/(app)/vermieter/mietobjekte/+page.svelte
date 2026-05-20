<script lang="ts">
import { buttonVariants } from "$lib/components/ui/button/index.js";
</script>

<div class="p-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold">Mietobjekte</h1>
		<a href="/vermieter/mietobjekte/new" class={buttonVariants({ variant: "default" })}>
			Neues Mietobjekt
		</a>
	</div>
	<p class="text-muted-foreground mt-2 text-sm">
		Hier erscheinen alle Wohnungen, die Sie zur Vermietung angeboten haben.
	</p>
</div>
