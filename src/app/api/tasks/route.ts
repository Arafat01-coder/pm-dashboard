import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { handleApiError, readJson } from "@/lib/errors";
import { validator } from "@/lib/validation";
import { createTask, listTasksForUser } from "@/services/taskService";
import { parseTaskFilters } from "@/lib/taskFilters";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/types/domain";

export async function GET(request: Request) {
  const { user, error } = await authorizeApi("task:view");
  if (error) return error;
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return NextResponse.json({ tasks: await listTasksForUser(user, parseTaskFilters(params)) });
}

export async function POST(request: Request) {
  const { user, error } = await authorizeApi("task:create");
  if (error) return error;
  try {
    const v = validator(await readJson(request));
    const projectId = v.string("projectId", { required: true, max: 64, label: "Project" });
    const title = v.string("title", { required: true, max: 200, label: "Title" });
    const description = v.string("description", { max: 5000, label: "Description" });
    const status = v.oneOf("status", TASK_STATUSES, { label: "Status" });
    const priority = v.oneOf("priority", TASK_PRIORITIES, { label: "Priority" });
    const assigneeId = v.id("assigneeId", { label: "Assignee" });
    const dueDate = v.date("dueDate", { label: "Due date" });
    v.done();

    const task = await createTask(user, projectId!, {
      title: title!,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
