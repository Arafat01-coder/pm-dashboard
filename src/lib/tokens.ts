import { createHash, randomBytes } from "node:crypto";

/**
 * One-time tokens for invite and password-reset links. Only the SHA-256
 * hash is stored, so a leaked database cannot be used to open the links.
 */

export function generateToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function appUrl(path: string): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path}`;
}
