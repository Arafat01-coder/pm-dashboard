import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireUser } from "@/lib/auth/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // proxy.ts already redirects signed-out users; this re-check also covers
  // deleted or deactivated accounts whose token is still valid.
  await requireUser();
  return <DashboardShell>{children}</DashboardShell>;
}
