import type { FilterDef } from "@/components/common/FilterBar";
import { TASK_PRIORITY, TASK_STATUS, toOptions } from "@/lib/format";
import { can } from "@/lib/permissions";
import { listProjectOptions } from "@/services/projectService";
import type { PublicUser } from "@/types/auth";

/** Data shared by the Tasks list and board pages: filter choices and the projects a task can go in. */
export async function loadTaskPageData(user: PublicUser, opts: { includeStatus: boolean }) {
  const projectOptions = await listProjectOptions(user);

  const people = new Map<string, string>();
  for (const p of projectOptions) for (const m of p.members) people.set(m.id, m.name);
  const assigneeOptions = [
    { value: "me", label: "Assigned to me" },
    { value: "unassigned", label: "Unassigned" },
    ...[...people.entries()]
      .filter(([id]) => id !== user.id)
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label })),
  ];

  const filters: FilterDef[] = [
    ...(opts.includeStatus
      ? [{ key: "status", label: "Status", placeholder: "Any status", options: toOptions(TASK_STATUS) }]
      : []),
    { key: "priority", label: "Priority", placeholder: "Any priority", options: toOptions(TASK_PRIORITY) },
    { key: "assignee", label: "Assignee", placeholder: "Anyone", options: assigneeOptions },
    {
      key: "project",
      label: "Project",
      placeholder: "All projects",
      options: projectOptions.map((p) => ({ value: p.id, label: p.name })),
    },
  ];

  return { filters, projectOptions, canCreate: can(user, "task:create") };
}
