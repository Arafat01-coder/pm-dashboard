"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, EmptyState, Textarea, useToast } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { CommentItem } from "@/types/domain";
import styles from "./CommentSection.module.css";

interface CommentSectionProps {
  taskId: string;
  initialComments: CommentItem[];
  canComment: boolean;
}

export function CommentSection({ taskId, initialComments, canComment }: CommentSectionProps) {
  const router = useRouter();
  const toast = useToast();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [isPosting, setPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    const result = await apiFetch<{ comment: CommentItem }>(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      body: { body },
    });
    setPosting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setComments((list) => [...list, result.data.comment]);
    setBody("");
    router.refresh(); // update comment counts and the activity log
  };

  return (
    <div>
      {comments.length === 0 ? (
        <EmptyState title="No comments yet" description={canComment ? "Start the discussion below." : undefined} />
      ) : (
        <ul className={styles.list}>
          {comments.map((c) => (
            <li key={c.id} className={styles.comment}>
              <Avatar name={c.author.name} size={30} />
              <div className={styles.content}>
                <p className={styles.meta}>
                  <strong>{c.author.name}</strong>{" "}
                  <time dateTime={c.createdAt}>{formatDateTime(c.createdAt)}</time>
                </p>
                <p className={styles.body}>{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canComment && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <Textarea
            label="Add a comment"
            hideLabel
            placeholder="Write a comment..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={5000}
            rows={3}
            disabled={isPosting}
          />
          <div className={styles.actions}>
            <Button type="submit" isLoading={isPosting} disabled={!body.trim()}>
              Comment
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
