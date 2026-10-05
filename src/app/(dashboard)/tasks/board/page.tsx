import type { Metadata } from "next";
import { FilterBar } from "@/components/common/FilterBar";
import { PageHeader } from "@/components/ui";
import { KanbanBoard } from "@/features/tasks/KanbanBoard";
import { NewTaskButton } from "@/features/tasks/NewTaskButton";
import { TaskViewToggle } from "@/features/tasks/TaskViewToggle";
import { loadTaskPageData } from "@/features/tasks/taskPageData";
import { requirePermission } from "@/lib/auth/server";
import { todayIso } from "@/lib/dates";
import { can } from "@/lib/permissions";
import { parseTaskFilters } from "@/lib/taskFilters";
import { listTasksForUser } from "@/services/taskService";

export const metadata: Metadata = { title: "Task board" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TaskBoardPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("task:view");
  const params = await searchParams;
  // The board shows every status as a column, so the status filter does not apply.
  const filters = { ...parseTaskFilters(params), status: undefined };
  const [tasks, pageData] = await Promise.all([
    listTasksForUser(user, filters),
    loadTaskPageData(user, { includeStatus: false }),
  ]);
  const query = new URLSearchParams(
    Object.entries(params).filter(
      (e): e is [string, string] => typeof e[1] === "string" && !!e[1] && e[0] !== "status",
    ),
  ).toString();

  return (
    <>
      <PageHeader
        title="Task board"
        description={
          can(user, "task:update_status")
            ? "Drag a card to another column, or use its menu, to change its status."
            : "Tasks by status."
        }
        actions={
          <>
            <TaskViewToggle current="board" query={query} />
            {pageData.canCreate && <NewTaskButton projects={pageData.projectOptions} />}
          </>
        }
      />
      <FilterBar searchPlaceholder="Search tasks" filters={pageData.filters} />
      <KanbanBoard tasks={tasks} canMove={can(user, "task:update_status")} today={todayIso()} />
    </>
  );
}
