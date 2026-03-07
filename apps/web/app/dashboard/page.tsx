import { AppShell } from "@/components/app-shell";
import { SectionCard, StatCard, Badge } from "@/components/ui";
import { demoCalls, demoCampaigns, demoStats } from "@/lib/demo";

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      description="A deployable visual preview of the CRM shell, campaign health, and recent AI-assisted calling activity."
    >
      <div className="grid-4">
        <StatCard label="Total leads" value={demoStats.totalLeads} delta="+12% this week" />
        <StatCard label="Calls today" value={demoStats.callsToday} delta="+8 since 2 PM" />
        <StatCard label="Appointments" value={demoStats.bookedToday} delta="+4 vs yesterday" />
        <StatCard label="Transfers" value={demoStats.transfersToday} delta="+2 live now" />
      </div>

      <div className="grid-2">
        <SectionCard title="Live operations" meta="Current system posture">
          <div className="card hero-strip" style={{ padding: 24 }}>
            <p className="eyebrow">Campaign pulse</p>
            <h2 style={{ marginTop: 0 }}>Outbound calling is paced and ready</h2>
            <p className="muted">
              Appointment Setter is leading volume today. Renewal Reminder is showing lower reach
              but higher transfer intent.
            </p>
            <div className="button-row">
              <span className="button button-primary">Run campaign</span>
              <span className="button">Preview call modal</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Recent outcomes" meta="Latest completed calls">
          <div className="list">
            {demoCalls.map((call) => (
              <div key={call.id} className="list-row">
                <div>
                  <strong>{call.lead}</strong>
                  <p className="muted">{call.summary}</p>
                </div>
                <div className="stack" style={{ alignItems: "end" }}>
                  <Badge tone={call.outcome === "appointment_booked" ? "positive" : "indigo"}>
                    {call.outcome}
                  </Badge>
                  <span className="muted">{call.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Campaign snapshot" meta="Two-voice operating model">
        <div className="grid-2">
          {demoCampaigns.map((campaign) => (
            <article key={campaign.id} className="card">
              <p className="eyebrow">{campaign.assistant}</p>
              <h3 style={{ marginTop: 0 }}>{campaign.name}</h3>
              <p className="kpi">{campaign.queued}</p>
              <p className="muted">Leads queued</p>
              <Badge tone="indigo">{campaign.successRate} conversion rate</Badge>
            </article>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}

