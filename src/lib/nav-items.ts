import Building2Icon from "@lucide/svelte/icons/building-2";
import FileTextIcon from "@lucide/svelte/icons/file-text";
import KeyIcon from "@lucide/svelte/icons/key";
import MessageSquareIcon from "@lucide/svelte/icons/message-square";
import UsersIcon from "@lucide/svelte/icons/users";
import type { Component } from "svelte";

export type NavItem = { title: string; url: string; icon: Component };

export const caseworkerNav: NavItem[] = [
  { title: "Vermieter", url: "/admin/vermieter", icon: UsersIcon },
  { title: "Mieter", url: "/admin/mieter", icon: KeyIcon },
  { title: "Mietobjekte", url: "/admin/mietobjekte", icon: Building2Icon },
  { title: "Dokumente", url: "/admin/dokumente", icon: FileTextIcon },
  { title: "Nachrichten", url: "/admin/nachrichten", icon: MessageSquareIcon },
];

export const companyNav: NavItem[] = [
  {
    title: "Mietobjekte",
    url: "/vermieter/mietobjekte",
    icon: Building2Icon,
  },
  {
    title: "Nachrichten",
    url: "/vermieter/nachrichten",
    icon: MessageSquareIcon,
  },
];
