import AdminDashboard from "@/components/admin/AdminDashboard";
import { getAdminPageDataAction } from "@/actions/adminActions";
import { requireSuperAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireSuperAdmin();
  const { users, schemaReady, schemaMessage } = await getAdminPageDataAction();

  return (
    <AdminDashboard
      initialUsers={users}
      schemaReady={schemaReady}
      schemaMessage={schemaMessage}
    />
  );
}
