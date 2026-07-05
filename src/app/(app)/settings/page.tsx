import SettingsPanel from "@/components/settings/SettingsPanel";
import NavigationContentReady from "@/components/NavigationContentReady";
import { isProfilesTableReady, isSuperAdmin } from "@/lib/auth";
import { AuthGate, getAppAuthGate } from "@/lib/pageHelpers";
import { createClient } from "@/utils/supabase/server";

async function isDisplayNameColumnReady(): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").select("display_name").limit(1);
  if (!error) {
    return true;
  }
  return !error.message.toLowerCase().includes("display_name");
}

export default async function SettingsPage() {
  const [gate, profilesReady, displayNameReady] = await Promise.all([
    getAppAuthGate(),
    isProfilesTableReady(),
    isDisplayNameColumnReady(),
  ]);

  if (gate.state === "pin_required") {
    return <AuthGate gateState={gate}>{null}</AuthGate>;
  }

  const { profile } = gate;

  return (
    <>
      <NavigationContentReady />
      <SettingsPanel
        profile={profile}
        hasPin={Boolean(profile.appPinHash)}
        isSuperAdmin={isSuperAdmin(profile)}
        profilesReady={profilesReady}
        displayNameReady={displayNameReady}
      />
    </>
  );
}
