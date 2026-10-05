import { db } from "@/lib/db";
import { toIsoDate } from "@/lib/dates";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { TASK_STATUS } from "@/lib/format";
import { can } from "@/lib/permissions";
import type { PublicUser } from "@/types/auth";
import type { CommentItem, TaskDetail, TaskListItem, TaskPriority, TaskStatus } from "@/types/domain";
import { logActivity } from "./activityService";
import { accessibleProjectFilter, assertProjectAccess } from "./projectAccess";

const userSummary = { select: { id: true, name: true, email: true } } as const;

const listInclude = {
  project: { select: { name: true } },
  assignee: userSummary,
  _count: { select: { comments: true } },
} as const;

type TaskRow = {
  id: string;
  projectId: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  project: { name: string };
  assignee: { id: string; name: string; email: string } | null;
  _count: { comments: number };
};

function toListItem(t: TaskRow): TaskListItem {
  return {
    id: t.id,
    projectId: t.projectId,
    projectName: t.project.name,
    title: t.title,
    status: t.status as TaskStatus,
    priority: t.priority as TaskPriority,
    assignee: t.assignee,
    dueDate: toIsoDate(t.dueDate),
    commentCount: t._count.comments,
  };
}

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export interface TaskFilters {
  q?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  /** A user id, "me" or "unassigned". */
  assignee?: string;
  projectId?: string;
}

export async function listTasksForUser(user: PublicUser, filters: TaskFilters = {}): Promise<TaskListItem[]> {
  const assigneeWhere =
    filters.assignee === "me"
      ? { assigneeId: user.id }
      : filters.assignee === "unassigned"
        ? { assigneeId: null }
        : filters.assignee
          ? { assigneeId: filters.assignee }
          : {};

  const rows = await db.task.findMany({
    where: {
      project: accessibleProjectFilter(user),
      ...(filters.projectId ? { projectId: filters.projectId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...assigneeWhere,
      ...(filters.q ? { title: { contains: filters.q } } : {}),
    },
    include: listInclude,
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  // Undated tasks last, then by priority within the same date.
  return rows
    .map(toListItem)
    .sort((a, b) => {
      if (a.dueDate !== b.dueDate) {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate < b.dueDate ? -1 : 1;
      }
      return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    });
}

export async function getTaskForUser(user: PublicUser, id: string): Promise<TaskDetail | null> {
  const t = await db.task.findFirst({
    where: { id, project: accessibleProjectFilter(user) },
    include: { ...listInclude, createdBy: userSummary },
  });
  if (!t) return null;
  return {
    ...toListItem(t),
    description: t.description,
    createdBy: t.createdBy,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/** The assignee must be a member of the task's project. */
async function assertAssignable(projectId: string, assigneeId: string | null | undefined) {
  if (!assigneeId) return;
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
    include: { user: { select: { isActive: true } } },
  });
  if (!member || !member.user.isActive) {
    throw badRequest("The assignee must be an active member of this project", {
      assigneeId: "Choose a member of this project",
    });
  }
}

export interface TaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: Date | null;
}

export async function createTask(
  user: PublicUser,
  projectId: string,
  input: TaskInput & { title: string },
): Promise<TaskDetail> {
  await assertProjectAccess(user, projectId, "task:create");
  await assertAssignable(projectId, input.assigneeId);

  const task = await db.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description ?? "",
      status: input.status ?? "todo",
      priority: input.priority ?? "medium",
      assigneeId: input.assigneeId ?? null,
      dueDate: input.dueDate ?? null,
      createdById: user.id,
    },
  });
  await logActivity({
    actorId: user.id,
    action: "task.created",
    summary: `created task ${task.title}`,
    entityType: "task",
    entityId: task.id,
    projectId,
  });
  return (await getTaskForUser(user, task.id))!;
}

/**
 * Users with "task:edit" may change any field. Users with only
 * "task:update_status" (team members) may change the status alone.
 */
export async function updateTask(user: PublicUser, id: string, input: TaskInput): Promise<TaskDetail> {
  const existing = await db.task.findFirst({ where: { id, project: accessibleProjectFilter(user) } });
  if (!existing) throw notFound("Task not found");

  const changesOtherThanStatus = Object.entries(input).some(
    ([key, value]) => key !== "status" && value !== undefined,
  );
  if (changesOtherThanStatus && !can(user, "task:edit")) {
    throw forbidden("You can only change the status of this task");
  }
  if (input.status !== undefined && !can(user, "task:update_status") && !can(user, "task:edit")) {
    throw forbidden();
  }
  if (input.assigneeId !== undefined) await assertAssignable(existing.projectId, input.assigneeId);

  const task = await db.task.update({ where: { id }, data: input });

  if (input.status && input.status !== existing.status) {
    await logActivity({
      actorId: user.id,
      action: "task.status_changed",
      summary: `moved ${task.title} to ${TASK_STATUS[input.status].label}`,
      entityType: "task",
      entityId: id,
      projectId: task.projectId,
    });
  } else if (changesOtherThanStatus) {
    await logActivity({
      actorId: user.id,
      action: "task.updated",
      summary: `updated task ${task.title}`,
      entityType: "task",
      entityId: id,
      projectId: task.projectId,
    });
  }
  return (await getTaskForUser(user, id))!;
}

export async function deleteTask(user: PublicUser, id: string): Promise<{ projectId: string }> {
  const existing = await db.task.findFirst({ where: { id, project: accessibleProjectFilter(user) } });
  if (!existing) throw notFound("Task not found");
  if (!can(user, "task:delete")) throw forbidden();

  await db.task.delete({ where: { id } });
  await logActivity({
    actorId: user.id,
    action: "task.deleted",
    summary: `deleted task ${existing.title}`,
    entityType: "task",
    entityId: id,
    projectId: existing.projectId,
  });
  return { projectId: existing.projectId };
}

export async function listComments(user: PublicUser, taskId: string): Promise<CommentItem[]> {
  const task = await db.task.findFirst({ where: { id: taskId, project: accessibleProjectFilter(user) } });
  if (!task) throw notFound("Task not found");
  const rows = await db.comment.findMany({
    where: { taskId },
    include: { author: userSummary },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((c) => ({ id: c.id, body: c.body, author: c.author, createdAt: c.createdAt.toISOString() }));
}

export async function addComment(user: PublicUser, taskId: string, body: string): Promise<CommentItem> {
  const task = await db.task.findFirst({ where: { id: taskId, project: accessibleProjectFilter(user) } });
  if (!task) throw notFound("Task not found");
  if (!can(user, "task:comment")) throw forbidden();

  const comment = await db.comment.create({
    data: { taskId, authorId: user.id, body },
    include: { author: userSummary },
  });
  await logActivity({
    actorId: user.id,
    action: "task.commented",
    summary: `commented on ${task.title}`,
    entityType: "task",
    entityId: taskId,
    projectId: task.projectId,
  });
  return { id: comment.id, body: comment.body, author: comment.author, createdAt: comment.createdAt.toISOString() };
}
