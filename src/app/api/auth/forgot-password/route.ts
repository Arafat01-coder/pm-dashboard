import { NextResponse } from "next/server";
import { isRateLimited, recordFailedAttempt } from "@/lib/auth/rateLimit";
import { handleApiError, readJson } from "@/lib/errors";
import { isDevMailer } from "@/lib/mailer";
import { validator } from "@/lib/validation";
import { requestPasswordReset } from "@/services/passwordResetService";

/**
 * Always answers the same way, so the form never reveals whether an email
 * has an account. In development (no email service yet) the link is also
 * returned so it can be shown on the page.
 */
export async function POST(request: Request) {
  try {
    const v = validator(await readJson(request));
    const email = v.email("email", { required: true, label: "Email" });
    v.done();

    const limitKey = `reset:${email}`;
    if (isRateLimited(limitKey)) {
      return NextResponse.json({ error: "Too many requests. Try again in 15 minutes." }, { status: 429 });
    }
    recordFailedAttempt(limitKey); // counts every request: max 5 per 15 minutes

    const link = await requestPasswordReset(email!);
    const showLink = isDevMailer && process.env.NODE_ENV !== "production";
    return NextResponse.json({ ok: true, devLink: showLink ? link : undefined });
  } catch (e) {
    return handleApiError(e);
  }
}
