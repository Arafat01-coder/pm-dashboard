"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, Icon, Spinner } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS } from "@/lib/permissions";
import styles from "./UserMenu.module.css";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setOpen] = useState(false);
  const [isLoggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <Avatar name={user.name} />
        <span className={styles.identity}>
          <span className={styles.name}>{user.name}</span>
          <span className={styles.role}>{ROLE_LABELS[user.role]}</span>
        </span>
        <Icon name="chevronDown" size={16} />
      </button>

      {isOpen && (
        <div className={styles.menu} role="menu">
          <div className={styles.menuHeader}>
            <p className={styles.name}>{user.name}</p>
            <p className={styles.email}>{user.email}</p>
          </div>
          <Link href="/settings" className={styles.item} role="menuitem" onClick={() => setOpen(false)}>
            <Icon name="settings" size={16} />
            Settings
          </Link>
          <button
            className={`${styles.item} ${styles.danger}`}
            role="menuitem"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? <Spinner size={16} /> : <Icon name="logout" size={16} />}
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
