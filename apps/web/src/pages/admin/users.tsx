import { PageHeader } from "@/components/page-header";
import { useCurrentUser } from "@/features/auth";

/**
 * Admin Users page — manage all users (assign roles, deactivate).
 *
 * Owner: Lead (Admin)
 *
 * TODO:
 *   - Gate by user.role === "admin"
 *   - User table: email, name, role (assignable dropdown), status, last login, actions
 *   - Search + filter by role
 *   - Bulk role assignment
 *   - Deactivate / reactivate action (soft delete)
 */
export function AdminUsersPage() {
  const { data } = useCurrentUser();
  const isAdmin = data?.user?.role === "admin";

  if (!isAdmin) {
    return (
      <main className="container py-16">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">
          Only admins can view this page.
        </p>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <PageHeader
        title="User management"
        description="View, assign roles, and deactivate user accounts."
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: user table with role dropdown + search + bulk actions
      </div>
    </main>
  );
}
