"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { NAV_ITEMS, SECONDARY_NAV_ITEMS, type NavItem } from "@/config/navigation";
import { useAuth } from "@/context/AuthContext";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { can } = useAuth();

  const renderItems = (items: NavItem[]) =>
    items
      .filter((item) => can(item.permission))
      .map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`${styles.link} ${isActive ? styles.active : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          </li>
        );
      });

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`} aria-label="Main navigation">
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">PM</span>
        <span className={styles.brandName}>ProjectHub</span>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close menu">
          <Icon name="close" />
        </button>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.list}>{renderItems(NAV_ITEMS)}</ul>
        <ul className={`${styles.list} ${styles.secondary}`}>{renderItems(SECONDARY_NAV_ITEMS)}</ul>
      </nav>
    </aside>
  );
}
