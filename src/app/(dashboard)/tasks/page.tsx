import type { Metadata } from "next";
import { Avatar, Badge, Button, Card, Icon, PageHeader, Table, type Column } from "@/components/ui";
import { requirePermission } from "@/lib/auth/server";
import { TASK_PRIORITY, TASK_STATUS, formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { listProjectsForUser, listTasksForUser } from "@/services/projectService";
import { listUsers } from "@/services/userService";
import type { Task } from "@/types/domain";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
  const user = await requirePermission("task:view");
  const [tasks, projects, users] = await Promise.all([
    listTasksForUser(user),
    listProjectsForUser(user),
    listUsers(),
  ]);
  const projectName = new Map(projects.map((p) => [p.id, p.name]));
  const userName = new Map(users.map((u) => [u.id, u.name]));

  const columns: Column<Task>[] = [
    {
      key: "title",
      header: "Task",
      render: (t) => (
        <div className={styles.itemMain}>
          <span className={styles.cellTitle}>{t.title}</span>
          <span className={styles.muted}>{projectName.get(t.projectId)}</span>
        </div>
      ),
    },
    {
      key: "assignee",
      header: "Assignee",
      hideOnMobile: true,
      render: (t) => {
        const name = userName.get(t.assigneeId) ?? "Unassigned";
        return (
          <span className={styles.person}>
            <Avatar name={name} size={24} />
            {name}
          </span>
        );
      },
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
      render: (t) => <Badge tone={TASK_STATUS[t.status].tone}>{TASK_STATUS[t.status].label}</Badge>,
    },
    { key: "due", header: "Due", hideOnMobile: true, render: (t) => formatDate(t.dueDate) },
  ];

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Tasks across the projects you can access."
        actions={
          can(user, "task:create") && <Button leftIcon={<Icon name="plus" size={16} />}>New task</Button>
        }
      />
      <Card padded={false}>
        <Table columns={columns} rows={tasks} getRowKey={(t) => t.id} emptyTitle="No tasks yet" />
      </Card>
    </>
  );
}
