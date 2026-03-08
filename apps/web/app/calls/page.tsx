import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/ui";
import { getCallsPageData } from "@/lib/live-data";

export default async function CallsPage() {
  const calls = await getCallsPageData();

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
          <article className="card">
            <Badge tone="positive">Live data</Badge>
            <h3>Outcome feed</h3>
            <p className="muted">
              This panel now reflects live call rows and saved AI summaries instead of seeded preview
              content.
            </p>
            <p>
              Once calls complete and `call_analysis` rows are written, the summaries and outcomes
              shown here will update from your production data.
            </p>
          </article>
        </SectionCard>
      </div>
    </AppShell>
  );
}
