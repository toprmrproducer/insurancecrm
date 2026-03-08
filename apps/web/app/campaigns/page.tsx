import { AppShell } from "@/components/app-shell";
import { CampaignRunnerPanel } from "@/components/campaign-runner-panel";
import { getCampaignPageData, getSipConfigOptions } from "@/lib/live-data";

export default async function CampaignsPage() {
  const campaigns = await getCampaignPageData();
  const sipOptions = await getSipConfigOptions();

  return (
    <AppShell
      title="Campaigns"
      description="Queue depth, connection volume, and live conversion posture by campaign."
    >
      <CampaignRunnerPanel campaigns={campaigns} sipOptions={sipOptions} />
    </AppShell>
  );
}
