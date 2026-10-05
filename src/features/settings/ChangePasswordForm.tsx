"use client";

import { useState } from "react";
import { Button, Input, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { passwordProblem } from "@/lib/passwordRules";
import styles from "../forms.module.css";

export function ChangePasswordForm() {
  const toast = useToast();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = "Current password is required";
    const problem = passwordProblem(newPassword);
    if (problem) errors.newPassword = problem;
    else if (newPassword !== confirm) errors.confirm = "Passwords do not match";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    const result = await apiFetch("/api/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
    setSaving(false);
    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      return;
    }
    setCurrent("");
    setNew("");
    setConfirm("");
    toast.success("Password changed. Other devices have been signed out.");
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrent(e.target.value)}
        error={fieldErrors.currentPassword}
      />
      <div className={styles.row}>
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNew(e.target.value)}
          error={fieldErrors.newPassword}
          hint="At least 8 characters, with a letter and a number."
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={fieldErrors.confirm}
        />
      </div>
      <div>
        <Button type="submit" isLoading={isSaving}>
          Change password
        </Button>
      </div>
    </form>
  );
}
