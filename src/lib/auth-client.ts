import { createAuthClient } from "better-auth/svelte"; // make sure to import from better-auth/svelte
import { organizationClient } from "better-auth/client/plugins";
import { auditLogClient } from "better-auth-audit-logs/client";

export const authClient = createAuthClient({
  plugins: [auditLogClient(), organizationClient({ teams: { enabled: true } })],
});
