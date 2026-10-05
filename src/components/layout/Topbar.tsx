"use client";

import { Icon } from "@/components/ui";
import { UserMenu } from "./UserMenu";
import styles from "./Topbar.module.css";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className={styles.topbar}>
      <button className={styles.menuButton} onClick={onMenuClick} aria-label="Open menu">
        <Icon name="menu" size={20} />
      </button>
      <div className={styles.spacer} />
      <UserMenu />
    </header>
  );
}
