"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog, Select, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/permissions";
import type { PublicUser, Role } from "@/types/auth";
import styles from "./UserRowActions.module.css";

interface UserRowActionsProps {
  user: PublicUser;
  /** Roles the current admin may assign. */
  roles: Role[];
}

/** Role dropdown + deactivate/reactivate, shown to user managers. */
export function UserRowActions({ user, roles }: UserRowActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [role, setRole] = useState(user.role);
  const [isSaving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const patch = async (body: { role?: Role; isActive?: boolean }, success: string) => {
    setSaving(true);
    const result = await apiFetch(`/api/users/${user.id}`, { method: "PATCH", body });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    toast.success(success);
    router.refresh();
    return true;
  };

  const options = roles.includes(user.role) ? roles : [user.role, ...roles];

  return (
    <div className={styles.actions}>
      <Select
        aria-label={`Role for ${user.name}`}
        options={options.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
        value={role}
        disabled={isSaving || !roles.includes(user.role)}
        onChange={async (e) => {
          const next = e.target.value as Role;
          const previous = role;
          setRole(next);
          const ok = await patch({ role: next }, `${user.name} is now ${ROLE_LABELS[next]}`);
          if (!ok) setRole(previous);
        }}
        className={styles.select}
      />
      {user.isActive ? (
        <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} disabled={isSaving}>
          Deactivate
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => patch({ isActive: true }, `${user.name} reactivated`)}
          isLoading={isSaving}
        >
          Reactivate
        </Button>
      )}
      <ConfirmDialog
        open={confirming}
        title={`Deactivate ${user.name}?`}
        message="They will be signed out right away and won't be able to log in. Their tasks and comments stay. You can reactivate them later."
        confirmLabel="Deactivate"
        isLoading={isSaving}
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          if (await patch({ isActive: false }, `${user.name} deactivated`)) setConfirming(false);
        }}
      />
    </div>
  );
}
