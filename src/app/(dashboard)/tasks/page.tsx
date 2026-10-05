import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/common/FilterBar";
import { Avatar, Badge, Card, Icon, PageHeader, Table, type Column } from "@/components/ui";
import { NewTaskButton } from "@/features/tasks/NewTaskButton";
import { TaskStatusSelect } from "@/features/tasks/TaskStatusSelect";
import { TaskViewToggle } from "@/features/tasks/TaskViewToggle";
import { loadTaskPageData } from "@/features/tasks/taskPageData";
import { requirePermission } from "@/lib/auth/server";
import { todayIso } from "@/lib/dates";
import { TASK_PRIORITY, TASK_STATUS, formatDate, isOverdue } from "@/lib/format";
import { can } from "@/lib/permissions";
import { parseTaskFilters } from "@/lib/taskFilters";
import { listTasksForUser } from "@/services/taskService";
import type { TaskListItem } from "@/types/domain";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Tasks" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TasksPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("task:view");
  const params = await searchParams;
  const filters = parseTaskFilters(params);
  const [tasks, pageData] = await Promise.all([
    listTasksForUser(user, filters),
    loadTaskPageData(user, { includeStatus: true }),
  ]);
  const today = todayIso();
  const canMove = can(user, "task:update_status");
  const query = new URLSearchParams(
    Object.entries(params).filter((e): e is [string, string] => typeof e[1] === "string" && !!e[1]),
  ).toString();
  const filtered = Object.values(filters).some(Boolean);

  const columns: Column<TaskListItem>[] = [
    {
      key: "title",
      header: "Task",
      render: (t) => (
        <div className={styles.itemMain}>
          <Link href={`/tasks/${t.id}`} className={`${styles.cellTitle} ${styles.titleLink}`}>
            {t.title}
          </Link>
          <span className={styles.muted}>
            {t.projectName}
            {t.commentCount > 0 && (
              <>
                {" · "}
                <Icon name="message" size={12} /> {t.commentCount}
              </>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "assignee",
      header: "Assignee",
      hideOnMobile: true,
      render: (t) =>
        t.assignee ? (
          <span className={styles.person}>
            <Avatar name={t.assignee.name} size={24} />
            {t.assignee.name}
          </span>
        ) : (
          <span className={styles.muted}>Unassigned</span>
        ),
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
        canMove ? (
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
    <>
      <PageHeader
        title="Tasks"
        description="Tasks across the projects you can access."
        actions={
          <>
            <TaskViewToggle current="list" query={query} />
            {pageData.canCreate && <NewTaskButton projects={pageData.projectOptions} />}
          </>
        }
      />
      <FilterBar searchPlaceholder="Search tasks" filters={pageData.filters} />
      <Card padded={false}>
        <Table
          columns={columns}
          rows={tasks}
          getRowKey={(t) => t.id}
          emptyTitle={filtered ? "No tasks match your filters" : "No tasks yet"}
          emptyDescription={filtered ? "Try a different search or clear the filters." : undefined}
        />
      </Card>
    </>
  );
}
