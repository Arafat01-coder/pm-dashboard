import type { Metadata } from "next";
import { Card, Icon, LinkButton } from "@/components/ui";
import styles from "../pages.module.css";

export const metadata: Metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <Card>
      <div className={styles.centered}>
        <span className={styles.iconCircle}>
          <Icon name="lock" size={26} />
        </span>
        <h1>You don&apos;t have access to this page</h1>
        <p className={styles.muted}>
          Your role does not include permission for this section. Ask an admin if you think this is a mistake.
        </p>
        <LinkButton href="/dashboard" variant="secondary">
          Back to dashboard
        </LinkButton>
      </div>
    </Card>
  );
}
