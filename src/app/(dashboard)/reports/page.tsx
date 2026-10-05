import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, ProgressBar, StatCard, Table, type Column } from "@/components/ui";
import { requirePermission } from "@/lib/auth/server";
import { todayIso } from "@/lib/dates";
import { TASK_STATUS, isOverdue } from "@/lib/format";
import { listProjectsForUser } from "@/services/projectService";
import { listTasksForUser } from "@/services/taskService";
import { TASK_STATUSES } from "@/types/domain";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Reports" };

interface ProjectReportRow {
  id: string;
  name: string;
  total: number;
  done: number;
  overdue: number;
  progress: number;
}

interface PersonRow {
  id: string;
  name: string;
  open: number;
  overdue: number;
  done: number;
}

export default async function ReportsPage() {
  const user = await requirePermission("report:view");
  const [projects, tasks] = await Promise.all([listProjectsForUser(user), listTasksForUser(user)]);
  const today = todayIso();

  const rows: ProjectReportRow[] = projects.map((p) => {
    const projectTasks = tasks.filter((t) => t.projectId === p.id);
    return {
      id: p.id,
      name: p.name,
      total: projectTasks.length,
      done: projectTasks.filter((t) => t.status === "done").length,
      overdue: projectTasks.filter((t) => isOverdue(t.dueDate, t.status === "done", today)).length,
      progress: p.progress,
    };
  });

  const people = new Map<string, PersonRow>();
  for (const t of tasks) {
    if (!t.assignee) continue;
    const row = people.get(t.assignee.id) ?? { id: t.assignee.id, name: t.assignee.name, open: 0, overdue: 0, done: 0 };
    if (t.status === "done") row.done += 1;
    else row.open += 1;
    if (isOverdue(t.dueDate, t.status === "done", today)) row.overdue += 1;
    people.set(t.assignee.id, row);
  }
  const personRows = [...people.values()].sort((a, b) => b.open - a.open);

  const totalDone = tasks.filter((t) => t.status === "done").length;
  const totalOverdue = rows.reduce((sum, r) => sum + r.overdue, 0);
  const completion = tasks.length ? Math.round((totalDone / tasks.length) * 100) : 0;

  const columns: Column<ProjectReportRow>[] = [
    {
      key: "name",
      header: "Project",
      render: (r) => (
        <Link href={`/projects/${r.id}`} className={`${styles.cellTitle} ${styles.titleLink}`}>
          {r.name}
        </Link>
      ),
    },
    { key: "total", header: "Tasks", align: "right", render: (r) => r.total },
    { key: "done", header: "Done", align: "right", hideOnMobile: true, render: (r) => r.done },
    {
      key: "overdue",
      header: "Overdue",
      align: "right",
      render: (r) => <span className={r.overdue ? styles.overdue : undefined}>{r.overdue}</span>,
    },
    { key: "completion", header: "Completion", hideOnMobile: true, render: (r) => <ProgressBar value={r.progress} /> },
  ];

  const personColumns: Column<PersonRow>[] = [
    {
      key: "name",
      header: "Person",
      render: (r) => (
        <Link href={`/tasks?assignee=${r.id}`} className={`${styles.cellTitle} ${styles.titleLink}`}>
          {r.name}
        </Link>
      ),
    },
    { key: "open", header: "Open", align: "right", render: (r) => r.open },
    {
      key: "overdue",
      header: "Overdue",
      align: "right",
      render: (r) => <span className={r.overdue ? styles.overdue : undefined}>{r.overdue}</span>,
    },
    { key: "done", header: "Done", align: "right", render: (r) => r.done },
  ];

  const byStatus = TASK_STATUSES.map((s) => ({ status: s, count: tasks.filter((t) => t.status === s).length }));

  return (
    <div className={styles.stack}>
      <PageHeader title="Reports" description="Task completion and workload across your projects." />
      <div className={styles.statsGrid}>
        <StatCard label="Total tasks" value={tasks.length} />
        <StatCard label="Completed" value={totalDone} />
        <StatCard label="Overdue" value={totalOverdue} />
        <StatCard label="Completion rate" value={`${completion}%`} />
      </div>
      <Card title="Tasks by status">
        <dl className={styles.detailsGrid}>
          {byStatus.map((s) => (
            <div key={s.status} style={{ display: "contents" }}>
              <dt>{TASK_STATUS[s.status].label}</dt>
              <dd>
                <ProgressBar value={tasks.length ? Math.round((s.count / tasks.length) * 100) : 0} label={TASK_STATUS[s.status].label} />
              </dd>
            </div>
          ))}
        </dl>
      </Card>
      <div className={styles.twoCol}>
        <Card title="By project" padded={false}>
          <Table columns={columns} rows={rows} getRowKey={(r) => r.id} />
        </Card>
        <Card title="By person" padded={false}>
          <Table columns={personColumns} rows={personRows} getRowKey={(r) => r.id} emptyTitle="No assigned tasks" />
        </Card>
      </div>
    </div>
  );
}
