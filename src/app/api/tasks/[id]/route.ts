import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { handleApiError, notFound, readJson } from "@/lib/errors";
import { validator } from "@/lib/validation";
import { deleteTask, getTaskForUser, updateTask } from "@/services/taskService";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/types/domain";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { user, error } = await authorizeApi("task:view");
  if (error) return error;
  const task = await getTaskForUser(user, (await params).id);
  if (!task) return handleApiError(notFound("Task not found"));
  return NextResponse.json({ task });
}

/** Field-level rules (status-only for members) are enforced in updateTask(). */
export async function PATCH(request: Request, { params }: Context) {
  const { user, error } = await authorizeApi("task:view");
  if (error) return error;
  try {
    const v = validator(await readJson(request));
    const title = v.string("title", { max: 200, label: "Title" });
    const description = v.string("description", { max: 5000, label: "Description" });
    const status = v.oneOf("status", TASK_STATUSES, { label: "Status" });
    const priority = v.oneOf("priority", TASK_PRIORITIES, { label: "Priority" });
    const assigneeId = v.id("assigneeId", { label: "Assignee" });
    const dueDate = v.date("dueDate", { label: "Due date" });
    if (title === "") v.errors.title = "Title is required";
    v.done();

    const task = await updateTask(user, (await params).id, {
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
    });
    return NextResponse.json({ task });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { user, error } = await authorizeApi("task:delete");
  if (error) return error;
  try {
    return NextResponse.json(await deleteTask(user, (await params).id));
  } catch (e) {
    return handleApiError(e);
  }
}
