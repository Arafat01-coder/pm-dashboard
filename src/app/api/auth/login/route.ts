import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearAttempts, isRateLimited, recordFailedAttempt } from "@/lib/auth/rateLimit";
import { attachSession } from "@/lib/auth/server";
import { findUserByEmail, toPublicUser } from "@/services/userService";

// Compared against when the email does not exist, so the response
// time does not reveal which emails are registered.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword("timing-safe-placeholder"));

const INVALID_CREDENTIALS = "Invalid email or password";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const limitKey = email.trim().toLowerCase();
  if (isRateLimited(limitKey)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const user = await findUserByEmail(email);
  const passwordOk = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));

  if (!user || !passwordOk) {
    recordFailedAttempt(limitKey);
    return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }
  if (!user.isActive) {
    return NextResponse.json({ error: "This account has been deactivated" }, { status: 403 });
  }

  clearAttempts(limitKey);
  return attachSession(NextResponse.json({ user: toPublicUser(user) }), {
    id: user.id,
    role: toPublicUser(user).role,
    sessionVersion: user.sessionVersion,
  });
}
