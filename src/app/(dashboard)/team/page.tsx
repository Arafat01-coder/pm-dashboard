import type { Metadata } from "next";
import { Avatar, Badge, Card, PageHeader, Table, type Column } from "@/components/ui";
import { InviteMemberButton } from "@/features/team/InviteMemberButton";
import { RevokeInviteButton } from "@/features/team/RevokeInviteButton";
import { UserRowActions } from "@/features/team/UserRowActions";
import { requirePermission } from "@/lib/auth/server";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS, assignableRoles, can } from "@/lib/permissions";
import { listPendingInvitations } from "@/services/invitationService";
import { listUsers } from "@/services/userService";
import { isRole, type PublicUser } from "@/types/auth";
import type { InvitationItem } from "@/types/domain";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const user = await requirePermission("user:view");
  const canManage = can(user, "user:manage_roles");
  const canInvite = can(user, "user:invite");
  const roles = assignableRoles(user);
  const [users, invitations] = await Promise.all([listUsers(), listPendingInvitations(user)]);

  const columns: Column<PublicUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <span className={styles.person}>
          <Avatar name={u.name} />
          <span className={styles.itemMain}>
            <span className={styles.cellTitle}>
              {u.name}
              {u.id === user.id && <span className={styles.muted}> (you)</span>}
            </span>
            <span className={styles.muted}>{u.email}</span>
          </span>
        </span>
      ),
    },
    { key: "title", header: "Job title", hideOnMobile: true, render: (u) => u.title || "—" },
    { key: "role", header: "Role", hideOnMobile: canManage, render: (u) => <Badge tone="primary">{ROLE_LABELS[u.role]}</Badge> },
    {
      key: "status",
      header: "Status",
      hideOnMobile: true,
      render: (u) => (u.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "Manage",
            align: "right" as const,
            render: (u: PublicUser) =>
              u.id === user.id || (u.role === "super_admin" && user.role !== "super_admin") ? (
                <span className={styles.muted}>—</span>
              ) : (
                <UserRowActions user={u} roles={roles} />
              ),
          },
        ]
      : []),
  ];

  const inviteColumns: Column<InvitationItem>[] = [
    { key: "email", header: "Email", render: (i) => <span className={styles.cellTitle}>{i.email}</span> },
    {
      key: "role",
      header: "Role",
      render: (i) => <Badge tone="info">{isRole(i.role) ? ROLE_LABELS[i.role] : i.role}</Badge>,
    },
    { key: "by", header: "Invited by", hideOnMobile: true, render: (i) => i.invitedBy.name },
    { key: "expires", header: "Expires", hideOnMobile: true, render: (i) => formatDate(i.expiresAt) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (i) => <RevokeInviteButton id={i.id} email={i.email} />,
    },
  ];

  return (
    <div className={styles.stack}>
      <PageHeader
        title="Team"
        description="People in your organization and their roles."
        actions={canInvite && <InviteMemberButton roles={roles} />}
      />
      <Card padded={false}>
        <Table columns={columns} rows={users} getRowKey={(u) => u.id} />
      </Card>
      {canInvite && (
        <Card title={`Pending invitations (${invitations.length})`} padded={false}>
          <Table
            columns={inviteColumns}
            rows={invitations}
            getRowKey={(i) => i.id}
            emptyTitle="No pending invitations"
            emptyDescription="Invite people with the Invite member button."
          />
        </Card>
      )}
    </div>
  );
}
