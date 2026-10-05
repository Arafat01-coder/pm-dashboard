import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { handleApiError, readJson } from "@/lib/errors";
import { validator } from "@/lib/validation";
import { addComment, listComments } from "@/services/taskService";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { user, error } = await authorizeApi("task:view");
  if (error) return error;
  try {
    return NextResponse.json({ comments: await listComments(user, (await params).id) });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(request: Request, { params }: Context) {
  const { user, error } = await authorizeApi("task:comment");
  if (error) return error;
  try {
    const v = validator(await readJson(request));
    const body = v.string("body", { required: true, max: 5000, label: "Comment" });
    v.done();
    const comment = await addComment(user, (await params).id, body!);
    return NextResponse.json({ comment }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
