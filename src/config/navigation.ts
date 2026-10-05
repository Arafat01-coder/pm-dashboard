import type { IconName } from "@/components/ui/Icon";
import type { Permission } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** The sidebar hides the item if the user lacks this permission. */
  permission: Permission;
}

/** Add new sections here; the sidebar filters them by permission. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard", permission: "dashboard:view" },
  { label: "Projects", href: "/projects", icon: "folder", permission: "project:view" },
  { label: "Tasks", href: "/tasks", icon: "check", permission: "task:view" },
  { label: "Team", href: "/team", icon: "users", permission: "user:view" },
  { label: "Reports", href: "/reports", icon: "chart", permission: "report:view" },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Settings", href: "/settings", icon: "settings", permission: "dashboard:view" },
];
