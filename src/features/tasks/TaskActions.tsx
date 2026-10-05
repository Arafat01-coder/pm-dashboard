"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog, Icon, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import type { ProjectOption } from "@/services/projectService";
import type { TaskDetail } from "@/types/domain";
import { TaskFormModal } from "./TaskFormModal";

interface TaskActionsProps {
  task: TaskDetail;
  projects: ProjectOption[];
  canEdit: boolean;
  canDelete: boolean;
}

export function TaskActions({ task, projects, canEdit, canDelete }: TaskActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setConfirming(false);
    toast.success("Task deleted");
    router.push(`/projects/${task.projectId}`);
    router.refresh();
  };

  return (
    <>
      {canEdit && (
        <Button variant="secondary" leftIcon={<Icon name="edit" size={16} />} onClick={() => setEditing(true)}>
          Edit
        </Button>
      )}
      {canDelete && (
        <Button variant="secondary" leftIcon={<Icon name="trash" size={16} />} onClick={() => setConfirming(true)}>
          Delete
        </Button>
      )}
      {editing && <TaskFormModal open onClose={() => setEditing(false)} task={task} projects={projects} />}
      <ConfirmDialog
        open={confirming}
        title="Delete task?"
        message={
          <>
            <strong>{task.title}</strong> and its comments will be deleted permanently.
          </>
        }
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
