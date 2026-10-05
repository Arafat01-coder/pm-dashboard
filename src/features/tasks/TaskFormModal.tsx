"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Modal, Select, Textarea, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { TASK_PRIORITY, TASK_STATUS, toOptions } from "@/lib/format";
import type { ProjectOption } from "@/services/projectService";
import type { TaskDetail, TaskPriority, TaskStatus } from "@/types/domain";
import styles from "../forms.module.css";

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Pass a task to edit it; leave empty to create one. */
  task?: TaskDetail;
  /** Projects the task can belong to, with their members (assignee choices). */
  projects: ProjectOption[];
  /** Pre-select (and lock) the project, e.g. on a project page. */
  projectId?: string;
  /** Pre-select a status, e.g. from a Kanban column. */
  defaultStatus?: TaskStatus;
}

export function TaskFormModal({ open, onClose, task, projects, projectId, defaultStatus }: TaskFormModalProps) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!task;

  const [selectedProject, setSelectedProject] = useState(task?.projectId ?? projectId ?? projects[0]?.id ?? "");
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [assigneeId, setAssigneeId] = useState(task?.assignee?.id ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);

  const members = projects.find((p) => p.id === selectedProject)?.members ?? [];
  // Keep the current assignee selectable even if they left the project.
  const assigneeOptions = [
    ...members.map((m) => ({ value: m.id, label: m.name })),
    ...(task?.assignee && !members.some((m) => m.id === task.assignee!.id)
      ? [{ value: task.assignee.id, label: `${task.assignee.name} (not a member)` }]
      : []),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Title is required";
    if (!selectedProject) errors.projectId = "Choose a project";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setSaving(true);
    const body = {
      title,
      description,
      status,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      ...(isEdit ? {} : { projectId: selectedProject }),
    };
    const result = await apiFetch<{ task: TaskDetail }>(isEdit ? `/api/tasks/${task.id}` : "/api/tasks", {
      method: isEdit ? "PATCH" : "POST",
      body,
    });
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }
    toast.success(isEdit ? "Task updated" : "Task created");
    onClose();
    router.refresh();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit task" : "New task"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" isLoading={isSaving}>
            {isEdit ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <form id="task-form" className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className={styles.alert} role="alert">
            {formError}
          </div>
        )}
        {projects.length === 0 && !isEdit ? (
          <p>You are not a member of any open project yet. Ask a project manager to add you.</p>
        ) : (
          <>
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={fieldErrors.title}
              maxLength={200}
              autoFocus
              required
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={fieldErrors.description}
              maxLength={5000}
              rows={4}
            />
            <div className={styles.row}>
              <Select
                label="Project"
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setAssigneeId("");
                }}
                error={fieldErrors.projectId}
                disabled={isEdit || !!projectId}
              />
              <Select
                label="Assignee"
                options={assigneeOptions}
                placeholder="Unassigned"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                error={fieldErrors.assigneeId}
              />
            </div>
            <div className={styles.row}>
              <Select
                label="Status"
                options={toOptions(TASK_STATUS)}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              />
              <Select
                label="Priority"
                options={toOptions(TASK_PRIORITY)}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              />
            </div>
            <Input
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              error={fieldErrors.dueDate}
            />
          </>
        )}
      </form>
    </Modal>
  );
}
