import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 16,
        textAlign: "center",
      }}
    >
      <h1>Page not found</h1>
      <p style={{ color: "var(--color-text-muted)" }}>The page you are looking for does not exist.</p>
      <LinkButton href="/dashboard" variant="secondary">
        Go to dashboard
      </LinkButton>
    </main>
  );
}
