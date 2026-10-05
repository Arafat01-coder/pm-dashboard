"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import type { ProjectOption } from "@/services/projectService";
import { TaskFormModal } from "./TaskFormModal";

interface NewTaskButtonProps {
  projects: ProjectOption[];
  projectId?: string;
  variant?: "primary" | "secondary";
}

export function NewTaskButton({ projects, projectId, variant = "primary" }: NewTaskButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} leftIcon={<Icon name="plus" size={16} />} onClick={() => setOpen(true)}>
        New task
      </Button>
      {open && <TaskFormModal open onClose={() => setOpen(false)} projects={projects} projectId={projectId} />}
    </>
  );
}
