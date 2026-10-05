import { db } from "@/lib/db";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ROLE_LABELS, assignableRoles, can } from "@/lib/permissions";
import { isRole, type PublicUser, type Role } from "@/types/auth";
import type { User } from "@/generated/prisma/client";
import { logActivity } from "./activityService";

/** User data access. Pages and API routes never query users directly. */

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: isRole(user.role) ? user.role : "client",
    title: user.title,
    isActive: user.isActive,
  };
}

export function findUserByEmail(email: string): Promise<User | null> {
  return db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
}

export function findUserById(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

export async function listUsers(opts: { activeOnly?: boolean } = {}): Promise<PublicUser[]> {
  const users = await db.user.findMany({
    where: opts.activeOnly ? { isActive: true } : undefined,
    orderBy: { createdAt: "asc" },
  });
  return users.map(toPublicUser);
}

/** Checks that `actor` may change `target`'s role or status. */
async function assertCanManage(actor: PublicUser, targetId: string): Promise<User> {
  if (!can(actor, "user:manage_roles")) throw forbidden();
  if (actor.id === targetId) throw badRequest("You can't change your own role or status");
  const target = await findUserById(targetId);
  if (!target) throw notFound("User not found");
  if (target.role === "super_admin" && actor.role !== "super_admin") {
    throw forbidden("Only a Super Admin can manage another Super Admin");
  }
  return target;
}

export async function changeUserRole(actor: PublicUser, targetId: string, role: Role): Promise<PublicUser> {
  const target = await assertCanManage(actor, targetId);
  if (!assignableRoles(actor).includes(role)) throw forbidden("You can't assign that role");
  const updated = await db.user.update({ where: { id: target.id }, data: { role } });
  await logActivity({
    actorId: actor.id,
    action: "user.role_changed",
    summary: `changed ${target.name}'s role to ${ROLE_LABELS[role]}`,
    entityType: "user",
    entityId: target.id,
  });
  return toPublicUser(updated);
}

export async function setUserActive(actor: PublicUser, targetId: string, isActive: boolean): Promise<PublicUser> {
  const target = await assertCanManage(actor, targetId);
  const updated = await db.user.update({
    where: { id: target.id },
    // Bumping the session version signs a deactivated user out everywhere.
    data: { isActive, sessionVersion: isActive ? undefined : { increment: 1 } },
  });
  await logActivity({
    actorId: actor.id,
    action: isActive ? "user.activated" : "user.deactivated",
    summary: `${isActive ? "reactivated" : "deactivated"} ${target.name}`,
    entityType: "user",
    entityId: target.id,
  });
  return toPublicUser(updated);
}

/** Changes the user's own password. Returns the updated user (new session version). */
export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string): Promise<User> {
  const user = await findUserById(userId);
  if (!user) throw notFound("User not found");
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw badRequest("Current password is incorrect", { currentPassword: "Current password is incorrect" });
  }
  if (currentPassword === newPassword) {
    throw badRequest("New password must be different", { newPassword: "New password must be different" });
  }
  return db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), sessionVersion: { increment: 1 } },
  });
}

export async function updateOwnProfile(userId: string, data: { name?: string; title?: string }): Promise<PublicUser> {
  const updated = await db.user.update({ where: { id: userId }, data });
  return toPublicUser(updated);
}
