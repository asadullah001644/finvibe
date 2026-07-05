import SettingsPanel from "@/components/settings/SettingsPanel";
import NavigationContentReady from "@/components/NavigationContentReady";
import { isProfilesTableReady, isSuperAdmin } from "@/lib/auth";
import { AuthGate, getAppAuthGate } from "@/lib/pageHelpers";

export default async function SettingsPage() {
  const [gate, profilesReady] = await Promise.all([
    getAppAuthGate(),
    isProfilesTableReady(),
  ]);

  if (gate.state === "pin_required") {
    return <AuthGate gateState={gate}>{null}</AuthGate>;
  }

  const { profile } = gate;

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
