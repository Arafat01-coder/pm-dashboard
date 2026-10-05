import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { handleApiError, readJson } from "@/lib/errors";
import { validator } from "@/lib/validation";
import { createProject, listProjectsForUser } from "@/services/projectService";
import { PROJECT_STATUSES, type ProjectStatus } from "@/types/domain";

export async function GET(request: Request) {
  const { user, error } = await authorizeApi("project:view");
  if (error) return error;
  const params = new URL(request.url).searchParams;
  const status = params.get("status") as ProjectStatus | null;
  return NextResponse.json({
    projects: await listProjectsForUser(user, {
      q: params.get("q") ?? undefined,
      status: status && PROJECT_STATUSES.includes(status) ? status : undefined,
    }),
  });
}

export async function POST(request: Request) {
  const { user, error } = await authorizeApi("project:create");
  if (error) return error;
  try {
    const v = validator(await readJson(request));
    const name = v.string("name", { required: true, max: 120, label: "Name" });
    const description = v.string("description", { max: 2000, label: "Description" });
    const status = v.oneOf("status", PROJECT_STATUSES, { label: "Status" });
    const dueDate = v.date("dueDate", { label: "Due date" });
    const memberIds = v.ids("memberIds", { label: "Members" });
    v.done();

    const project = await createProject(user, { name: name!, description, status, dueDate, memberIds });
    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
