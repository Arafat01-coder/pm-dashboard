"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import type { UserSummary } from "@/types/domain";
import { ProjectFormModal } from "./ProjectFormModal";

export function NewProjectButton({ users, currentUserId }: { users: UserSummary[]; currentUserId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button leftIcon={<Icon name="plus" size={16} />} onClick={() => setOpen(true)}>
        New project
      </Button>
      {open && <ProjectFormModal open onClose={() => setOpen(false)} users={users} ownerId={currentUserId} />}
    </>
  );
}
