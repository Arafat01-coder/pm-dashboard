import { NextResponse } from "next/server";
import { attachSession } from "@/lib/auth/server";
import { handleApiError, readJson } from "@/lib/errors";
import { validator } from "@/lib/validation";
import { acceptInvitation } from "@/services/invitationService";
import { toPublicUser } from "@/services/userService";

/** Creates the invited user's account and signs them in. */
export async function POST(request: Request) {
  try {
    const v = validator(await readJson(request));
    const token = v.string("token", { required: true, max: 200, label: "Token" });
    const name = v.string("name", { required: true, max: 80, label: "Name" });
    const password = v.password("password");
    v.done();

    const user = await acceptInvitation(token!, { name: name!, password: password! });
    const publicUser = toPublicUser(user);
    return attachSession(NextResponse.json({ user: publicUser }), {
      id: user.id,
      role: publicUser.role,
      sessionVersion: user.sessionVersion,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
