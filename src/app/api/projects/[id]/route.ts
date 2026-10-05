import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { handleApiError, notFound, readJson } from "@/lib/errors";
import { validator } from "@/lib/validation";
import { deleteProject, getProjectForUser, updateProject } from "@/services/projectService";
import { PROJECT_STATUSES } from "@/types/domain";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { user, error } = await authorizeApi("project:view");
  if (error) return error;
  const project = await getProjectForUser(user, (await params).id);
  if (!project) return handleApiError(notFound("Project not found"));
  return NextResponse.json({ project });
}

export async function PATCH(request: Request, { params }: Context) {
  const { user, error } = await authorizeApi("project:edit");
  if (error) return error;
  try {
    const v = validator(await readJson(request));
    const name = v.string("name", { max: 120, label: "Name" });
    const description = v.string("description", { max: 2000, label: "Description" });
    const status = v.oneOf("status", PROJECT_STATUSES, { label: "Status" });
    const dueDate = v.date("dueDate", { label: "Due date" });
    const memberIds = v.ids("memberIds", { label: "Members" });
    if (name === "") v.errors.name = "Name is required";
    v.done();

    const project = await updateProject(user, (await params).id, { name, description, status, dueDate, memberIds });
    return NextResponse.json({ project });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { user, error } = await authorizeApi("project:delete");
  if (error) return error;
  try {
    await deleteProject(user, (await params).id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
