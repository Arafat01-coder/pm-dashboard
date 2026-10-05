/** Date helpers shared by services. Dates without a time are stored at 00:00 UTC. */

export function toIsoDate(date: Date | null | undefined): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

/** Today's date as YYYY-MM-DD (UTC), for "overdue" comparisons. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
