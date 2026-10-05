import { db } from "@/lib/db";
import { toIsoDate } from "@/lib/dates";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { PROJECT_STATUS } from "@/lib/format";
import { can } from "@/lib/permissions";
import type { PublicUser } from "@/types/auth";
import type { ProjectDetail, ProjectListItem, ProjectStatus } from "@/types/domain";
import { logActivity } from "./activityService";
import { accessibleProjectFilter, assertProjectAccess } from "./projectAccess";

export { accessibleProjectFilter, assertProjectAccess } from "./projectAccess";

const userSummary = { select: { id: true, name: true, email: true } } as const;

const listInclude = {
  owner: userSummary,
  tasks: { select: { status: true } },
  _count: { select: { members: true } },
} as const;

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  status: string;
  dueDate: Date | null;
  owner: { id: string; name: string; email: string };
  tasks: { status: string }[];
  _count: { members: number };
};

function toListItem(p: ProjectRow): ProjectListItem {
  const taskCount = p.tasks.length;
  const doneCount = p.tasks.filter((t) => t.status === "done").length;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status as ProjectStatus,
    dueDate: toIsoDate(p.dueDate),
    owner: p.owner,
    memberCount: p._count.members,
    taskCount,
    doneCount,
    progress: taskCount ? Math.round((doneCount / taskCount) * 100) : p.status === "completed" ? 100 : 0,
  };
}

export async function listProjectsForUser(
  user: PublicUser,
  filters: { q?: string; status?: ProjectStatus } = {},
): Promise<ProjectListItem[]> {
  const rows = await db.project.findMany({
    where: {
      ...accessibleProjectFilter(user),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.q
        ? { OR: [{ name: { contains: filters.q } }, { description: { contains: filters.q } }] }
        : {}),
    },
    include: listInclude,
    orderBy: [{ dueDate: "asc" }, { name: "asc" }],
  });
  return rows.map(toListItem);
}

export async function getProjectForUser(user: PublicUser, id: string): Promise<ProjectDetail | null> {
  const p = await db.project.findFirst({
    where: { id, ...accessibleProjectFilter(user) },
    include: { ...listInclude, members: { include: { user: userSummary }, orderBy: { addedAt: "asc" } } },
  });
  if (!p) return null;
  return {
    ...toListItem(p),
    members: p.members.map((m) => m.user),
    createdAt: p.createdAt.toISOString(),
  };
}

/** Members must be existing, active users. The owner is always a member. */
async function resolveMemberIds(memberIds: string[], ownerId: string): Promise<string[]> {
  const ids = [...new Set([ownerId, ...memberIds])];
  const found = await db.user.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true } });
  if (found.length !== ids.length) throw badRequest("Some selected members do not exist or are inactive");
  return ids;
}

export async function createProject(
  user: PublicUser,
  input: { name: string; description?: string; status?: ProjectStatus; dueDate?: Date | null; memberIds?: string[] },
): Promise<ProjectDetail> {
  if (!can(user, "project:create")) throw forbidden();
  const memberIds = await resolveMemberIds(input.memberIds ?? [], user.id);

  const project = await db.project.create({
    data: {
      name: input.name,
      description: input.description ?? "",
      status: input.status ?? "planning",
      dueDate: input.dueDate ?? null,
      ownerId: user.id,
      members: { create: memberIds.map((userId) => ({ userId })) },
    },
  });
  await logActivity({
    actorId: user.id,
    action: "project.created",
    summary: `created project ${project.name}`,
    entityType: "project",
    entityId: project.id,
    projectId: project.id,
  });
  return (await getProjectForUser(user, project.id))!;
}

export async function updateProject(
  user: PublicUser,
  id: string,
  input: { name?: string; description?: string; status?: ProjectStatus; dueDate?: Date | null; memberIds?: string[] },
): Promise<ProjectDetail> {
  await assertProjectAccess(user, id, "project:edit");
  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) throw notFound("Project not found");

  const memberIds = input.memberIds ? await resolveMemberIds(input.memberIds, existing.ownerId) : undefined;

  await db.$transaction(async (tx) => {
    await tx.project.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        status: input.status,
        dueDate: input.dueDate,
      },
    });
    if (memberIds) {
      await tx.projectMember.deleteMany({ where: { projectId: id, userId: { notIn: memberIds } } });
      const current = await tx.projectMember.findMany({ where: { projectId: id }, select: { userId: true } });
      const have = new Set(current.map((m) => m.userId));
      const toAdd = memberIds.filter((m) => !have.has(m));
      if (toAdd.length) {
        await tx.projectMember.createMany({ data: toAdd.map((userId) => ({ projectId: id, userId })) });
      }
      // Tasks assigned to removed members become unassigned.
      await tx.task.updateMany({
        where: { projectId: id, assigneeId: { notIn: memberIds } },
        data: { assigneeId: null },
      });
    }
  });

  const name = input.name ?? existing.name;
  const summary =
    input.status && input.status !== existing.status
      ? `changed ${name} status to ${PROJECT_STATUS[input.status].label}`
      : `updated project ${name}`;
  await logActivity({
    actorId: user.id,
    action: "project.updated",
    summary,
    entityType: "project",
    entityId: id,
    projectId: id,
  });

  return (await getProjectForUser(user, id))!;
}

export async function deleteProject(user: PublicUser, id: string): Promise<void> {
  await assertProjectAccess(user, id, "project:delete");
  const project = await db.project.delete({ where: { id } });
  // Logged without projectId: the project's own log entries are deleted with it.
  await logActivity({
    actorId: user.id,
    action: "project.deleted",
    summary: `deleted project ${project.name}`,
    entityType: "project",
    entityId: id,
  });
}

export interface ProjectOption {
  id: string;
  name: string;
  members: { id: string; name: string; email: string }[];
}

/** Projects the user can see, with their active members (for task forms). */
export async function listProjectOptions(user: PublicUser): Promise<ProjectOption[]> {
  const rows = await db.project.findMany({
    where: { ...accessibleProjectFilter(user), status: { not: "completed" } },
    select: {
      id: true,
      name: true,
      members: { where: { user: { isActive: true } }, select: { user: userSummary } },
    },
    orderBy: { name: "asc" },
  });
  return rows.map((p) => ({ id: p.id, name: p.name, members: p.members.map((m) => m.user) }));
}

/** Users that can be added to a project (for the member picker). */
export function listAssignableUsers() {
  return db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}
