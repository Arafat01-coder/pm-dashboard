import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityFeed } from "@/components/common/ActivityFeed";
import { Avatar, Badge, Card, Icon, PageHeader, ProgressBar, StatCard, Table, type Column } from "@/components/ui";
import { ProjectActions } from "@/features/projects/ProjectActions";
import { NewTaskButton } from "@/features/tasks/NewTaskButton";
import { TaskStatusSelect } from "@/features/tasks/TaskStatusSelect";
import { requirePermission } from "@/lib/auth/server";
import { todayIso } from "@/lib/dates";
import { PROJECT_STATUS, TASK_PRIORITY, TASK_STATUS, formatDate, isOverdue } from "@/lib/format";
import { can } from "@/lib/permissions";
import { listActivity } from "@/services/activityService";
import {
  getProjectForUser,
  listAssignableUsers,
  type ProjectOption,
} from "@/services/projectService";
import { listTasksForUser } from "@/services/taskService";
import type { TaskListItem } from "@/types/domain";
import styles from "../../pages.module.css";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const user = await requirePermission("project:view");
  const project = await getProjectForUser(user, (await params).id);
  return { title: project?.name ?? "Project" };
}

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const user = await requirePermission("project:view");
  const { id } = await params;
  const project = await getProjectForUser(user, id);
  if (!project) notFound();

  const canEdit = can(user, "project:edit");
  const canDelete = can(user, "project:delete");
  const canCreateTask = can(user, "task:create") && project.status !== "completed";
  const canMoveTasks = can(user, "task:update_status");

  const [tasks, activity, users] = await Promise.all([
    listTasksForUser(user, { projectId: id }),
    listActivity(user, { projectId: id, limit: 10 }),
    canEdit ? listAssignableUsers() : Promise.resolve([]),
  ]);
  const today = todayIso();
  const projectOption: ProjectOption = { id: project.id, name: project.name, members: project.members };
  const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status === "done", today)).length;

  const columns: Column<TaskListItem>[] = [
    {
      key: "title",
      header: "Task",
      render: (t) => (
        <Link href={`/tasks/${t.id}`} className={`${styles.cellTitle} ${styles.titleLink}`}>
          {t.title}
        </Link>
      ),
    },
    {
      key: "assignee",
      header: "Assignee",
      hideOnMobile: true,
      render: (t) => (t.assignee ? t.assignee.name : <span className={styles.muted}>Unassigned</span>),
    },
    {
      key: "priority",
      header: "Priority",
      hideOnMobile: true,
      render: (t) => <Badge tone={TASK_PRIORITY[t.priority].tone}>{TASK_PRIORITY[t.priority].label}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (t) =>
        canMoveTasks ? (
          <TaskStatusSelect taskId={t.id} status={t.status} />
        ) : (
          <Badge tone={TASK_STATUS[t.status].tone}>{TASK_STATUS[t.status].label}</Badge>
        ),
    },
    {
      key: "due",
      header: "Due",
      hideOnMobile: true,
      render: (t) => (
        <span className={isOverdue(t.dueDate, t.status === "done", today) ? styles.overdue : undefined}>
          {formatDate(t.dueDate)}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.stack}>
      <div>
        <Link href="/projects" className={styles.backLink}>
          <Icon name="arrowLeft" size={14} /> All projects
        </Link>
        <PageHeader
          title={project.name}
          description={project.description || undefined}
          actions={
            <>
              {canCreateTask && <NewTaskButton projects={[projectOption]} projectId={project.id} />}
              <ProjectActions project={project} users={users} canEdit={canEdit} canDelete={canDelete} />
            </>
          }
        />
      </div>

      <div className={styles.statsGrid}>
        <StatCard label="Status" value={PROJECT_STATUS[project.status].label} hint={`Owner: ${project.owner.name}`} />
        <StatCard label="Progress" value={`${project.progress}%`} hint={`${project.doneCount} of ${project.taskCount} tasks done`} />
        <StatCard label="Due date" value={formatDate(project.dueDate)} />
        <StatCard label="Overdue tasks" value={overdue} />
      </div>

      <div className={styles.sideGrid}>
        <div className={styles.stack}>
          <Card
            title="Tasks"
            padded={false}
            action={
              <Link href={`/tasks/board?project=${project.id}`} className={styles.muted}>
                Open board
              </Link>
            }
          >
            <Table
              columns={columns}
              rows={tasks}
              getRowKey={(t) => t.id}
              emptyTitle="No tasks yet"
              emptyDescription={canCreateTask ? "Create the first task with the New task button." : undefined}
            />
          </Card>
          <Card title="Activity" padded={false}>
            <ActivityFeed items={activity} showProject={false} />
          </Card>
        </div>

        <div className={styles.stack}>
          <Card title="Progress">
            <ProgressBar value={project.progress} label={`${project.name} progress`} />
          </Card>
          <Card title={`Members (${project.members.length})`}>
            <ul className={styles.memberList}>
              {project.members.map((m) => (
                <li key={m.id} className={styles.person}>
                  <Avatar name={m.name} size={28} />
                  <span className={styles.itemMain}>
                    <span>{m.name}</span>
                    <span className={styles.muted}>{m.id === project.owner.id ? "Owner" : m.email}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
