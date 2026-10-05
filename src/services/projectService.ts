import { projects, tasks } from "@/lib/data/mock-db";
import { can } from "@/lib/permissions";
import type { PublicUser } from "@/types/auth";
import type { Project, Task } from "@/types/domain";

/**
 * Data scoping lives here: users with "project:view_all" see every project,
 * everyone else only sees projects they are a member of.
 */

export async function listProjectsForUser(user: PublicUser): Promise<Project[]> {
  if (can(user, "project:view_all")) return projects;
  return projects.filter((p) => p.memberIds.includes(user.id));
}

export async function listTasksForUser(user: PublicUser): Promise<Task[]> {
  const visibleProjectIds = new Set(
    (await listProjectsForUser(user)).map((p) => p.id),
  );
  return tasks.filter((t) => visibleProjectIds.has(t.projectId));
}

export async function listTasksAssignedTo(userId: string): Promise<Task[]> {
  return tasks.filter((t) => t.assigneeId === userId);
}
