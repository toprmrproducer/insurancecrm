import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard, StatCard } from "@/components/ui";
import { demoCampaigns } from "@/lib/demo";

export default function CampaignsPage() {
  return (
    <AppShell
      title="Campaigns"
      description="Bulk-run campaign preview showing concurrency controls, queue counts, and live progress surfaces."
    >
      <div className="grid-2">
        {demoCampaigns.map((campaign) => (
          <SectionCard
            key={campaign.id}
            title={campaign.name}
            meta={`Voice assistant: ${campaign.assistant}`}
          >
            <div className="grid-3">
              <StatCard label="Queued" value={campaign.queued} delta="Ready to dial" />
              <StatCard label="Connected" value="47" delta="Today" />
              <StatCard label="Success rate" value={campaign.successRate} delta="Rolling 7d" />
            </div>
            <div className="button-row" style={{ marginTop: 16 }}>
              <span className="button button-primary">Run campaign</span>
              <span className="button">Pause campaign</span>
              <Badge tone="indigo">Max concurrency: 3</Badge>
            </div>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}

