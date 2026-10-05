# Project Management Dashboard: Structure

This document defines the dashboard's users, permissions, pages and flows. It is the plan the code follows, and it is the first thing to update when the product changes.

## 1. Goals

- Give each person a clear view of their projects and tasks.
- Give managers and admins control over projects, people and access.
- Build on a permission system that can grow (new roles, new features) without rewrites.

## 2. User roles

| Role | Who | Summary |
|---|---|---|
| **Super Admin** | Company owner | Full access, including billing and organization settings. |
| **Admin** | Operations / management | Everything except billing. Manages users, roles and all projects. |
| **Project Manager** | Leads a project | Creates and runs projects, assigns tasks, sees team and reports. Sees only projects they belong to. |
| **Team Member** | Developer, designer, etc. | Works on assigned tasks: creates tasks and updates status in their projects. |
| **Client** | External stakeholder | Read-only view of the projects they are added to. |

## 3. Permission matrix

Permissions use the form `resource:action`. **Code checks permissions, never role names.** To add a role, add one entry in `src/lib/permissions.ts`.

| Permission | Super Admin | Admin | Project Manager | Member | Client |
|---|:-:|:-:|:-:|:-:|:-:|
| `dashboard:view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `project:view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `project:view_all` (not only own projects) | ✅ | ✅ | | | |
| `project:create` | ✅ | ✅ | ✅ | | |
| `project:edit` | ✅ | ✅ | ✅ | | |
| `project:delete` | ✅ | ✅ | | | |
| `task:view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `task:create` | ✅ | ✅ | ✅ | ✅ | |
| `task:edit` | ✅ | ✅ | ✅ | | |
| `task:delete` | ✅ | ✅ | ✅ | | |
| `task:update_status` | ✅ | ✅ | ✅ | ✅ | |
| `user:view` (Team page) | ✅ | ✅ | ✅ | | |
| `user:invite` | ✅ | ✅ | | | |
| `user:manage_roles` | ✅ | ✅ | | | |
| `report:view` | ✅ | ✅ | ✅ | | |
| `settings:manage_org` | ✅ | ✅ | | | |
| `billing:manage` | ✅ | | | | |

**Data scoping:** with `project:view_all` a user sees every project. Without it, a user sees only projects where they are in `memberIds`, and only the tasks in those projects.

## 4. Pages and features

| Page | Route | Permission | Contents |
|---|---|---|---|
| Login | `/login` | public | Email/password form, validation, error states |
| Dashboard | `/dashboard` | `dashboard:view` | Stats, my open tasks, project progress, team workload (report:view only) |
| Projects | `/projects` | `project:view` | Project list with status, progress, owner and due date; "New project" button for `project:create` |
| Tasks | `/tasks` | `task:view` | Task list with assignee, priority, status and due date; "New task" button for `task:create` |
| Team | `/team` | `user:view` | People, roles and status; "Invite member" button for `user:invite` |
| Reports | `/reports` | `report:view` | Completion rate, overdue tasks, per-project breakdown |
| Settings | `/settings` | signed in | Profile, own permissions, organization section (`settings:manage_org`) |
| Access denied | `/forbidden` | signed in | Shown when a role opens a page it cannot access |

**Planned next:** project details page, Kanban board, task details with comments, create/edit forms, invite flow, notifications, activity log, forgot/reset password.

## 5. Main user flows

```
Sign in:      /login → POST /api/auth/login → cookie set → /dashboard (or the page they first asked for)
Open a page:  request → proxy (signed in? allowed route?) → page (re-checks user + permission) → data scoped to user
No access:    proxy or page → /forbidden
Sign out:     user menu → POST /api/auth/logout → cookie cleared → /login
Expired:      proxy sees invalid token → clears cookie → /login?next=<page>
              tab regains focus → /api/auth/me returns 401 → /login
```

## 6. Authentication design

- Passwords are hashed with **bcrypt**. Plain passwords are never stored or compared.
- After login the server signs a **JWT** (HS256, `JWT_SECRET`) containing only the user id and role, and stores it in an **httpOnly, SameSite=Lax cookie** (also `Secure` in production). Browser JavaScript cannot read it.
- Checks happen in three layers:
  1. `src/proxy.ts` runs before every page: redirects signed-out users and blocks restricted routes early.
  2. Pages call `requireUser()` / `requirePermission()` and API routes call `authorizeApi(permission)`. These load the user fresh, so deactivating a user takes effect immediately.
  3. The UI hides what the user cannot do (sidebar filtering, `can()` in server components, `<Can>` in client components). This layer is for convenience only; layers 1 and 2 do the protecting.
- Login protections: generic error message, equal timing for unknown emails, 5 failed attempts per email per 15 minutes, and the `next` redirect only accepts paths on this site.

## 7. Data model (draft)

```
User           id, name, email, passwordHash, role, title, isActive
Project        id, name, description, status, progress, dueDate, ownerId, memberIds[]
Task           id, projectId, title, status, priority, assigneeId, dueDate
-- planned --
Comment        id, taskId, authorId, body, createdAt
ActivityLog    id, actorId, action, entityType, entityId, createdAt
Organization   id, name, settings
```

Right now the data lives in `src/lib/data/mock-db.ts`. Only `src/services/*` reads it, so connecting a real database means changing the services only.

## 8. Open questions for the team

1. Which database: PostgreSQL or MongoDB?
2. Do clients need to log in, or receive shared read-only links instead?
3. Can a person have different roles in different projects (e.g. PM on one, member on another)? If yes, role moves from User to ProjectMember.
4. Is sign-up open, or invite-only? (Current design: invite-only by admins.)
5. Do we need Google/Microsoft sign-in later?
