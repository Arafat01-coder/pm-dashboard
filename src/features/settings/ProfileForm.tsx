"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, useToast } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import styles from "../forms.module.css";

export function ProfileForm() {
  const router = useRouter();
  const toast = useToast();
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [title, setTitle] = useState(user?.title ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFieldErrors({ name: "Name is required" });
      return;
    }
    setSaving(true);
    const result = await apiFetch("/api/me", { method: "PATCH", body: { name, title } });
    setSaving(false);
    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      return;
    }
    setFieldErrors({});
    toast.success("Profile saved");
    await refresh(); // update the name in the top bar
    router.refresh();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={fieldErrors.name} maxLength={80} />
        <Input
          label="Job title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fieldErrors.title}
          maxLength={80}
        />
      </div>
      <Input label="Email" value={user?.email ?? ""} disabled hint="Ask an admin to change your email." />
      <div>
        <Button type="submit" isLoading={isSaving}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
