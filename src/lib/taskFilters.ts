import type { TaskFilters } from "@/services/taskService";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/types/domain";

/** Turns URL search params (?q=&status=&priority=&assignee=&project=) into safe filters. */
export function parseTaskFilters(params: Record<string, string | string[] | undefined>): TaskFilters {
  const one = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value ? value.slice(0, 100) : undefined;
  };
  const status = one("status") as TaskStatus | undefined;
  const priority = one("priority") as TaskPriority | undefined;
  return {
    q: one("q"),
    status: status && TASK_STATUSES.includes(status) ? status : undefined,
    priority: priority && TASK_PRIORITIES.includes(priority) ? priority : undefined,
    assignee: one("assignee"),
    projectId: one("project"),
  };
}
