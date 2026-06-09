import Building2Icon from "@lucide/svelte/icons/building-2";
import ChartAreaIcon from "@lucide/svelte/icons/chart-area";
import FileTextIcon from "@lucide/svelte/icons/file-text";
import HandshakeIcon from "@lucide/svelte/icons/handshake";
import HistoryIcon from "@lucide/svelte/icons/history";
import KeyIcon from "@lucide/svelte/icons/key";
import UsersRoundIcon from "@lucide/svelte/icons/users-round";
import type { Component } from "svelte";

export type NavItem = { title: string; url: string; icon: Component };

export const caseworkerNav: NavItem[] = [
  { title: "Dashboard", url: "/", icon: ChartAreaIcon },
  { title: "Vermieter", url: "/admin/vermieter", icon: HandshakeIcon },
  { title: "Mieter", url: "/admin/mieter", icon: KeyIcon },
  { title: "Mietobjekte", url: "/admin/mietobjekte", icon: Building2Icon },
  { title: "Berichte", url: "/admin/berichte", icon: FileTextIcon },
  { title: "Benutzer", url: "/users", icon: UsersRoundIcon },
];

export const companyNav: NavItem[] = [
  { title: "Dashboard", url: "/", icon: ChartAreaIcon },
  {
    title: "Mietobjekte",
    url: "/vermieter/mietobjekte",
    icon: Building2Icon,
  },
  { title: "Benutzer", url: "/users", icon: UsersRoundIcon },
];

const auditLogNavItem: NavItem = {
  title: "Änderungen",
  url: "/audit-log",
  icon: HistoryIcon,
};

export function navWithAuditLog(items: NavItem[], canViewAuditLog: boolean) {
  if (!canViewAuditLog) return items;
  return [...items, auditLogNavItem];
}
