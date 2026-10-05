"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { TASK_STATUS, toOptions } from "@/lib/format";
import type { TaskStatus } from "@/types/domain";

/** Inline status dropdown, for anyone allowed to update task status. */
export function TaskStatusSelect({ taskId, status }: { taskId: string; status: TaskStatus }) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(status);
  const [isSaving, setSaving] = useState(false);

  const handleChange = async (next: TaskStatus) => {
    const previous = value;
    setValue(next); // optimistic
    setSaving(true);
    const result = await apiFetch(`/api/tasks/${taskId}`, { method: "PATCH", body: { status: next } });
    setSaving(false);
    if (!result.ok) {
      setValue(previous);
      toast.error(result.error);
      return;
    }
    toast.success(`Moved to ${TASK_STATUS[next].label}`);
    router.refresh();
  };

  return (
    <Select
      aria-label="Task status"
      options={toOptions(TASK_STATUS)}
      value={value}
      onChange={(e) => handleChange(e.target.value as TaskStatus)}
      disabled={isSaving}
      style={{ height: 32, minWidth: 130 }}
    />
  );
}
