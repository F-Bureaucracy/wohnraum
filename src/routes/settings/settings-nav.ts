import { Building2Icon, SlidersHorizontalIcon, UserIcon } from "@lucide/svelte";

type NavItem = { title: string; href: string; icon: typeof UserIcon };
type NavGroup = { section: string; items: NavItem[] };

export function buildSettingsNav({
  canManageOrg,
  isAdministration,
}: {
  canManageOrg: boolean;
  isAdministration: boolean;
}): NavGroup[] {
  const nav: NavGroup[] = [
    {
      section: "Account",
      items: [{ title: "User", href: "/settings/user", icon: UserIcon }],
    },
  ];

  if (canManageOrg) {
    const items: NavItem[] = [
      {
        title: "General",
        href: "/settings/organization",
        icon: Building2Icon,
      },
    ];
    if (isAdministration) {
      items.push({
        title: "Filter",
        href: "/settings/organization/filters",
        icon: SlidersHorizontalIcon,
      });
    }
    nav.push({ section: "Organization", items });
  }

  return nav;
}
