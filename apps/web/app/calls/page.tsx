import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/ui";
import { getCallsPageData } from "@/lib/live-data";

export default async function CallsPage() {
  const calls = await getCallsPageData();
  const bookedCalls = calls.filter((call) => call.outcome === "appointment_booked").length;
  const voicemailCalls = calls.filter((call) => call.status === "voicemail").length;
  const transferredCalls = calls.filter((call) => call.outcome === "transferred").length;

  return (
    <AppShell
      title="Calls"
      description="Recent call history and AI analysis derived from your live Supabase records."
    >
      <div className="grid-2">
        <SectionCard title="Call history" meta="Latest voice sessions">
          <div className="list">
            {calls.length > 0 ? (
              calls.map((call) => (
                <div key={call.id} className="list-row">
                  <div>
                    <strong>{call.lead}</strong>
                    <p className="muted">{call.summary}</p>
                  </div>
                  <div className="stack" style={{ alignItems: "end" }}>
                    <Badge
                      tone={
                        call.status === "voicemail"
                          ? "warning"
                          : call.outcome === "appointment_booked"
                            ? "positive"
                            : "indigo"
                      }
                    >
                      {call.outcome}
                    </Badge>
                    <span className="muted">{call.duration}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No calls have been logged yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Analysis summary" meta="What the latest calls are signaling">
          <div className="grid-3">
            <article className="summary-card">
              <p className="eyebrow">Booked</p>
              <p className="kpi">{bookedCalls}</p>
              <Badge tone="positive">appointments</Badge>
            </article>
            <article className="summary-card">
              <p className="eyebrow">Transferred</p>
              <p className="kpi">{transferredCalls}</p>
              <Badge tone="indigo">warm handoffs</Badge>
            </article>
            <article className="summary-card">
              <p className="eyebrow">Voicemail</p>
              <p className="kpi">{voicemailCalls}</p>
              <Badge tone="warning">follow-up needed</Badge>
            </article>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
