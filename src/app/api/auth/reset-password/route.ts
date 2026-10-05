import { NextResponse } from "next/server";
import { handleApiError, readJson } from "@/lib/errors";
import { validator } from "@/lib/validation";
import { resetPassword } from "@/services/passwordResetService";

export async function POST(request: Request) {
  try {
    const v = validator(await readJson(request));
    const token = v.string("token", { required: true, max: 200, label: "Token" });
    const password = v.password("password");
    v.done();

    await resetPassword(token!, password!);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleApiError(e);
  }
}
