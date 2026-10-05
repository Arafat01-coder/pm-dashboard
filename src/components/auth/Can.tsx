"use client";

import { useAuth } from "@/context/AuthContext";
import type { Permission } from "@/types/auth";

interface CanProps {
  permission: Permission;
  /** Rendered when the user lacks the permission. Defaults to nothing. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shows children only if the current user has the permission.
 * Use inside client components. In server components call can(user, ...)
 * directly, so hidden content is never sent to the browser.
 * This is for UI only: the server must still check the permission.
 *
 *   <Can permission="project:create"><Button>New project</Button></Can>
 */
export function Can({ permission, fallback = null, children }: CanProps) {
  const { can } = useAuth();
  return <>{can(permission) ? children : fallback}</>;
}
