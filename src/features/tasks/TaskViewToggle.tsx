import Link from "next/link";
import { Icon } from "@/components/ui";
import styles from "@/app/(dashboard)/pages.module.css";

/** List / Board switch that keeps the current filters. */
export function TaskViewToggle({ current, query }: { current: "list" | "board"; query: string }) {
  const suffix = query ? `?${query}` : "";
  return (
    <nav className={styles.viewToggle} aria-label="Task view">
      <Link href={`/tasks${suffix}`} aria-current={current === "list" ? "page" : undefined}>
        <Icon name="list" size={15} /> List
      </Link>
      <Link href={`/tasks/board${suffix}`} aria-current={current === "board" ? "page" : undefined}>
        <Icon name="board" size={15} /> Board
      </Link>
    </nav>
  );
}
