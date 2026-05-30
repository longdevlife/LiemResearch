import { PageHeader } from "@/components/page-header";
import { useCurrentUser } from "@/features/auth";

/**
 * Profile page — view + edit user info.
 *
 * Owner:        Dev 2 (Personalization)
 *
 * TODO:
 *   - Avatar upload section
 *   - Form: fullName, email (readonly), institution, research interests (chips)
 *   - Save button → PATCH /api/v1/users/me (backend endpoint TBD)
 *   - Security section: change password
 *   - Danger zone: delete account
 */
export function ProfilePage() {
  const { data } = useCurrentUser();

  return (
    <main className="container max-w-3xl py-8">
      <PageHeader
        title="Profile"
        description={data?.user?.email ?? "Manage your account information."}
      />
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        TODO: avatar + form (name, institution, interests) + security + danger zone
      </div>
    </main>
  );
}
