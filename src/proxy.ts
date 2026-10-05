import { NextResponse, type NextRequest } from "next/server";
import { can } from "@/lib/permissions";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import type { Permission } from "@/types/auth";

/**
 * First line of defence: runs before every page request.
 * - Signed-out users are sent to /login (with ?next= to return afterwards).
 * - Signed-in users visiting /login are sent to /dashboard.
 * - Routes listed in ROUTE_PERMISSIONS are blocked early for the wrong roles.
 * Pages and API routes still check permissions themselves (lib/auth/server.ts).
 */

/** Signed-out pages; signed-in users are sent to the dashboard instead. */
const PUBLIC_ROUTES = ["/login", "/forgot-password"];
/** Pages that work whether or not someone is signed in (links from emails). */
const OPEN_ROUTES = ["/invite", "/reset-password"];

const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: "/team", permission: "user:view" },
  { prefix: "/reports", permission: "report:view" },
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const matches = (r: string) => pathname === r || pathname.startsWith(`${r}/`);
  if (OPEN_ROUTES.some(matches)) return NextResponse.next();

  const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_ROUTES.some(matches);

  if (isPublic) {
    return session
      ? NextResponse.redirect(new URL("/dashboard", request.url))
      : NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
    const response = NextResponse.redirect(loginUrl);
    // Clear an expired or tampered cookie.
    if (request.cookies.has(SESSION_COOKIE)) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const rule = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix));
  if (rule && !can(session, rule.permission)) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on pages only: skip API routes (they return 401/403 JSON themselves),
  // Next.js internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)"],
};
