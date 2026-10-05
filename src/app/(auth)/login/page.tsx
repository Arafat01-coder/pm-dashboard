import type { Metadata } from "next";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { ROLE_LABELS } from "@/lib/permissions";
import { AuthShell } from "../AuthShell";
import { LoginForm, type DemoAccount } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

/** Only allow redirects to paths on this site (blocks open redirects). */
function safeNextPath(next: string | string[] | undefined): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { next, reset } = await searchParams;

  // Demo accounts are shown in development only.
  const demoAccounts: DemoAccount[] =
    process.env.NODE_ENV === "production"
      ? []
      : DEMO_ACCOUNTS.map((u) => ({
          email: u.email,
          password: DEMO_PASSWORD,
          label: ROLE_LABELS[u.role],
        }));

  return (
    <AuthShell title="Sign in to your account" subtitle="Welcome back. Enter your details to continue.">
      <LoginForm
        nextPath={safeNextPath(next)}
        demoAccounts={demoAccounts}
        notice={reset === "1" ? "Your password was reset. Sign in with your new password." : undefined}
      />
    </AuthShell>
  );
}
