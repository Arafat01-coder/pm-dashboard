import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { badRequest, handleApiError, readJson } from "@/lib/errors";
import { validator } from "@/lib/validation";
import { changeUserRole, setUserActive } from "@/services/userService";
import { ROLES, type PublicUser } from "@/types/auth";

type Context = { params: Promise<{ id: string }> };

/** Change a user's role and/or activate/deactivate them. */
export async function PATCH(request: Request, { params }: Context) {
  const { user, error } = await authorizeApi("user:manage_roles");
  if (error) return error;
  try {
    const body = await readJson(request);
    const v = validator(body);
    const role = v.oneOf("role", ROLES, { label: "Role" });
    if (body.isActive !== undefined && typeof body.isActive !== "boolean") v.errors.isActive = "Status is not valid";
    v.done();
    if (role === undefined && body.isActive === undefined) throw badRequest("Nothing to update");

    const id = (await params).id;
    let updated: PublicUser | undefined;
    if (role !== undefined) updated = await changeUserRole(user, id, role);
    if (typeof body.isActive === "boolean") updated = await setUserActive(user, id, body.isActive);
    return NextResponse.json({ user: updated });
  } catch (e) {
    return handleApiError(e);
  }
}
