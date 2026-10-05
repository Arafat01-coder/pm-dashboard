import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import type { PublicUser } from "@/types/auth";
import type { ActivityItem } from "@/types/domain";
import { accessibleProjectFilter } from "./projectAccess";

/** The activity log: a short record of who did what, shown on dashboards. */

export async function logActivity(entry: {
  actorId: string;
  action: string;
  summary: string;
  entityType: string;
  entityId: string;
  projectId?: string | null;
}): Promise<void> {
  try {
    await db.activityLog.create({ data: entry });
  } catch (error) {
    // Never fail the user's action because the log could not be written.
    console.error("Failed to write activity log", error);
  }
}

/**
 * Recent activity the user may see: entries for projects they can access.
 * Team-level entries (role changes, invites) are shown to user managers only.
 */
export async function listActivity(
  user: PublicUser,
  opts: { projectId?: string; limit?: number } = {},
): Promise<ActivityItem[]> {
  if (!can(user, "activity:view")) return [];

  // `project` is optional on log entries, so it needs an explicit `is` filter.
  const projectScope = can(user, "project:view_all")
    ? { projectId: { not: null } }
    : { project: { is: accessibleProjectFilter(user) } };
  const where = opts.projectId
    ? { projectId: opts.projectId, ...projectScope }
    : can(user, "user:manage_roles")
      ? { OR: [projectScope, { projectId: null }] }
      : projectScope;

  const rows = await db.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 10,
    include: {
      actor: { select: { id: true, name: true, email: true } },
      project: { select: { name: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    summary: r.summary,
    actor: r.actor,
    projectId: r.projectId,
    projectName: r.project?.name ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}
