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
| `task:comment` | ✅ | ✅ | ✅ | ✅ | |
| `user:view` (Team page) | ✅ | ✅ | ✅ | | |
| `user:invite` | ✅ | ✅ | | | |
| `user:manage_roles` (change role, deactivate) | ✅ | ✅ | | | |
| `report:view` | ✅ | ✅ | ✅ | | |
| `activity:view` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `settings:manage_org` | ✅ | ✅ | | | |
| `billing:manage` | ✅ | | | | |

**Data scoping:** with `project:view_all` a user sees every project. Without it, a user sees only projects they are a member of, and only the tasks, comments and activity in those projects. A project they can't see answers "not found", so its existence isn't revealed.

**Extra rules enforced in `src/services`:**
- Team Members can change a task's **status only**; other fields need `task:edit`.
- A task can only be assigned to an active member of its project. Removing someone from a project unassigns their tasks there.
- Nobody can change their own role or deactivate themselves. Only a Super Admin can manage or create another Super Admin.
- Deactivating a user signs them out everywhere at once.

## 4. Pages and features

| Page | Route | Permission | Contents |
|---|---|---|---|
| Login | `/login` | public | Email/password form, validation, error states, "Forgot password?" link |
| Forgot password | `/forgot-password` | public | Request a reset link (same answer whether or not the email exists) |
| Reset password | `/reset-password/[token]` | link holder | Set a new password; link expires in 60 minutes, works once |
| Accept invite | `/invite/[token]` | link holder | Set name and password, then signed in; link expires in 7 days |
| Dashboard | `/dashboard` | `dashboard:view` | Stats incl. overdue, my open tasks, project progress, recent activity, team workload (`report:view`) |
| Projects | `/projects` | `project:view` | Search + status filter; list with progress, tasks done, owner, due date; "New project" (`project:create`) |
| Project details | `/projects/[id]` | `project:view` + member | Stats, tasks (inline status change), members, activity; Edit (`project:edit`), Delete (`project:delete`), New task |
| Tasks | `/tasks` | `task:view` | Search + filters (status, priority, assignee, project); inline status change; List/Board switch |
| Task board | `/tasks/board` | `task:view` | Kanban columns by status; drag and drop or card menu to move (`task:update_status`) |
| Task details | `/tasks/[id]` | `task:view` + member | Description, details, status, comments (`task:comment`); Edit (`task:edit`), Delete (`task:delete`) |
| Team | `/team` | `user:view` | People, roles, status; role dropdown + deactivate (`user:manage_roles`); invite + pending invites (`user:invite`) |
| Reports | `/reports` | `report:view` | Completion rate, overdue, tasks by status, by project, by person |
| Settings | `/settings` | signed in | Edit profile, change password, own permissions, organization section (`settings:manage_org`) |
| Access denied | `/forbidden` | signed in | Shown when a role opens a page it cannot access |

**Possible next steps:** in-app notifications, file attachments on tasks, per-project roles (see open question 3), organization settings, Google/Microsoft sign-in.

## 5. Main user flows

```
Sign in:      /login → POST /api/auth/login → cookie set → /dashboard (or the page they first asked for)
Open a page:  request → proxy (signed in? allowed route?) → page (re-checks user + permission) → data scoped to user
No access:    proxy or page → /forbidden
Sign out:     user menu → POST /api/auth/logout → cookie cleared → /login
Expired:      proxy sees invalid token → clears cookie → /login?next=<page>
              tab regains focus → /api/auth/me returns 401 → /login
Invite:       admin → Invite member (email + role) → link emailed / shown → /invite/<token>
              → name + password → account created, signed in → /dashboard
Forgot pw:    /forgot-password → link emailed → /reset-password/<token> → new password
              → all sessions signed out → /login?reset=1
Change pw:    Settings → current + new password → other devices signed out, this one stays
Change data:  form or Kanban → API route (permission + scoping check) → database
              → activity log entry → toast message → page refreshes with new data
```

## 6. Authentication design

- Passwords are hashed with **bcrypt**. Plain passwords are never stored or compared.
- After login the server signs a **JWT** (HS256, `JWT_SECRET`) containing only the user id, role and a session version, and stores it in an **httpOnly, SameSite=Lax cookie** (also `Secure` in production). Browser JavaScript cannot read it.
- The **session version** is bumped on password change, password reset and deactivation, which invalidates every older cookie: "sign out everywhere".
- Invite and reset links carry a random 32-byte token; only its SHA-256 hash is stored, links expire, and each works once.
- Checks happen in three layers:
  1. `src/proxy.ts` runs before every page: redirects signed-out users and blocks restricted routes early.
  2. Pages call `requireUser()` / `requirePermission()` and API routes call `authorizeApi(permission)`. These load the user fresh, so deactivating a user takes effect immediately.
  3. The UI hides what the user cannot do (sidebar filtering, `can()` in server components, `<Can>` in client components). This layer is for convenience only; layers 1 and 2 do the protecting.
- Login protections: generic error message, equal timing for unknown emails, 5 failed attempts per email per 15 minutes, and the `next` redirect only accepts paths on this site.

## 7. Data model

Defined in `prisma/schema.prisma`; SQLite locally, PostgreSQL-ready.

```
User                id, name, email (unique), passwordHash, role, title, isActive, sessionVersion
Project             id, name, description, status, dueDate, ownerId
ProjectMember       projectId + userId (who can see the project)
Task                id, projectId, title, description, status, priority, assigneeId?, createdById, dueDate?
Comment             id, taskId, authorId, body, createdAt
ActivityLog         id, actorId, summary, action, entityType, entityId, projectId?, createdAt
Invitation          id, email, role, tokenHash, invitedById, expiresAt, acceptedAt?, revokedAt?
PasswordResetToken  id, userId, tokenHash, expiresAt, usedAt?
```

Project progress is calculated from its tasks (done ÷ total), never stored. Deleting a project deletes its members, tasks, comments and activity. Only `src/services/*` talks to the database.

## 8. Open questions for the team

1. Database for production: PostgreSQL is recommended (the app uses SQLite locally and switches with a config change).
2. Do clients need to log in, or receive shared read-only links instead?
3. Can a person have different roles in different projects (e.g. PM on one, member on another)? If yes, role moves from User to ProjectMember.
4. Is sign-up open, or invite-only? (Current design: invite-only by admins.)
5. Do we need Google/Microsoft sign-in later?
6. Which email service should send invites and password resets?
7. Where will it be hosted (Vercel + hosted PostgreSQL, or a server with SQLite/PostgreSQL)?
