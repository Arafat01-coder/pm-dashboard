import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { requirePermission } from "@/lib/auth/server";
import { PROJECT_STATUS, TASK_PRIORITY, TASK_STATUS, formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { listProjectsForUser, listTasksForUser } from "@/services/projectService";
import { listUsers } from "@/services/userService";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requirePermission("dashboard:view");
  const [projects, tasks, users] = await Promise.all([
    listProjectsForUser(user),
    listTasksForUser(user),
    listUsers(),
  ]);

  const myOpenTasks = tasks.filter((t) => t.assigneeId === user.id && t.status !== "done");
  const activeProjects = projects.filter((p) => p.status === "active");
  const openTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const projectName = new Map(projects.map((p) => [p.id, p.name]));

  // Workload per person: only shown to roles that can view reports.
  const showWorkload = can(user, "report:view");
  const workload = users
    .map((u) => ({ user: u, open: openTasks.filter((t) => t.assigneeId === u.id).length }))
    .filter((w) => w.open > 0)
    .sort((a, b) => b.open - a.open);

  return (
    <div className={styles.stack}>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Here is what is happening across your projects."
      />

      <div className={styles.statsGrid}>
        <StatCard label="Active projects" value={activeProjects.length} hint={`${projects.length} total visible`} />
        <StatCard label="My open tasks" value={myOpenTasks.length} />
        <StatCard label="Open tasks" value={openTasks.length} hint="Across your projects" />
        <StatCard label="Completed tasks" value={doneTasks.length} />
      </div>

      <div className={styles.twoCol}>
        <Card title="My tasks" padded={false} action={<Link href="/tasks" className={styles.muted}>View all</Link>}>
          {myOpenTasks.length === 0 ? (
            <EmptyState title="You're all caught up" description="No open tasks are assigned to you." />
          ) : (
            <ul className={styles.list}>
              {myOpenTasks.map((task) => (
                <li key={task.id} className={styles.listItem}>
                  <div className={styles.itemMain}>
                    <span className={styles.itemTitle}>{task.title}</span>
                    <span className={styles.muted}>
                      {projectName.get(task.projectId)} · Due {formatDate(task.dueDate)}
                    </span>
                  </div>
                  <div className={styles.badges}>
                    <Badge tone={TASK_PRIORITY[task.priority].tone}>{TASK_PRIORITY[task.priority].label}</Badge>
                    <Badge tone={TASK_STATUS[task.status].tone}>{TASK_STATUS[task.status].label}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className={styles.stack}>
          <Card title="Project progress" padded={false}>
            {projects.length === 0 ? (
              <EmptyState title="No projects yet" />
            ) : (
              projects.map((p) => (
                <div key={p.id} className={styles.projectRow}>
                  <div className={styles.rowBetween}>
                    <span className={styles.itemTitle}>{p.name}</span>
                    <Badge tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Badge>
                  </div>
                  <ProgressBar value={p.progress} label={`${p.name} progress`} />
                </div>
              ))
            )}
          </Card>

          {showWorkload && (
            <Card title="Team workload" padded={false}>
              <ul className={styles.list}>
                {workload.map((w) => (
                  <li key={w.user.id} className={styles.listItem}>
                    <span>{w.user.name}</span>
                    <span className={styles.muted}>{w.open} open</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
