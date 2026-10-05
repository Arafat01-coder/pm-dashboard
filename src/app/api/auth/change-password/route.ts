import { NextResponse } from "next/server";
import { attachSession, authorizeApi } from "@/lib/auth/server";
import { handleApiError, readJson } from "@/lib/errors";
import { validator } from "@/lib/validation";
import { changeOwnPassword, toPublicUser } from "@/services/userService";

/** Changes the signed-in user's password and signs out their other sessions. */
export async function POST(request: Request) {
  const { user, error } = await authorizeApi();
  if (error) return error;
  try {
    const v = validator(await readJson(request));
    const currentPassword = v.string("currentPassword", { required: true, max: 128, label: "Current password" });
    const newPassword = v.password("newPassword", { label: "New password" });
    v.done();

    const updated = await changeOwnPassword(user.id, currentPassword!, newPassword!);
    // Re-issue this browser's cookie with the new session version so it stays signed in.
    return attachSession(NextResponse.json({ ok: true }), {
      id: updated.id,
      role: toPublicUser(updated).role,
      sessionVersion: updated.sessionVersion,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
