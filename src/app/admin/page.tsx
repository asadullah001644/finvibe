import AdminDashboard from "@/components/admin/AdminDashboard";
import NavigationContentReady from "@/components/NavigationContentReady";
import { getAdminPageDataAction } from "@/actions/adminActions";
import { AuthGate, getAppAuthGate } from "@/lib/pageHelpers";

export default async function AdminPage() {
  const gate = await getAppAuthGate();

  if (gate.state === "pin_required") {
    return <AuthGate gateState={gate}>{null}</AuthGate>;
  }

  const { users, schemaReady, schemaMessage } = await getAdminPageDataAction();

  return (
    <>
      <NavigationContentReady />
      <AdminDashboard
        initialUsers={users}
        schemaReady={schemaReady}
        schemaMessage={schemaMessage}
      />
    </>
  );
}
