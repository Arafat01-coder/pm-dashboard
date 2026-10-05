import type { Role } from "@/types/auth";

/**
 * Demo accounts created by `npm run db:seed`. The login page shows them as
 * one-click buttons in development only.
 */

export const DEMO_PASSWORD = "Password123!";

export const DEMO_ACCOUNTS: { email: string; role: Role }[] = [
  { email: "owner@demo.dev", role: "super_admin" },
  { email: "admin@demo.dev", role: "admin" },
  { email: "pm@demo.dev", role: "project_manager" },
  { email: "member@demo.dev", role: "member" },
  { email: "client@demo.dev", role: "client" },
];
