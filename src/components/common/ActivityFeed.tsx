import Link from "next/link";
import { Avatar, EmptyState } from "@/components/ui";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { ActivityItem } from "@/types/domain";
import styles from "./ActivityFeed.module.css";

/** Server-rendered list of recent activity ("Sam moved Login page to Done"). */
export function ActivityFeed({ items, showProject = true }: { items: ActivityItem[]; showProject?: boolean }) {
  if (items.length === 0) {
    return <EmptyState title="No activity yet" description="Changes to projects and tasks will appear here." />;
  }
  const now = new Date();
  return (
    <ul className={styles.feed}>
      {items.map((a) => (
        <li key={a.id} className={styles.item}>
          <Avatar name={a.actor.name} size={28} />
          <div className={styles.text}>
            <p>
              <strong>{a.actor.name}</strong> {a.summary}
            </p>
            <p className={styles.meta}>
              <time dateTime={a.createdAt} title={formatDateTime(a.createdAt)}>
                {formatRelative(a.createdAt, now)}
              </time>
              {showProject && a.projectId && a.projectName && (
                <>
                  {" · "}
                  <Link href={`/projects/${a.projectId}`} className={styles.link}>
                    {a.projectName}
                  </Link>
                </>
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
