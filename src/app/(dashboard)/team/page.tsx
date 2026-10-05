import type { Metadata } from "next";
import { Avatar, Badge, Button, Card, Icon, PageHeader, Table, type Column } from "@/components/ui";
import { requirePermission } from "@/lib/auth/server";
import { ROLE_LABELS, can } from "@/lib/permissions";
import { listUsers } from "@/services/userService";
import type { PublicUser } from "@/types/auth";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const user = await requirePermission("user:view");
  const users = await listUsers();

  const columns: Column<PublicUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <span className={styles.person}>
          <Avatar name={u.name} />
          <span className={styles.itemMain}>
            <span className={styles.cellTitle}>{u.name}</span>
            <span className={styles.muted}>{u.email}</span>
          </span>
        </span>
      ),
    },
    { key: "title", header: "Job title", hideOnMobile: true, render: (u) => u.title },
    { key: "role", header: "Role", render: (u) => <Badge tone="primary">{ROLE_LABELS[u.role]}</Badge> },
    {
      key: "status",
      header: "Status",
      hideOnMobile: true,
      render: (u) => (u.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>),
    },
  ];

  return (
    <>
      <PageHeader
        title="Team"
        description="People in your organization and their roles."
        actions={
          can(user, "user:invite") && <Button leftIcon={<Icon name="plus" size={16} />}>Invite member</Button>
        }
      />
      <Card padded={false}>
        <Table columns={columns} rows={users} getRowKey={(u) => u.id} />
      </Card>
    </>
  );
}
