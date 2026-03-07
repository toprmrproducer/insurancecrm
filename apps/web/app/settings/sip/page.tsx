import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/ui";

export default function SipSettingsPage() {
  return (
    <AppShell
      title="SIP Settings"
      description="Admin-only SIP line management preview with clear configuration states."
    >
      <SectionCard title="Configured lines" meta="LiveKit trunk ids will populate here in production">
        <div className="list">
          <div className="list-row">
            <div>
              <strong>Main Line</strong>
              <p className="muted">5f3a607b.sip.vobiz.ai</p>
            </div>
            <Badge tone="positive">active</Badge>
          </div>
          <div className="list-row">
            <div>
              <strong>Renewal Line</strong>
              <p className="muted">renewals.sip.vobiz.ai</p>
            </div>
            <Badge tone="warning">pending auth</Badge>
          </div>
        </div>
        <div className="button-row" style={{ marginTop: 16 }}>
          <span className="button button-primary">Add SIP line</span>
          <span className="button">Test outbound trunk</span>
        </div>
      </SectionCard>
    </AppShell>
  );
}

