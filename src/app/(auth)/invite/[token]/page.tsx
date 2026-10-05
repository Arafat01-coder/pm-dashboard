import type { Metadata } from "next";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/permissions";
import { findValidInvitation } from "@/services/invitationService";
import { isRole } from "@/types/auth";
import { AuthShell } from "../../AuthShell";
import { SetPasswordForm } from "../../SetPasswordForm";
import styles from "../../login/login.module.css";

export const metadata: Metadata = { title: "Join ProjectHub" };

export default async function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await findValidInvitation(token);

  if (!invitation) {
    return (
      <AuthShell title="Invitation not valid" subtitle="This invite link is invalid, already used, or has expired.">
        <p className={styles.footerLink}>
          Ask an admin for a new invitation, or <Link href="/login">sign in</Link> if you already have an account.
        </p>
      </AuthShell>
    );
  }

  const roleLabel = isRole(invitation.role) ? ROLE_LABELS[invitation.role] : invitation.role;
  return (
    <AuthShell title="Join ProjectHub" subtitle={`You've been invited as ${roleLabel}. Set up your account to continue.`}>
      <SetPasswordForm mode="invite" token={token} email={invitation.email} />
    </AuthShell>
  );
}
