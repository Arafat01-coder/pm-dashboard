"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, Input, Modal, Select, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@/types/auth";
import styles from "../forms.module.css";

export function InviteMemberButton({ roles }: { roles: Role[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(roles.includes("member") ? "member" : roles[0]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSending, setSending] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setEmail("");
    setLink(null);
    setFormError(null);
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSending(true);
    const result = await apiFetch<{ link?: string }>("/api/invitations", { method: "POST", body: { email, role } });
    setSending(false);
    if (!result.ok) {
      setFormError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }
    setFieldErrors({});
    toast.success(`Invitation created for ${email}`);
    setLink(result.data.link ?? null);
    router.refresh();
    if (!result.data.link) close();
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  };

  return (
    <>
      <Button leftIcon={<Icon name="plus" size={16} />} onClick={() => setOpen(true)}>
        Invite member
      </Button>
      <Modal
        open={open}
        onClose={close}
        title="Invite a team member"
        description="They get a link to set their name and password. Links expire after 7 days."
        footer={
          link ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={close} disabled={isSending}>
                Cancel
              </Button>
              <Button type="submit" form="invite-form" isLoading={isSending}>
                Create invitation
              </Button>
            </>
          )
        }
      >
        {link ? (
          <div className={styles.form}>
            <p className={styles.success}>
              Invitation created. Email sending isn&apos;t set up yet, so send this link to {email} yourself:
            </p>
            <div className={styles.linkBox}>
              <input className={styles.linkInput} value={link} readOnly onFocus={(e) => e.target.select()} />
              <Button variant="secondary" leftIcon={<Icon name="copy" size={16} />} onClick={copy}>
                Copy
              </Button>
            </div>
          </div>
        ) : (
          <form id="invite-form" className={styles.form} onSubmit={handleSubmit} noValidate>
            {formError && (
              <div className={styles.alert} role="alert">
                {formError}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              autoFocus
              required
            />
            <Select
              label="Role"
              options={roles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              error={fieldErrors.role}
            />
          </form>
        )}
      </Modal>
    </>
  );
}
