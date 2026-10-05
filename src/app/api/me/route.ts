import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { handleApiError, readJson } from "@/lib/errors";
import { validator } from "@/lib/validation";
import { updateOwnProfile } from "@/services/userService";

/** Update the signed-in user's own profile (name, job title). */
export async function PATCH(request: Request) {
  const { user, error } = await authorizeApi();
  if (error) return error;
  try {
    const v = validator(await readJson(request));
    const name = v.string("name", { max: 80, label: "Name" });
    const title = v.string("title", { max: 80, label: "Job title" });
    if (name === "") v.errors.name = "Name is required";
    v.done();
    return NextResponse.json({ user: await updateOwnProfile(user.id, { name, title }) });
  } catch (e) {
    return handleApiError(e);
  }
}
