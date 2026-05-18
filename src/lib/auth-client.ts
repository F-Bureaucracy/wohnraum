import { createAuthClient } from "better-auth/svelte"; // make sure to import from better-auth/svelte
import { auditLogClient } from "better-auth-audit-logs/client";

export const authClient = createAuthClient({
  plugins: [auditLogClient()],
});
