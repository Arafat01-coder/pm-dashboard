import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, Badge, Card, Icon, PageHeader } from "@/components/ui";
import { CommentSection } from "@/features/tasks/CommentSection";
import { TaskActions } from "@/features/tasks/TaskActions";
import { TaskStatusSelect } from "@/features/tasks/TaskStatusSelect";
import { requirePermission } from "@/lib/auth/server";
import { todayIso } from "@/lib/dates";
import { TASK_PRIORITY, TASK_STATUS, formatDate, formatDateTime, isOverdue } from "@/lib/format";
import { can } from "@/lib/permissions";
import { getProjectForUser, listProjectOptions } from "@/services/projectService";
import { getTaskForUser, listComments } from "@/services/taskService";
import styles from "../../pages.module.css";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const user = await requirePermission("task:view");
  const task = await getTaskForUser(user, (await params).id);
  return { title: task?.title ?? "Task" };
}

export default async function TaskDetailPage({ params }: { params: Params }) {
  const user = await requirePermission("task:view");
  const { id } = await params;
  const task = await getTaskForUser(user, id);
  if (!task) notFound();

  const canEdit = can(user, "task:edit");
  const [comments, projectOptions] = await Promise.all([
    listComments(user, id),
    canEdit ? listProjectOptions(user) : Promise.resolve([]),
  ]);
  // Project options leave out completed projects; a task in one still needs its members.
  let options = projectOptions;
  if (canEdit && !projectOptions.some((p) => p.id === task.projectId)) {
    const project = await getProjectForUser(user, task.projectId);
    if (project) options = [...projectOptions, { id: project.id, name: project.name, members: project.members }];
  }
  const overdue = isOverdue(task.dueDate, task.status === "done", todayIso());

  return (
    <div className={styles.stack}>
      <div>
        <Link href={`/projects/${task.projectId}`} className={styles.backLink}>
          <Icon name="arrowLeft" size={14} /> {task.projectName}
        </Link>
        <PageHeader
          title={task.title}
          actions={
            <TaskActions task={task} projects={options} canEdit={canEdit} canDelete={can(user, "task:delete")} />
          }
        />
      </div>

      <div className={styles.sideGrid}>
        <div className={styles.stack}>
          <Card title="Description">
            {task.description ? (
              <p className={styles.description}>{task.description}</p>
            ) : (
              <p className={styles.muted}>No description.</p>
            )}
          </Card>
          <Card title={`Comments (${comments.length})`}>
            <CommentSection taskId={task.id} initialComments={comments} canComment={can(user, "task:comment")} />
          </Card>
        </div>

        <Card title="Details">
          <dl className={styles.detailsGrid}>
            <dt>Status</dt>
            <dd>
              {can(user, "task:update_status") || canEdit ? (
                <TaskStatusSelect taskId={task.id} status={task.status} />
              ) : (
                <Badge tone={TASK_STATUS[task.status].tone}>{TASK_STATUS[task.status].label}</Badge>
              )}
            </dd>
            <dt>Priority</dt>
            <dd>
              <Badge tone={TASK_PRIORITY[task.priority].tone}>{TASK_PRIORITY[task.priority].label}</Badge>
            </dd>
            <dt>Assignee</dt>
            <dd>
              {task.assignee ? (
                <span className={styles.person}>
                  <Avatar name={task.assignee.name} size={24} />
                  {task.assignee.name}
                </span>
              ) : (
                <span className={styles.muted}>Unassigned</span>
              )}
            </dd>
            <dt>Due date</dt>
            <dd className={overdue ? styles.overdue : undefined}>
              {formatDate(task.dueDate)}
              {overdue && " (overdue)"}
            </dd>
            <dt>Project</dt>
            <dd>
              <Link href={`/projects/${task.projectId}`} className={styles.titleLink}>
                {task.projectName}
              </Link>
            </dd>
            <dt>Created by</dt>
            <dd>{task.createdBy.name}</dd>
            <dt>Created</dt>
            <dd>{formatDateTime(task.createdAt)}</dd>
            <dt>Updated</dt>
            <dd>{formatDateTime(task.updatedAt)}</dd>
          </dl>
        </Card>
      </div>
    </div>
  );
}
