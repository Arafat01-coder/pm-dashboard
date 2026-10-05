import type { Metadata } from "next";
import { DEMO_PASSWORD, seedUsers } from "@/lib/data/mock-db";
import { ROLE_LABELS } from "@/lib/permissions";
import { LoginForm, type DemoAccount } from "./LoginForm";
import styles from "./login.module.css";

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
  const { next } = await searchParams;

  // Demo accounts are shown in development only.
  const demoAccounts: DemoAccount[] =
    process.env.NODE_ENV === "production"
      ? []
      : seedUsers.slice(0, 5).map((u) => ({
          email: u.email,
          password: DEMO_PASSWORD,
          label: ROLE_LABELS[u.role],
        }));

  return (
    <main className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">PM</span>
          <span className={styles.brandName}>ProjectHub</span>
        </div>
        <h1 className={styles.title}>Sign in to your account</h1>
        <p className={styles.subtitle}>Welcome back. Enter your details to continue.</p>
        <LoginForm nextPath={safeNextPath(next)} demoAccounts={demoAccounts} />
      </div>
    </main>
  );
}
