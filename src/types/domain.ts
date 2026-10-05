export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string | null; // ISO date (YYYY-MM-DD)
  owner: UserSummary;
  memberCount: number;
  taskCount: number;
  doneCount: number;
  progress: number; // 0-100, from done / total tasks
}

export interface ProjectDetail extends ProjectListItem {
  members: UserSummary[];
  createdAt: string;
}

export interface TaskListItem {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: UserSummary | null;
  dueDate: string | null; // ISO date (YYYY-MM-DD)
  commentCount: number;
}

export interface TaskDetail extends TaskListItem {
  description: string;
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  id: string;
  body: string;
  author: UserSummary;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  summary: string;
  actor: UserSummary;
  projectId: string | null;
  projectName: string | null;
  createdAt: string;
}

export interface InvitationItem {
  id: string;
  email: string;
  role: string;
  invitedBy: UserSummary;
  expiresAt: string;
  createdAt: string;
}
