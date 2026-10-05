import { SignJWT, jwtVerify } from "jose";
import { ROLES, type SessionPayload } from "@/types/auth";

/**
 * Token helpers. This file must stay free of Node-only APIs because
 * it is also imported by proxy.ts.
 */

export const SESSION_COOKIE = "pm_session";

const DEFAULT_TTL_HOURS = 8;

export function getSessionTtlSeconds(): number {
  const hours = Number(process.env.SESSION_TTL_HOURS);
  return (Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_TTL_HOURS) * 60 * 60;
}

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short (min 32 chars). Copy .env.example to .env.local and set it.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, sv: payload.sv })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${getSessionTtlSeconds()}s`)
    .sign(getSecretKey());
}

/** Returns the payload if the token is valid and not expired, otherwise null. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    const role = payload.role as SessionPayload["role"];
    if (typeof payload.sub !== "string" || !ROLES.includes(role) || typeof payload.sv !== "number") {
      return null;
    }
    return { sub: payload.sub, role, sv: payload.sv };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: getSessionTtlSeconds(),
});
