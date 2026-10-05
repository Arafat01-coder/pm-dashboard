import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { handleApiError, readJson } from "@/lib/errors";
import { isDevMailer } from "@/lib/mailer";
import { validator } from "@/lib/validation";
import { createInvitation, listPendingInvitations } from "@/services/invitationService";
import { ROLES } from "@/types/auth";

export async function GET() {
  const { user, error } = await authorizeApi("user:invite");
  if (error) return error;
  return NextResponse.json({ invitations: await listPendingInvitations(user) });
}

export async function POST(request: Request) {
  const { user, error } = await authorizeApi("user:invite");
  if (error) return error;
  try {
    const v = validator(await readJson(request));
    const email = v.email("email", { required: true, label: "Email" });
    const role = v.oneOf("role", ROLES, { required: true, label: "Role" });
    v.done();

    const { invitation, link } = await createInvitation(user, { email: email!, role: role! });
    // Without an email service, the admin needs the link to send it themselves.
    return NextResponse.json({ invitation, link: isDevMailer ? link : undefined }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
