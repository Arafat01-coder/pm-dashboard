import { db } from "@/lib/db";
import { forbidden, notFound } from "@/lib/errors";
import { can } from "@/lib/permissions";
import type { Permission, PublicUser } from "@/types/auth";

/**
 * Data scoping rules shared by every service:
 * users with "project:view_all" see every project; everyone else only
 * projects they are a member of (and the tasks, comments and activity inside).
 */

export function accessibleProjectFilter(user: PublicUser) {
  return can(user, "project:view_all") ? {} : { members: { some: { userId: user.id } } };
}

/**
 * Throws 404 if the user cannot see the project (so its existence is not
 * revealed), or 403 if they can see it but lack `permission`.
 */
export async function assertProjectAccess(
  user: PublicUser,
  projectId: string,
  permission?: Permission,
): Promise<void> {
  const project = await db.project.findFirst({
    where: { id: projectId, ...accessibleProjectFilter(user) },
    select: { id: true },
  });
  if (!project) throw notFound("Project not found");
  if (permission && !can(user, permission)) throw forbidden();
}
