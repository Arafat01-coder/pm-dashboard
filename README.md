# ProjectHub: Project Management Dashboard

A role-based project management dashboard built with Next.js, React, TypeScript, Node.js and a SQL database (Prisma).

- **[docs/OVERVIEW.md](docs/OVERVIEW.md)**: plain-language overview to share with the team (what was built, roles, pages, how access works, FAQ)
- **[docs/STRUCTURE.md](docs/STRUCTURE.md)**: the detailed structure: roles, permission matrix, pages, flows, data model

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **CSS Modules** with shared design tokens (`src/app/globals.css`), light and dark mode
- **Prisma 7** ORM with **SQLite** for local development (switchable to PostgreSQL)
- **jose** (JWT sessions) + **bcryptjs** (password hashing)

## Getting started

```bash
npm install                  # also generates the database client
cp .env.example .env.local   # then set JWT_SECRET to a long random string
npm run db:migrate           # creates prisma/dev.db with all tables
npm run db:seed              # fills it with demo users, projects and tasks
npm run dev
```

On Windows PowerShell, if `npm` is blocked by the script policy, use `npm.cmd` instead.

Open http://localhost:3000. In development the login page shows demo accounts you can click to fill in. Every demo account uses the password `Password123!`.

| Role | Email |
|---|---|
| Super Admin | owner@demo.dev |
| Admin | admin@demo.dev |
| Project Manager | pm@demo.dev |
| Team Member | member@demo.dev |
| Client | client@demo.dev |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build (generates the database client, type-checks) |
| `npm start` | Run the production build |
| `npm run typecheck` | Type-check only |
| `npm run db:migrate` | Apply schema changes to the database (creates a migration) |
| `npm run db:seed` | Reset all data to the demo data |
| `npm run db:reset` | Drop the database, re-run all migrations and seed |
| `npm run db:studio` | Open Prisma Studio, a visual editor for the database |

## Features

| Area | What you can do |
|---|---|
| Projects | Create, edit, delete; choose members; status and due date; progress from finished tasks; search and filter |
| Tasks | Create, edit, delete; assign to project members; priority, status, due date; list view and Kanban board (drag and drop); search and filters; overdue highlighting |
| Comments | Discuss each task on its page |
| Team | Invite people by email (invite link), change roles, deactivate/reactivate accounts |
| Accounts | Login/logout, forgot/reset password, change password, edit profile |
| Activity log | Who did what, on the dashboard and on each project |
| Reports | Completion rate, overdue tasks, by project and by person |

## Email

No email service is connected yet. Invite and password-reset emails are printed in the terminal running the server, and:

- the **Invite member** dialog shows the invite link so an admin can send it manually;
- in development, the **Forgot password** page shows the reset link after submitting.

To send real email, replace the body of `sendEmail()` in `src/lib/mailer.ts` with a provider (Resend, SendGrid, AWS SES, SMTP...) and set `isDevMailer` to `false`.

## Folder structure

```
prisma/
  schema.prisma            Database tables
  migrations/              Schema history (committed)
  seed.ts                  Demo data
src/
  app/
    (auth)/                login, forgot-password, reset-password/[token], invite/[token]
    (dashboard)/           dashboard, projects, projects/[id], tasks, tasks/board, tasks/[id], team, reports, settings
    api/                   auth/*, projects, tasks, comments, users, invitations, activity, me
  components/
    ui/                    Reusable UI: Button, Input, Select, Textarea, Modal, Toast, Table, Card, Badge...
    layout/                DashboardShell, Sidebar, Topbar, UserMenu
    common/                FilterBar (search + filters in the URL), ActivityFeed
  features/                Feature components: project/task forms, Kanban board, comments, team actions, settings forms
  services/                All database access + business rules (who may do what)
  lib/
    auth/                  Sessions (JWT), passwords, server-side checks, rate limit
    permissions.ts         Role -> permission map (single source of truth)
    db.ts                  Database client
    validation.ts, errors.ts, mailer.ts, tokens.ts, format.ts ...
  config/navigation.ts     Sidebar items + required permission
  context/AuthContext.tsx  useAuth(): user, login(), logout(), can()
  proxy.ts                 Route protection before each request
```

## How to...

**Protect a new page**
```tsx
export default async function Page() {
  const user = await requirePermission("report:view"); // redirects if not allowed
  ...
}
```

**Protect a new API route**
```ts
export async function GET() {
  const { user, error } = await authorizeApi("project:view");
  if (error) return error; // 401 or 403
  ...
}
```

**Show UI only for some users**
- Server component: `{can(user, "project:create") && <Button>New project</Button>}`
- Client component: `<Can permission="project:create"><Button>New project</Button></Can>`

**Add a role or permission**
1. Add it to `Role` / `Permission` in `src/types/auth.ts`.
2. Add it to `ROLE_PERMISSIONS` and `ROLE_LABELS` in `src/lib/permissions.ts`.
3. Update the matrix in `docs/STRUCTURE.md`.

**Change the database schema**: edit `prisma/schema.prisma`, run `npm run db:migrate -- --name what_changed`, commit the new migration folder.

## Deploying

SQLite keeps the database in a file, which works on a regular server (a VPS, Render or Railway with a persistent disk) but **not on Vercel**, whose servers don't keep files. For Vercel:

1. Create a PostgreSQL database (Neon, Supabase, Vercel Postgres...).
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
3. Replace the SQLite adapter in `src/lib/db.ts` and `prisma/seed.ts` with `@prisma/adapter-pg` (`npm install @prisma/adapter-pg`).
4. Delete `prisma/migrations`, then run `npm run db:migrate -- --name init` against the new database.
5. In Vercel, import the GitHub repo and set `DATABASE_URL`, `JWT_SECRET` (a new long random value) and `APP_URL` (your Vercel URL).

Also before going live:
- Connect a real email service (see Email above).
- Move the login rate limiter (`src/lib/auth/rateLimit.ts`) to Redis or the database if running more than one server.
