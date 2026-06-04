import { useCurrentUser } from "@/features/auth";

export function DashboardPage() {
  const { data, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <main className="container py-16">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  return (
    <main className="container py-16">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{data?.user?.email}</span>
      </p>
      <p className="mt-6 max-w-prose text-sm text-muted-foreground">
        This is a placeholder protected page used to verify the auth flow. Real dashboard
        widgets (trend charts, recent papers, saved searches) land in Phase C.
      </p>
    </main>
  );
}
