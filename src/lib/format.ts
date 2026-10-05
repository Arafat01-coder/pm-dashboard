import type { BadgeTone } from "@/components/ui/Badge";
import type { ProjectStatus, TaskPriority, TaskStatus } from "@/types/domain";

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  planning: { label: "Planning", tone: "info" },
  active: { label: "Active", tone: "primary" },
  on_hold: { label: "On hold", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
};

export const TASK_STATUS: Record<TaskStatus, { label: string; tone: BadgeTone }> = {
  todo: { label: "To do", tone: "neutral" },
  in_progress: { label: "In progress", tone: "primary" },
  review: { label: "In review", tone: "warning" },
  done: { label: "Done", tone: "success" },
};

export const TASK_PRIORITY: Record<TaskPriority, { label: string; tone: BadgeTone }> = {
  low: { label: "Low", tone: "neutral" },
  medium: { label: "Medium", tone: "info" },
  high: { label: "High", tone: "warning" },
  urgent: { label: "Urgent", tone: "danger" },
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
