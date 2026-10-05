import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { can } from "@/lib/permissions";
import { findUserById, toPublicUser } from "@/services/userService";
import type { Permission, PublicUser } from "@/types/auth";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/**
 * Server-side auth helpers for pages, layouts and API routes.
 * The token is re-checked against the user store on every request, so a
 * deactivated user or a changed role takes effect immediately.
 */

export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  const user = await findUserById(session.sub);
  if (!user || !user.isActive) return null;
  return toPublicUser(user);
}

/** For pages/layouts: redirect to /login if not signed in. */
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages: redirect to /forbidden if the user lacks the permission. */
export async function requirePermission(permission: Permission): Promise<PublicUser> {
  const user = await requireUser();
  if (!can(user, permission)) redirect("/forbidden");
  return user;
}

type ApiAuthResult =
  | { user: PublicUser; error?: never }
  | { user?: never; error: NextResponse };

/** For API routes: returns the user, or a 401/403 response to return as-is. */
export async function authorizeApi(permission?: Permission): Promise<ApiAuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (permission && !can(user, permission)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user };
}
