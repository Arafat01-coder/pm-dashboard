"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, Icon, Select, Spinner, type SelectOption } from "@/components/ui";
import styles from "./FilterBar.module.css";

export interface FilterDef {
  /** URL query key, e.g. "status". */
  key: string;
  label: string;
  placeholder: string;
  options: SelectOption[];
}

interface FilterBarProps {
  searchPlaceholder: string;
  filters: FilterDef[];
}

/**
 * Search box + dropdown filters stored in the URL (?q=&status=...), so the
 * server page re-renders with filtered data and the view can be bookmarked.
 */
export function FilterBar({ searchPlaceholder, filters }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  // Search as you type, after a short pause.
  useEffect(() => {
    if (query === (params.get("q") ?? "")) return;
    const timer = setTimeout(() => update("q", query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]); // only re-run when the typed text changes

  const hasFilters = !!params.get("q") || filters.some((f) => params.get(f.key));

  return (
    <div className={styles.bar} role="search">
      <div className={styles.search}>
        <Icon name="search" size={16} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className={styles.searchInput}
        />
        {isPending && <Spinner size={14} />}
      </div>
      {filters.map((f) => (
        <Select
          key={f.key}
          aria-label={f.label}
          options={f.options}
          placeholder={f.placeholder}
          value={params.get(f.key) ?? ""}
          onChange={(e) => update(f.key, e.target.value)}
          className={styles.select}
        />
      ))}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery("");
            startTransition(() => router.replace(pathname, { scroll: false }));
          }}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
