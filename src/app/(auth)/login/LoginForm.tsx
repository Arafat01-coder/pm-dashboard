"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import styles from "./login.module.css";

export interface DemoAccount {
  email: string;
  password: string;
  label: string;
}

interface LoginFormProps {
  nextPath: string;
  demoAccounts: DemoAccount[];
  /** A success message to show above the form, e.g. after a password reset. */
  notice?: string;
}

type FieldErrors = { email?: string; password?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "Enter a valid email address";
  if (!password) errors.password = "Password is required";
  return errors;
}

export function LoginForm({ nextPath, demoAccounts, notice }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    const result = await login(email.trim(), password);
    if (result.ok) {
      router.replace(nextPath);
      router.refresh();
      return; // keep the loading state while navigating
    }
    setFormError(result.error);
    setSubmitting(false);
  };

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {notice && !formError && (
          <div className={styles.notice} role="status">
            {notice}
          </div>
        )}
        {formError && (
          <div className={styles.alert} role="alert">
            {formError}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          disabled={isSubmitting}
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          disabled={isSubmitting}
        />
        <Link href="/forgot-password" className={styles.forgot}>
          Forgot password?
        </Link>
        <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {demoAccounts.length > 0 && (
        <div className={styles.demo}>
          <p className={styles.demoTitle}>Demo accounts (dev only), click to fill:</p>
          <div className={styles.demoList}>
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className={styles.demoButton}
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.password);
                  setFieldErrors({});
                  setFormError(null);
                }}
                disabled={isSubmitting}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
