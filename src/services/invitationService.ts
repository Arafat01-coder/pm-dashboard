import { db } from "@/lib/db";
import { badRequest, conflict, forbidden, notFound } from "@/lib/errors";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/mailer";
import { ROLE_LABELS, assignableRoles, can } from "@/lib/permissions";
import { appUrl, generateToken, hashToken } from "@/lib/tokens";
import type { PublicUser, Role } from "@/types/auth";
import type { InvitationItem } from "@/types/domain";
import type { User } from "@/generated/prisma/client";
import { logActivity } from "./activityService";

/** Invite-only sign-up: an admin invites an email, the person sets a password. */

const INVITE_TTL_DAYS = 7;

export async function createInvitation(
  actor: PublicUser,
  input: { email: string; role: Role },
): Promise<{ invitation: InvitationItem; link: string }> {
  if (!can(actor, "user:invite")) throw forbidden();
  if (!assignableRoles(actor).includes(input.role)) throw forbidden("You can't invite someone with that role");

  const email = input.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) {
    throw conflict("Someone with this email already has an account");
  }

  // A new invite replaces any pending one for the same email.
  await db.invitation.updateMany({
    where: { email, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const { token, tokenHash } = generateToken();
  const invitation = await db.invitation.create({
    data: {
      email,
      role: input.role,
      tokenHash,
      invitedById: actor.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
    include: { invitedBy: { select: { id: true, name: true, email: true } } },
  });

  const link = appUrl(`/invite/${token}`);
  await sendEmail({
    to: email,
    subject: `${actor.name} invited you to ProjectHub`,
    text: `${actor.name} invited you to join ProjectHub as ${ROLE_LABELS[input.role]}.\n\nSet up your account here (link expires in ${INVITE_TTL_DAYS} days):\n${link}`,
  });
  await logActivity({
    actorId: actor.id,
    action: "user.invited",
    summary: `invited ${email} as ${ROLE_LABELS[input.role]}`,
    entityType: "invitation",
    entityId: invitation.id,
  });

  return { invitation: toItem(invitation), link };
}

function toItem(i: {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: { id: string; name: string; email: string };
}): InvitationItem {
  return {
    id: i.id,
    email: i.email,
    role: i.role,
    invitedBy: i.invitedBy,
    expiresAt: i.expiresAt.toISOString(),
    createdAt: i.createdAt.toISOString(),
  };
}

export async function listPendingInvitations(actor: PublicUser): Promise<InvitationItem[]> {
  if (!can(actor, "user:invite")) return [];
  const rows = await db.invitation.findMany({
    where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { invitedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toItem);
}

export async function revokeInvitation(actor: PublicUser, id: string): Promise<void> {
  if (!can(actor, "user:invite")) throw forbidden();
  const result = await db.invitation.updateMany({
    where: { id, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) throw notFound("Invitation not found");
}

/** Looks up a usable invitation by the raw token from the link. */
export async function findValidInvitation(token: string) {
  const invitation = await db.invitation.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt < new Date()) {
    return null;
  }
  return invitation;
}

export async function acceptInvitation(
  token: string,
  input: { name: string; password: string },
): Promise<User> {
  const invitation = await findValidInvitation(token);
  if (!invitation) throw badRequest("This invite link is invalid or has expired. Ask an admin for a new one.");
  if (await db.user.findUnique({ where: { email: invitation.email } })) {
    throw conflict("An account with this email already exists. Sign in instead.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name: input.name, email: invitation.email, role: invitation.role, passwordHash },
    });
    await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    return created;
  });

  await logActivity({
    actorId: user.id,
    action: "user.joined",
    summary: `joined as ${ROLE_LABELS[invitation.role as Role] ?? invitation.role}`,
    entityType: "user",
    entityId: user.id,
  });
  return user;
}
