/**
 * Browser-side helper for calling our API routes. Never throws: returns
 * either the data or a readable error (plus per-field errors for forms).
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; status: number };

export async function apiFetch<T = unknown>(
  url: string,
  options: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown } = {},
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: options.method ?? "GET",
      headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: data as T };
    if (res.status === 401) {
      // Session expired: send the user to log in, then back here.
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    return {
      ok: false,
      status: res.status,
      error: data?.error ?? "Something went wrong. Please try again.",
      fieldErrors: data?.fieldErrors,
    };
  } catch {
    return { ok: false, status: 0, error: "Could not reach the server. Check your connection." };
  }
}
