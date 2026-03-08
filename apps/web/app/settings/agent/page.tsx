import { AgentConfigPanel } from "@/components/agent-config-panel";
import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/ui";

export default function AgentSettingsPage() {
  return (
    <AppShell
      title="Agent Settings"
      description="Control the Gemini model, voice, opening line, and prompt used by each voice campaign."
    >
      <SectionCard
        title="Live voice agent configuration"
        meta="These settings are used by the worker when it launches Mia or Ava for a call."
      >
        <AgentConfigPanel />
      </SectionCard>
    </AppShell>
  );
}
