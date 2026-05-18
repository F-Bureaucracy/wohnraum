import { toast } from "svelte-sonner";
import type { SuperValidated } from "sveltekit-superforms";

export function notify(form: SuperValidated<Record<string, unknown>>) {
  if (!form.message) return;
  if (form.valid) {
    toast.success(String(form.message));
  } else {
    toast.error(String(form.message));
  }
}
