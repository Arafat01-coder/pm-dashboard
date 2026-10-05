import { db } from "@/lib/db";
import { badRequest } from "@/lib/errors";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/mailer";
import { appUrl, generateToken, hashToken } from "@/lib/tokens";
import type { User } from "@/generated/prisma/client";

/** Forgot / reset password with one-time links that expire after an hour. */

const RESET_TTL_MINUTES = 60;

/**
 * Sends a reset link if the email belongs to an active account. Returns the
 * link (for the dev-mode helper on the page) or null. Callers must respond
 * the same way either way, so the form never reveals which emails exist.
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.isActive) return null;

  // Only the newest link works.
  await db.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const { token, tokenHash } = generateToken();
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000),
    },
  });

  const link = appUrl(`/reset-password/${token}`);
  await sendEmail({
    to: user.email,
    subject: "Reset your ProjectHub password",
    text: `Someone asked to reset the password for ${user.email}.\n\nSet a new password here (link expires in ${RESET_TTL_MINUTES} minutes):\n${link}\n\nIf this wasn't you, you can ignore this email.`,
  });
  return link;
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  return !!row && !row.usedAt && row.expiresAt > new Date();
}

/** Sets the new password, burns the link and signs out every other session. */
export async function resetPassword(token: string, newPassword: string): Promise<User> {
  const row = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!row || row.usedAt || row.expiresAt < new Date() || !row.user.isActive) {
    throw badRequest("This reset link is invalid or has expired. Request a new one.");
  }

  const passwordHash = await hashPassword(newPassword);
  const [user] = await db.$transaction([
    db.user.update({
      where: { id: row.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    }),
    db.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return user;
}
