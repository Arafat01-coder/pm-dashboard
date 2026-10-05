import type { Metadata } from "next";
import { Badge, Button, Card, Icon, PageHeader, ProgressBar, Table, type Column } from "@/components/ui";
import { requirePermission } from "@/lib/auth/server";
import { PROJECT_STATUS, formatDate } from "@/lib/format";
import { can } from "@/lib/permissions";
import { listProjectsForUser } from "@/services/projectService";
import { listUsers } from "@/services/userService";
import type { Project } from "@/types/domain";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const user = await requirePermission("project:view");
  const [projects, users] = await Promise.all([listProjectsForUser(user), listUsers()]);
  const userName = new Map(users.map((u) => [u.id, u.name]));

  const columns: Column<Project>[] = [
    {
      key: "name",
      header: "Project",
      render: (p) => (
        <div className={styles.itemMain}>
          <span className={styles.cellTitle}>{p.name}</span>
          <span className={styles.muted}>{p.description}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <Badge tone={PROJECT_STATUS[p.status].tone}>{PROJECT_STATUS[p.status].label}</Badge>,
    },
    { key: "progress", header: "Progress", hideOnMobile: true, render: (p) => <ProgressBar value={p.progress} /> },
    { key: "owner", header: "Owner", hideOnMobile: true, render: (p) => userName.get(p.ownerId) ?? "—" },
    { key: "due", header: "Due date", hideOnMobile: true, render: (p) => formatDate(p.dueDate) },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        description="All projects you have access to."
        actions={
          can(user, "project:create") && <Button leftIcon={<Icon name="plus" size={16} />}>New project</Button>
        }
      />
      <Card padded={false}>
        <Table
          columns={columns}
          rows={projects}
          getRowKey={(p) => p.id}
          emptyTitle="No projects yet"
          emptyDescription="Projects you are added to will appear here."
        />
      </Card>
    </>
  );
}
