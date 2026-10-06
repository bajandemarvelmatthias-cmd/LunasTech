import {
  BookOpen,
  ChartBar,
  Cube,
  Gear,
  type Icon,
  Pulse,
  BookmarkSimple,
  ShieldCheck,
  SquaresFour,
} from "@phosphor-icons/react";

export type PageId =
  | "overview"
  | "guides"
  | "simulations"
  | "diagnose"
  | "saved"
  | "progress"
  | "settings"
  | "admin";

export type NavItem = { id: PageId; label: string; icon: Icon };

// Same icon for the same concept everywhere (ux-ui-guidelines.md, icon rules).
export const MAIN_NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: SquaresFour },
  { id: "guides", label: "Repair Guides", icon: BookOpen },
  { id: "simulations", label: "Simulations", icon: Cube },
  { id: "diagnose", label: "Device Diagnosis", icon: Pulse },
  { id: "saved", label: "Saved Guides", icon: BookmarkSimple },
  { id: "progress", label: "My Progress", icon: ChartBar },
];
export const ADMIN_NAV: NavItem = { id: "admin", label: "Admin", icon: ShieldCheck };
export const SETTINGS_NAV: NavItem = { id: "settings", label: "Settings", icon: Gear };

export const PAGE_LABEL: Record<PageId, string> = Object.fromEntries(
  [...MAIN_NAV, ADMIN_NAV, SETTINGS_NAV].map((n) => [n.id, n.label]),
) as Record<PageId, string>;
