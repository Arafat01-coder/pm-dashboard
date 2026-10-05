import type { Role } from "@/types/auth";
import type { Project, Task } from "@/types/domain";

/**
 * Temporary in-memory data used until a real database is chosen.
 * Only the services in src/services read this file, so replacing it with
 * MongoDB/PostgreSQL later means changing the services, not the UI.
 */

export const DEMO_PASSWORD = "Password123!";

export interface SeedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  isActive: boolean;
}

export const seedUsers: SeedUser[] = [
  { id: "u1", name: "Olivia Owner", email: "owner@demo.dev", role: "super_admin", title: "Founder", isActive: true },
  { id: "u2", name: "Adam Admin", email: "admin@demo.dev", role: "admin", title: "Operations Lead", isActive: true },
  { id: "u3", name: "Priya Manager", email: "pm@demo.dev", role: "project_manager", title: "Project Manager", isActive: true },
  { id: "u4", name: "Sam Member", email: "member@demo.dev", role: "member", title: "Frontend Developer", isActive: true },
  { id: "u5", name: "Chris Client", email: "client@demo.dev", role: "client", title: "Client Stakeholder", isActive: true },
  { id: "u6", name: "Dana Designer", email: "dana@demo.dev", role: "member", title: "UI Designer", isActive: true },
];

export const projects: Project[] = [
  {
    id: "p1",
    name: "AI Summit Website",
    description: "Landing page, schedule and registration flow for the AI Summit.",
    status: "active",
    progress: 72,
    dueDate: "2026-10-20",
    ownerId: "u3",
    memberIds: ["u3", "u4", "u6", "u5"],
  },
  {
    id: "p2",
    name: "STR Secrets Launch",
    description: "Course launch pages, email sequences and checkout.",
    status: "active",
    progress: 45,
    dueDate: "2026-11-05",
    ownerId: "u3",
    memberIds: ["u3", "u4"],
  },
  {
    id: "p3",
    name: "Internal PM Dashboard",
    description: "Project management dashboard with role-based access.",
    status: "planning",
    progress: 15,
    dueDate: "2026-12-01",
    ownerId: "u2",
    memberIds: ["u2", "u4", "u6"],
  },
  {
    id: "p4",
    name: "Brand Refresh",
    description: "Updated logo, colors and design system.",
    status: "completed",
    progress: 100,
    dueDate: "2026-08-30",
    ownerId: "u2",
    memberIds: ["u2", "u6"],
  },
];

export const tasks: Task[] = [
  { id: "t1", projectId: "p1", title: "Build speaker grid section", status: "in_progress", priority: "high", assigneeId: "u4", dueDate: "2026-10-08" },
  { id: "t2", projectId: "p1", title: "Registration form validation", status: "todo", priority: "high", assigneeId: "u4", dueDate: "2026-10-10" },
  { id: "t3", projectId: "p1", title: "Hero section design", status: "done", priority: "medium", assigneeId: "u6", dueDate: "2026-10-01" },
  { id: "t4", projectId: "p2", title: "Checkout page integration", status: "review", priority: "urgent", assigneeId: "u4", dueDate: "2026-10-07" },
  { id: "t5", projectId: "p2", title: "Write launch email copy", status: "todo", priority: "medium", assigneeId: "u3", dueDate: "2026-10-15" },
  { id: "t6", projectId: "p3", title: "Define roles and permission matrix", status: "done", priority: "high", assigneeId: "u4", dueDate: "2026-10-03" },
  { id: "t7", projectId: "p3", title: "Login / logout system", status: "in_progress", priority: "high", assigneeId: "u4", dueDate: "2026-10-09" },
  { id: "t8", projectId: "p3", title: "Dashboard wireframes", status: "review", priority: "medium", assigneeId: "u6", dueDate: "2026-10-12" },
  { id: "t9", projectId: "p4", title: "Final logo files export", status: "done", priority: "low", assigneeId: "u6", dueDate: "2026-08-28" },
];
