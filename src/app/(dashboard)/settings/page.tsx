import type { Metadata } from "next";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ChangePasswordForm } from "@/features/settings/ChangePasswordForm";
import { ProfileForm } from "@/features/settings/ProfileForm";
import { requireUser } from "@/lib/auth/server";
import { ROLE_LABELS, ROLE_PERMISSIONS, can } from "@/lib/permissions";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className={styles.stack}>
      <PageHeader title="Settings" description="Your profile, password and access." />

      <Card title="Profile">
        <ProfileForm />
      </Card>

      <Card title="Change password">
        <ChangePasswordForm />
      </Card>

      <Card title="Your access">
        <p className={styles.muted} style={{ marginBottom: 12 }}>
          Role: <Badge tone="primary">{ROLE_LABELS[user.role]}</Badge>
        </p>
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
