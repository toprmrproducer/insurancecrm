import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard, StatCard } from "@/components/ui";
import { getCampaignPageData } from "@/lib/live-data";

export default async function CampaignsPage() {
  const campaigns = await getCampaignPageData();

  return (
    <AppShell
      title="Campaigns"
      description="Queue depth, connection volume, and live conversion posture by campaign."
    >
      <div className="grid-2">
        {campaigns.map((campaign) => (
          <SectionCard key={campaign.id} title={campaign.name} meta={`Voice assistant: ${campaign.assistant}`}>
            <div className="grid-3">
              <StatCard label="Queued" value={campaign.queued} delta="Ready to dial" />
              <StatCard label="Connected" value={campaign.connected} delta="Live workspace" />
              <StatCard label="Success rate" value={campaign.successRate} delta="Current base" />
            </div>
            <div className="button-row" style={{ marginTop: 16 }}>
              <span className="button button-primary">Run campaign</span>
              <span className="button">Pause campaign</span>
              <Badge tone="indigo">Assistant: {campaign.assistant}</Badge>
            </div>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}
