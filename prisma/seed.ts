/**
 * Fills the database with demo data. Run with: npm run db:seed
 * (also runs automatically after `npm run db:reset`).
 * Safe to re-run: it clears every table first.
 */
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_PASSWORD } from "../src/lib/demo";

process.loadEnvFile?.(".env.local");

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

async function main() {
  // Clear in dependency order.
  await db.activityLog.deleteMany();
  await db.comment.deleteMany();
  await db.task.deleteMany();
  await db.projectMember.deleteMany();
  await db.project.deleteMany();
  await db.invitation.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users = {
    owner: { id: "u1", name: "Olivia Owner", email: "owner@demo.dev", role: "super_admin", title: "Founder" },
    admin: { id: "u2", name: "Adam Admin", email: "admin@demo.dev", role: "admin", title: "Operations Lead" },
    pm: { id: "u3", name: "Priya Manager", email: "pm@demo.dev", role: "project_manager", title: "Project Manager" },
    member: { id: "u4", name: "Sam Member", email: "member@demo.dev", role: "member", title: "Frontend Developer" },
    client: { id: "u5", name: "Chris Client", email: "client@demo.dev", role: "client", title: "Client Stakeholder" },
    dana: { id: "u6", name: "Dana Designer", email: "dana@demo.dev", role: "member", title: "UI Designer" },
  };
  for (const u of Object.values(users)) {
    await db.user.create({ data: { ...u, passwordHash } });
  }

  const projects = [
    {
      id: "p1",
      name: "AI Summit Website",
      description: "Landing page, schedule and registration flow for the AI Summit.",
      status: "active",
      dueDate: day("2026-10-20"),
      ownerId: "u3",
      memberIds: ["u3", "u4", "u6", "u5"],
    },
    {
      id: "p2",
      name: "STR Secrets Launch",
      description: "Course launch pages, email sequences and checkout.",
      status: "active",
      dueDate: day("2026-11-05"),
      ownerId: "u3",
      memberIds: ["u3", "u4"],
    },
    {
      id: "p3",
      name: "Internal PM Dashboard",
      description: "Project management dashboard with role-based access.",
      status: "planning",
      dueDate: day("2026-12-01"),
      ownerId: "u2",
      memberIds: ["u2", "u4", "u6"],
    },
    {
      id: "p4",
      name: "Brand Refresh",
      description: "Updated logo, colors and design system.",
      status: "completed",
      dueDate: day("2026-08-30"),
      ownerId: "u2",
      memberIds: ["u2", "u6"],
    },
  ];
  for (const { memberIds, ...p } of projects) {
    await db.project.create({
      data: { ...p, members: { create: memberIds.map((userId) => ({ userId })) } },
    });
  }

  const tasks = [
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
  for (const t of tasks) {
    const project = projects.find((p) => p.id === t.projectId)!;
    await db.task.create({
      data: { ...t, dueDate: day(t.dueDate), createdById: project.ownerId },
    });
  }

  await db.comment.createMany({
    data: [
      { taskId: "t1", authorId: "u3", body: "Use the speaker photos from the shared drive, please." },
      { taskId: "t1", authorId: "u4", body: "On it. Grid is responsive, adding hover states next." },
      { taskId: "t4", authorId: "u3", body: "Payment provider sandbox keys are in the team vault." },
    ],
  });

  await db.activityLog.createMany({
    data: [
      { actorId: "u3", action: "project.created", summary: "created project AI Summit Website", entityType: "project", entityId: "p1", projectId: "p1" },
      { actorId: "u6", action: "task.status_changed", summary: "moved Hero section design to Done", entityType: "task", entityId: "t3", projectId: "p1" },
      { actorId: "u4", action: "task.status_changed", summary: "moved Checkout page integration to In review", entityType: "task", entityId: "t4", projectId: "p2" },
      { actorId: "u4", action: "task.status_changed", summary: "moved Define roles and permission matrix to Done", entityType: "task", entityId: "t6", projectId: "p3" },
    ],
  });

  console.log(`Seeded ${Object.keys(users).length} users, ${projects.length} projects, ${tasks.length} tasks.`);
  console.log(`Demo password for every account: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
