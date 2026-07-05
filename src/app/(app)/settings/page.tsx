import SettingsPanel from "@/components/settings/SettingsPanel";
import { isProfilesTableReady, requireAuth, isSuperAdmin } from "@/lib/auth";

export default async function SettingsPage() {
  const { profile } = await requireAuth();
  const profilesReady = await isProfilesTableReady();

  return (
    <SettingsPanel
      hasPin={Boolean(profile.appPinHash)}
      isSuperAdmin={isSuperAdmin(profile)}
      profilesReady={profilesReady}
    />
  );
}
