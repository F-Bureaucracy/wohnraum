<script lang="ts">
import type { PageData } from "./$types";
import LoginForm from "./login-form.svelte";

let { data }: { data: PageData } = $props();
</script>

<div class="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
	<div class="w-full max-w-sm">
		<LoginForm {data} />
	</div>
</div>
