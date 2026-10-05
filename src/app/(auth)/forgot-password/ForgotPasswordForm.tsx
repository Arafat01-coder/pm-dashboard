"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import styles from "../login/login.module.css";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    const result = await apiFetch<{ devLink?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: { email: email.trim() },
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
    setDevLink(result.data.devLink ?? null);
  };

  if (sent) {
    return (
      <div className={styles.form}>
        <div className={styles.notice} role="status">
          If an account exists for {email.trim()}, a reset link is on its way. It expires in 60 minutes.
        </div>
        {devLink && (
          <div className={styles.devLink}>
            <strong>Dev mode:</strong> email isn&apos;t set up yet, so here is the link (it is also printed in the
            server terminal): <a href={devLink}>{devLink}</a>
          </div>
        )}
        <p className={styles.footerLink}>
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isSubmitting}
        autoFocus
      />
      <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
        Send reset link
      </Button>
      <p className={styles.footerLink}>
        Remembered it? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
