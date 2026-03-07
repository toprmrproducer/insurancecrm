import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/ui";
import { demoCalls } from "@/lib/demo";

export default function CallsPage() {
  return (
    <AppShell
      title="Calls"
      description="Call history preview with AI outcome summaries and transcript-ready layout zones."
    >
      <div className="grid-2">
        <SectionCard title="Call history" meta="Latest voice sessions">
          <div className="list">
            {demoCalls.map((call) => (
              <div key={call.id} className="list-row">
                <div>
                  <strong>{call.lead}</strong>
                  <p className="muted">{call.summary}</p>
                </div>
                <div className="stack" style={{ alignItems: "end" }}>
                  <Badge tone={call.status === "voicemail" ? "warning" : "positive"}>
                    {call.status}
                  </Badge>
                  <span className="muted">{call.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="AI analysis card" meta="Expandable row target">
          <article className="card">
            <Badge tone="positive">Positive sentiment</Badge>
            <h3>Appointment booked</h3>
            <p className="muted">
              Recommended action: licensed agent callback at the confirmed time window.
            </p>
            <p>
              Summary: Lead verified personal details, confirmed interest, and accepted a specific
              appointment slot for tomorrow morning.
            </p>
            <div className="button-row">
              <span className="button">Play recording</span>
              <span className="button">View full transcript</span>
            </div>
          </article>
        </SectionCard>
      </div>
    </AppShell>
  );
}

