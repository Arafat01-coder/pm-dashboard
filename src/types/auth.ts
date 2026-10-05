export const ROLES = [
  "super_admin",
  "admin",
  "project_manager",
  "member",
  "client",
] as const;

export type Role = (typeof ROLES)[number];

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
  | "user:view"
  | "user:invite"
  | "user:manage_roles"
  | "report:view"
  | "settings:manage_org"
  | "billing:manage";

/** User record as stored in the data layer (includes the password hash). */
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  title: string;
  isActive: boolean;
}

/** Safe user shape that can be sent to the browser. */
export type PublicUser = Omit<UserRecord, "passwordHash">;

/** Data stored inside the signed session token. Keep it small. */
export interface SessionPayload {
  sub: string; // user id
  role: Role;
}
