import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth/server";
import { handleApiError } from "@/lib/errors";
import { revokeInvitation } from "@/services/invitationService";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Context) {
  const { user, error } = await authorizeApi("user:invite");
  if (error) return error;
  try {
    await revokeInvitation(user, (await params).id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
