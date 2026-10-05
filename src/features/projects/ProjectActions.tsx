"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ConfirmDialog, Icon, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import type { ProjectDetail, UserSummary } from "@/types/domain";
import { ProjectFormModal } from "./ProjectFormModal";

interface ProjectActionsProps {
  project: ProjectDetail;
  users: UserSummary[];
  canEdit: boolean;
  canDelete: boolean;
}

/** Edit / Delete buttons on the project details page. */
export function ProjectActions({ project, users, canEdit, canDelete }: ProjectActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await apiFetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setConfirming(false);
    toast.success(`Deleted ${project.name}`);
    router.push("/projects");
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
      {editing && (
        <ProjectFormModal
          open
          onClose={() => setEditing(false)}
          project={project}
          users={users}
          ownerId={project.owner.id}
        />
      )}
      <ConfirmDialog
        open={confirming}
        title="Delete project?"
        message={
          <>
            <strong>{project.name}</strong> and its {project.taskCount} task(s) will be deleted permanently. This
            cannot be undone.
          </>
        }
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
