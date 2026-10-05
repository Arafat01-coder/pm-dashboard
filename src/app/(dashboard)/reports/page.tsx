import type { Metadata } from "next";
import { Card, PageHeader, ProgressBar, StatCard, Table, type Column } from "@/components/ui";
import { requirePermission } from "@/lib/auth/server";
import { listProjectsForUser, listTasksForUser } from "@/services/projectService";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Reports" };

interface ProjectReportRow {
  id: string;
  name: string;
  total: number;
  done: number;
  overdue: number;
}

export default async function ReportsPage() {
  const user = await requirePermission("report:view");
  const [projects, tasks] = await Promise.all([listProjectsForUser(user), listTasksForUser(user)]);

  const today = new Date().toISOString().slice(0, 10);
  const rows: ProjectReportRow[] = projects.map((p) => {
    const projectTasks = tasks.filter((t) => t.projectId === p.id);
    return {
      id: p.id,
      name: p.name,
      total: projectTasks.length,
      done: projectTasks.filter((t) => t.status === "done").length,
      overdue: projectTasks.filter((t) => t.status !== "done" && t.dueDate < today).length,
    };
  });

  const totalDone = rows.reduce((sum, r) => sum + r.done, 0);
  const totalOverdue = rows.reduce((sum, r) => sum + r.overdue, 0);
  const completion = tasks.length ? Math.round((totalDone / tasks.length) * 100) : 0;

  const columns: Column<ProjectReportRow>[] = [
    { key: "name", header: "Project", render: (r) => <span className={styles.cellTitle}>{r.name}</span> },
    { key: "total", header: "Tasks", align: "right", render: (r) => r.total },
    { key: "done", header: "Done", align: "right", hideOnMobile: true, render: (r) => r.done },
    { key: "overdue", header: "Overdue", align: "right", render: (r) => r.overdue },
    {
      key: "completion",
      header: "Completion",
      hideOnMobile: true,
      render: (r) => <ProgressBar value={r.total ? Math.round((r.done / r.total) * 100) : 0} />,
    },
  ];

  return (
    <div className={styles.stack}>
      <PageHeader title="Reports" description="Task completion across your projects." />
      <div className={styles.statsGrid}>
        <StatCard label="Total tasks" value={tasks.length} />
        <StatCard label="Completed" value={totalDone} />
        <StatCard label="Overdue" value={totalOverdue} />
        <StatCard label="Completion rate" value={`${completion}%`} />
      </div>
      <Card title="By project" padded={false}>
        <Table columns={columns} rows={rows} getRowKey={(r) => r.id} />
      </Card>
    </div>
  );
}
