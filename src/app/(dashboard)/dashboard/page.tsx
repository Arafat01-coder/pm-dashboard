import type { Metadata } from "next";
import Link from "next/link";
import { ActivityFeed } from "@/components/common/ActivityFeed";
import { Badge, Card, EmptyState, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { requirePermission } from "@/lib/auth/server";
import { todayIso } from "@/lib/dates";
import { PROJECT_STATUS, TASK_PRIORITY, TASK_STATUS, formatDate, isOverdue } from "@/lib/format";
import { can } from "@/lib/permissions";
import { listActivity } from "@/services/activityService";
import { listProjectsForUser } from "@/services/projectService";
import { listTasksForUser } from "@/services/taskService";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requirePermission("dashboard:view");
  const [projects, tasks, activity] = await Promise.all([
    listProjectsForUser(user),
    listTasksForUser(user),
    listActivity(user, { limit: 8 }),
  ]);
  const today = todayIso();

  const myOpenTasks = tasks.filter((t) => t.assignee?.id === user.id && t.status !== "done");
  const activeProjects = projects.filter((p) => p.status === "active");
  const openTasks = tasks.filter((t) => t.status !== "done");
  const overdueTasks = openTasks.filter((t) => isOverdue(t.dueDate, false, today));

  // Workload per person: only shown to roles that can view reports.
  const showWorkload = can(user, "report:view");
  const workloadMap = new Map<string, { name: string; open: number }>();
  for (const t of openTasks) {
    if (!t.assignee) continue;
    const entry = workloadMap.get(t.assignee.id) ?? { name: t.assignee.name, open: 0 };
    entry.open += 1;
    workloadMap.set(t.assignee.id, entry);
  }
  const workload = [...workloadMap.entries()].sort((a, b) => b[1].open - a[1].open);

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
        <StatCard label="Overdue tasks" value={overdueTasks.length} hint={overdueTasks.length ? "Need attention" : "All on track"} />
      </div>

      <div className={styles.twoCol}>
        <div className={styles.stack}>
          <Card
            title="My tasks"
            padded={false}
            action={
              <Link href="/tasks?assignee=me" className={styles.muted}>
                View all
              </Link>
            }
          >
            {myOpenTasks.length === 0 ? (
              <EmptyState title="You're all caught up" description="No open tasks are assigned to you." />
            ) : (
              <ul className={styles.list}>
                {myOpenTasks.map((task) => (
                  <li key={task.id} className={styles.listItem}>
                    <div className={styles.itemMain}>
                      <Link href={`/tasks/${task.id}`} className={`${styles.itemTitle} ${styles.titleLink}`}>
                        {task.title}
                      </Link>
                      <span className={styles.muted}>
                        {task.projectName} ·{" "}
                        <span className={isOverdue(task.dueDate, false, today) ? styles.overdue : undefined}>
                          Due {formatDate(task.dueDate)}
                        </span>
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

          <Card title="Recent activity" padded={false}>
            <ActivityFeed items={activity} />
          </Card>
        </div>

        <div className={styles.stack}>
          <Card title="Project progress" padded={false}>
            {projects.length === 0 ? (
              <EmptyState title="No projects yet" />
            ) : (
              projects.map((p) => (
                <div key={p.id} className={styles.projectRow}>
                  <div className={styles.rowBetween}>
                    <Link href={`/projects/${p.id}`} className={`${styles.itemTitle} ${styles.titleLink}`}>
                      {p.name}
                    </Link>
                    <Badge tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Badge>
                  </div>
                  <ProgressBar value={p.progress} label={`${p.name} progress`} />
                </div>
              ))
            )}
          </Card>

          {showWorkload && (
            <Card title="Team workload" padded={false}>
              {workload.length === 0 ? (
                <EmptyState title="No open tasks assigned" />
              ) : (
                <ul className={styles.list}>
                  {workload.map(([id, w]) => (
                    <li key={id} className={styles.listItem}>
                      <Link href={`/tasks?assignee=${id}`} className={styles.titleLink}>
                        {w.name}
                      </Link>
                      <span className={styles.muted}>{w.open} open</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
