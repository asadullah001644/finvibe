import AdminDashboard from "@/components/admin/AdminDashboard";
import { getAdminPageDataAction } from "@/actions/adminActions";

export default async function AdminPage() {
  const { users, schemaReady, schemaMessage } = await getAdminPageDataAction();

  return (
    <AdminDashboard
      initialUsers={users}
      schemaReady={schemaReady}
      schemaMessage={schemaMessage}
    />
  );
}
