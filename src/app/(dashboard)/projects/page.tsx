import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar } from "@/components/common/FilterBar";
import { Badge, Card, PageHeader, ProgressBar, Table, type Column } from "@/components/ui";
import { NewProjectButton } from "@/features/projects/NewProjectButton";
import { requirePermission } from "@/lib/auth/server";
import { todayIso } from "@/lib/dates";
import { PROJECT_STATUS, formatDate, isOverdue, toOptions } from "@/lib/format";
import { can } from "@/lib/permissions";
import { listAssignableUsers, listProjectsForUser } from "@/services/projectService";
import { PROJECT_STATUSES, type ProjectListItem, type ProjectStatus } from "@/types/domain";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Projects" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("project:view");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : undefined;
  const status = PROJECT_STATUSES.includes(params.status as ProjectStatus) ? (params.status as ProjectStatus) : undefined;

  const canCreate = can(user, "project:create");
  const [projects, users] = await Promise.all([
    listProjectsForUser(user, { q, status }),
    canCreate ? listAssignableUsers() : Promise.resolve([]),
  ]);
  const today = todayIso();

  const columns: Column<ProjectListItem>[] = [
    {
      key: "name",
      header: "Project",
      render: (p) => (
        <div className={styles.itemMain}>
          <Link href={`/projects/${p.id}`} className={`${styles.cellTitle} ${styles.titleLink}`}>
            {p.name}
          </Link>
          <span className={styles.muted}>{p.description}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <Badge tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Badge>,
    },
    {
      key: "progress",
      header: "Progress",
      hideOnMobile: true,
      render: (p) => <ProgressBar value={p.progress} label={`${p.name} progress`} />,
    },
    { key: "tasks", header: "Tasks", hideOnMobile: true, render: (p) => `${p.doneCount} / ${p.taskCount}` },
    { key: "owner", header: "Owner", hideOnMobile: true, render: (p) => p.owner.name },
    {
      key: "due",
      header: "Due date",
      hideOnMobile: true,
      render: (p) => (
        <span className={isOverdue(p.dueDate, p.status === "completed", today) ? styles.overdue : undefined}>
          {formatDate(p.dueDate)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        description={can(user, "project:view_all") ? "All projects in the organization." : "Projects you are a member of."}
        actions={canCreate && <NewProjectButton users={users} currentUserId={user.id} />}
      />
      <FilterBar
        searchPlaceholder="Search projects"
        filters={[{ key: "status", label: "Status", placeholder: "Any status", options: toOptions(PROJECT_STATUS) }]}
      />
      <Card padded={false}>
        <Table
          columns={columns}
          rows={projects}
          getRowKey={(p) => p.id}
          emptyTitle={q || status ? "No projects match your filters" : "No projects yet"}
          emptyDescription={q || status ? "Try a different search or clear the filters." : "Projects you are added to will appear here."}
        />
      </Card>
    </>
  );
}
