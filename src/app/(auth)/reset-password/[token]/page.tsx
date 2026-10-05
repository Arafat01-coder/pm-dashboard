import type { Metadata } from "next";
import Link from "next/link";
import { isResetTokenValid } from "@/services/passwordResetService";
import { AuthShell } from "../../AuthShell";
import { SetPasswordForm } from "../../SetPasswordForm";
import styles from "../../login/login.module.css";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!(await isResetTokenValid(token))) {
    return (
      <AuthShell title="Link expired" subtitle="This reset link is invalid, already used, or has expired.">
        <p className={styles.footerLink}>
          <Link href="/forgot-password">Request a new link</Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="You'll be signed out on other devices.">
      <SetPasswordForm mode="reset" token={token} />
    </AuthShell>
  );
}
