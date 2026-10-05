import { ROLES, type Permission, type Role } from "@/types/auth";

const ALL_PERMISSIONS: Permission[] = [
  "dashboard:view",
  "project:view",
  "project:view_all",
  "project:create",
  "project:edit",
  "project:delete",
  "task:view",
  "task:create",
  "task:edit",
  "task:delete",
  "task:update_status",
  "task:comment",
  "user:view",
  "user:invite",
  "user:manage_roles",
  "report:view",
  "activity:view",
  "settings:manage_org",
  "billing:manage",
];

/**
 * Single source of truth for "who can do what".
 * Mirrors the permission matrix in docs/STRUCTURE.md.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter((p) => p !== "billing:manage"),
  project_manager: [
    "dashboard:view",
    "project:view",
    "project:create",
    "project:edit",
    "task:view",
    "task:create",
    "task:edit",
    "task:delete",
    "task:update_status",
    "task:comment",
    "user:view",
    "report:view",
    "activity:view",
  ],
  member: [
    "dashboard:view",
    "project:view",
    "task:view",
    "task:create",
    "task:update_status",
    "task:comment",
    "activity:view",
  ],
  client: ["dashboard:view", "project:view", "task:view", "activity:view"],
};

/**
 * Which roles a user may assign to others. Nobody can grant a role above
 * their own, and only a Super Admin can create another Super Admin.
 */
export function assignableRoles(actor: HasRole): Role[] {
  if (!actor) return [];
  if (actor.role === "super_admin") return [...ROLES];
  if (actor.role === "admin") return ROLES.filter((r) => r !== "super_admin");
  return [];
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  project_manager: "Project Manager",
  member: "Team Member",
  client: "Client",
};

type HasRole = { role: Role } | null | undefined;

export function can(user: HasRole, permission: Permission): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

export function canAll(user: HasRole, permissions: Permission[]): boolean {
  return permissions.every((p) => can(user, p));
}

export function canAny(user: HasRole, permissions: Permission[]): boolean {
  return permissions.some((p) => can(user, p));
}
