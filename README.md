# ProjectHub: Project Management Dashboard

A role-based project management dashboard built with Next.js, React, TypeScript and Node.js.

See **[docs/STRUCTURE.md](docs/STRUCTURE.md)** for roles, the permission matrix, pages, flows and open questions.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **CSS Modules** with shared design tokens (`src/app/globals.css`), light and dark mode
- **Node.js** API routes for authentication
- **jose** (JWT) + **bcryptjs** (password hashing)

## Getting started

```bash
npm install
cp .env.example .env.local   # then set JWT_SECRET to a long random string
npm run dev
```

Open http://localhost:3000. In development the login page shows demo accounts you can click to fill in.

| Role | Email | Password |
|---|---|---|
| Super Admin | owner@demo.dev | Password123! |
| Admin | admin@demo.dev | Password123! |
| Project Manager | pm@demo.dev | Password123! |
| Team Member | member@demo.dev | Password123! |
| Client | client@demo.dev | Password123! |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build (includes type checking) |
| `npm start` | Run the production build |
| `npm run typecheck` | Type-check only |

## Folder structure

```
src/
  app/
    (auth)/login/          Login page + form
    (dashboard)/           Signed-in area: layout, dashboard, projects, tasks, team, reports, settings, forbidden
    api/auth/              login, logout, me
    api/projects/          Example permission-protected API
  components/
    ui/                    Reusable UI: Button, Input, Card, Badge, Table, StatCard, ...
    layout/                DashboardShell, Sidebar, Topbar, UserMenu
    auth/Can.tsx           Show UI only when the user has a permission
  config/navigation.ts     Sidebar items + required permission
  context/AuthContext.tsx  useAuth(): user, login(), logout(), can()
  lib/
    auth/                  session (JWT), password, server helpers, rate limit
    permissions.ts         Role → permission map (single source of truth)
    data/mock-db.ts        Temporary in-memory data
    format.ts              Labels, badge colors, date formatting
  services/                Data access (swap for a real database here)
  types/                   Shared TypeScript types
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

**Add a sidebar page**: add an entry to `src/config/navigation.ts` with its permission.

## Before production

- Replace `mock-db.ts` with a real database (see open questions in STRUCTURE.md).
- Move the login rate limiter to Redis or the database if running more than one server.
- Set a strong `JWT_SECRET` in the hosting environment.
- Add forgot/reset password and the invite flow.
