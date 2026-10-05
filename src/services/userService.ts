import { DEMO_PASSWORD, seedUsers } from "@/lib/data/mock-db";
import { hashPassword } from "@/lib/auth/password";
import type { PublicUser, UserRecord } from "@/types/auth";

/**
 * User data access. Swap the body of these functions for real
 * database queries later; callers do not need to change.
 */

let usersPromise: Promise<UserRecord[]> | null = null;

// Hash the demo password once, on first use, so no plain passwords are compared.
function getUsers(): Promise<UserRecord[]> {
  usersPromise ??= hashPassword(DEMO_PASSWORD).then((passwordHash) =>
    seedUsers.map((u) => ({ ...u, passwordHash })),
  );
  return usersPromise;
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  const users = await getUsers();
  return users.find((u) => u.email === normalized) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function listUsers(): Promise<PublicUser[]> {
  const users = await getUsers();
  return users.map(toPublicUser);
}
