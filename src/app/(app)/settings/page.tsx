import SettingsPanel from "@/components/settings/SettingsPanel";
import NavigationContentReady from "@/components/NavigationContentReady";
import { isProfilesTableReady, requireAuth, isSuperAdmin } from "@/lib/auth";

export default async function SettingsPage() {
  const [{ profile }, profilesReady] = await Promise.all([
    requireAuth(),
    isProfilesTableReady(),
  ]);

  return (
    <>
      <NavigationContentReady />
      <SettingsPanel
        hasPin={Boolean(profile.appPinHash)}
        isSuperAdmin={isSuperAdmin(profile)}
        profilesReady={profilesReady}
      />
    </>
  );
}
