"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Badge, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { TASK_PRIORITY, TASK_STATUS, formatDate, isOverdue } from "@/lib/format";
import { TASK_STATUSES, type TaskListItem, type TaskStatus } from "@/types/domain";
import styles from "./KanbanBoard.module.css";

interface KanbanBoardProps {
  tasks: TaskListItem[];
  /** False for roles that can only view (e.g. clients): no dragging. */
  canMove: boolean;
  today: string;
}

/**
 * Columns per status. Drag a card to another column to change its status
 * (mouse), or use the card's status menu (keyboard and touch).
 */
export function KanbanBoard({ tasks, canMove, today }: KanbanBoardProps) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState(tasks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  // Take fresh server data after router.refresh().
  useEffect(() => setItems(tasks), [tasks]);

  const move = async (taskId: string, status: TaskStatus) => {
    const task = items.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    const previous = items;
    setItems((list) => list.map((t) => (t.id === taskId ? { ...t, status } : t))); // optimistic
    const result = await apiFetch(`/api/tasks/${taskId}`, { method: "PATCH", body: { status } });
    if (!result.ok) {
      setItems(previous);
      toast.error(result.error);
      return;
    }
    toast.success(`Moved "${task.title}" to ${TASK_STATUS[status].label}`);
    router.refresh();
  };

  return (
    <div className={styles.board}>
      {TASK_STATUSES.map((status) => {
        const columnTasks = items.filter((t) => t.status === status);
        return (
          <section
            key={status}
            className={`${styles.column} ${overColumn === status ? styles.over : ""}`}
            aria-label={TASK_STATUS[status].label}
            onDragOver={(e) => {
              if (!canMove || !dragId) return;
              e.preventDefault();
              setOverColumn(status);
            }}
            onDragLeave={() => setOverColumn((c) => (c === status ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              setOverColumn(null);
              if (dragId) void move(dragId, status);
              setDragId(null);
            }}
          >
            <header className={styles.columnHeader}>
              <Badge tone={TASK_STATUS[status].tone}>{TASK_STATUS[status].label}</Badge>
              <span className={styles.count}>{columnTasks.length}</span>
            </header>
            <ul className={styles.cards}>
              {columnTasks.map((t) => {
                const overdue = isOverdue(t.dueDate, t.status === "done", today);
                return (
                  <li
                    key={t.id}
                    className={`${styles.card} ${dragId === t.id ? styles.dragging : ""}`}
                    draggable={canMove}
                    onDragStart={(e) => {
                      setDragId(t.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverColumn(null);
                    }}
                  >
                    <Link href={`/tasks/${t.id}`} className={styles.title}>
                      {t.title}
                    </Link>
                    <p className={styles.project}>{t.projectName}</p>
                    <div className={styles.meta}>
                      <Badge tone={TASK_PRIORITY[t.priority].tone}>{TASK_PRIORITY[t.priority].label}</Badge>
                      {t.dueDate && (
                        <span className={overdue ? styles.overdue : styles.due}>
                          {overdue ? "Overdue · " : ""}
                          {formatDate(t.dueDate)}
                        </span>
                      )}
                      {t.assignee && (
                        <span className={styles.assignee} title={t.assignee.name}>
                          <Avatar name={t.assignee.name} size={22} />
                        </span>
                      )}
                    </div>
                    {canMove && (
                      <select
                        className={styles.moveSelect}
                        aria-label={`Move ${t.title}`}
                        value={t.status}
                        onChange={(e) => void move(t.id, e.target.value as TaskStatus)}
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {TASK_STATUS[s].label}
                          </option>
                        ))}
                      </select>
                    )}
                  </li>
                );
              })}
              {columnTasks.length === 0 && <li className={styles.empty}>No tasks</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
