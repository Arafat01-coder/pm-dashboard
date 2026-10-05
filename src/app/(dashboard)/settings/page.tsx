import type { Metadata } from "next";
import { Badge, Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth/server";
import { ROLE_LABELS, ROLE_PERMISSIONS, can } from "@/lib/permissions";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className={styles.stack}>
      <PageHeader title="Settings" description="Your profile and access." />

      <Card title="Profile">
        <dl className={styles.detailsGrid}>
          <dt>Name</dt>
          <dd>{user.name}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Job title</dt>
          <dd>{user.title}</dd>
          <dt>Role</dt>
          <dd>
            <Badge tone="primary">{ROLE_LABELS[user.role]}</Badge>
          </dd>
        </dl>
      </Card>

      <Card title="Your permissions">
        <div className={styles.permissionList}>
          {ROLE_PERMISSIONS[user.role].map((p) => (
            <Badge key={p}>{p}</Badge>
          ))}
        </div>
      </Card>

      {can(user, "settings:manage_org") && (
        <Card title="Organization">
          <p className={styles.muted}>
            Organization settings (name, logo, default roles) will live here. Only admins can see this section.
          </p>
        </Card>
      )}
    </div>
  );
}
