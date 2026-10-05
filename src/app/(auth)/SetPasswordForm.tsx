"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { passwordProblem } from "@/lib/passwordRules";
import type { PublicUser } from "@/types/auth";
import styles from "./login/login.module.css";

interface SetPasswordFormProps {
  mode: "reset" | "invite";
  token: string;
  /** Invite only: shown read-only so the person knows which account this is. */
  email?: string;
}

/** Shared by "reset password" and "accept invitation": choose a password (and a name for invites). */
export function SetPasswordForm({ mode, token, email }: SetPasswordFormProps) {
  const router = useRouter();
  const { setSignedInUser } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};
    if (mode === "invite" && !name.trim()) errors.name = "Name is required";
    const problem = passwordProblem(password);
    if (problem) errors.password = problem;
    else if (password !== confirm) errors.confirm = "Passwords do not match";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    const result = await apiFetch<{ user?: PublicUser }>(
      mode === "invite" ? "/api/auth/accept-invite" : "/api/auth/reset-password",
      { method: "POST", body: mode === "invite" ? { token, name, password } : { token, password } },
    );
    if (!result.ok) {
      setSubmitting(false);
      setFormError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }
    if (mode === "invite" && result.data.user) {
      setSignedInUser(result.data.user);
      router.replace("/dashboard");
    } else {
      router.replace("/login?reset=1");
    }
    router.refresh();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className={styles.alert} role="alert">
          {formError}
        </div>
      )}
      {mode === "invite" && (
        <>
          <Input label="Email" value={email ?? ""} disabled />
          <Input
            label="Your name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            maxLength={80}
            autoFocus
          />
        </>
      )}
      <Input
        label={mode === "invite" ? "Password" : "New password"}
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        hint="At least 8 characters, with a letter and a number."
        autoFocus={mode === "reset"}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={fieldErrors.confirm}
      />
      <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
        {mode === "invite" ? "Create account" : "Set new password"}
      </Button>
    </form>
  );
}
