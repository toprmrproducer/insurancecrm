import { AppShell } from "@/components/app-shell";
import { SipSettingsPanel } from "@/components/sip-settings-panel";
import { SectionCard } from "@/components/ui";
import { hasLivekitEnv, hasSupabaseAuthEnv } from "@/lib/env";

export default function SipSettingsPage() {
  const liveEnabled = hasSupabaseAuthEnv() && hasLivekitEnv();

  return (
    <AppShell
      title="SIP Settings"
      description="Configure Vobiz SIP credentials here. Saving this form provisions matching LiveKit trunks for the agency."
    >
      <SectionCard
        title="Vobiz + LiveKit Configuration"
        meta="Paste the credentials from Vobiz and the backend will create the LiveKit trunks."
      >
        <SipSettingsPanel liveEnabled={liveEnabled} />
      </SectionCard>
    </AppShell>
  );
}
