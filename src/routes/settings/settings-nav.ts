import { Building2Icon, UserIcon } from "@lucide/svelte";

type NavItem = { title: string; href: string; icon: typeof UserIcon };
type NavGroup = { section: string; items: NavItem[] };

export function buildSettingsNav({
  canManageOrg,
}: {
  canManageOrg: boolean;
}): NavGroup[] {
  const nav: NavGroup[] = [
    {
      section: "Account",
      items: [{ title: "User", href: "/settings/user", icon: UserIcon }],
    },
  ];

  if (canManageOrg) {
    nav.push({
      section: "Organization",
      items: [
        {
          title: "General",
          href: "/settings/organization",
          icon: Building2Icon,
        },
      ],
    });
  }

  return nav;
}
