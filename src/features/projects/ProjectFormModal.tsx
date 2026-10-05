"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Select, Textarea, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { PROJECT_STATUS, toOptions } from "@/lib/format";
import type { ProjectDetail, ProjectStatus, UserSummary } from "@/types/domain";
import styles from "../forms.module.css";

interface ProjectFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Pass a project to edit it; leave empty to create a new one. */
  project?: ProjectDetail;
  /** Everyone who can be added as a member. */
  users: UserSummary[];
  /** The owner is always a member and cannot be unchecked. */
  ownerId: string;
}

export function ProjectFormModal({ open, onClose, project, users, ownerId }: ProjectFormModalProps) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!project;

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "planning");
  const [dueDate, setDueDate] = useState(project?.dueDate ?? "");
  const [memberIds, setMemberIds] = useState<string[]>(project?.members.map((m) => m.id) ?? [ownerId]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  const toggleMember = (id: string) =>
    setMemberIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFieldErrors({ name: "Name is required" });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    const result = await apiFetch<{ project: ProjectDetail }>(
      isEdit ? `/api/projects/${project.id}` : "/api/projects",
      {
        method: isEdit ? "PATCH" : "POST",
        body: { name, description, status, dueDate: dueDate || null, memberIds },
      },
    );
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }
    toast.success(isEdit ? "Project updated" : "Project created");
    onClose();
    if (isEdit) router.refresh();
    else router.push(`/projects/${result.data.project.id}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit project" : "New project"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" isLoading={isSaving}>
            {isEdit ? "Save changes" : "Create project"}
          </Button>
        </>
      }
    >
      <form id="project-form" className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className={styles.alert} role="alert">
            {formError}
          </div>
        )}
        <Input
          label="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          maxLength={120}
          autoFocus
          required
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={fieldErrors.description}
          maxLength={2000}
          rows={3}
        />
        <div className={styles.row}>
          <Select
            label="Status"
            options={toOptions(PROJECT_STATUS)}
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            error={fieldErrors.status}
          />
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            error={fieldErrors.dueDate}
          />
        </div>
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Members ({memberIds.length})</legend>
          <div className={styles.checkList}>
            {users.map((u) => (
              <label key={u.id} className={styles.check}>
                <input
                  type="checkbox"
                  checked={memberIds.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                  disabled={u.id === ownerId}
                />
                {u.name}
                {u.id === ownerId && <span className={styles.hint}>(owner)</span>}
              </label>
            ))}
          </div>
          <p className={styles.hint}>Only members (and admins) can see this project and be assigned its tasks.</p>
        </fieldset>
      </form>
    </Modal>
  );
}
