export const ROLES = [
  "super_admin",
  "admin",
  "project_manager",
  "member",
  "client",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Permissions are written as "resource:action".
 * Code checks permissions, never roles, so new roles can be added
 * by editing the role -> permission map in lib/permissions.ts only.
 */
export type Permission =
  | "dashboard:view"
  | "project:view"
  | "project:view_all"
  | "project:create"
  | "project:edit"
  | "project:delete"
  | "task:view"
  | "task:create"
  | "task:edit"
  | "task:delete"
  | "task:update_status"
  | "task:comment"
  | "user:view"
  | "user:invite"
  | "user:manage_roles"
  | "report:view"
  | "activity:view"
  | "settings:manage_org"
  | "billing:manage";

/** Safe user shape that can be sent to the browser. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  isActive: boolean;
}

/** Data stored inside the signed session token. Keep it small. */
export interface SessionPayload {
  sub: string; // user id
  role: Role;
  sv: number; // session version; bumped on password change to sign out other sessions
}
