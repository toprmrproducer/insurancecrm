import { AppShell } from "@/components/app-shell";
import { LeadOpsPanel } from "@/components/lead-ops-panel";
import { SectionCard } from "@/components/ui";
import { getLeadsPageData, getSipConfigOptions } from "@/lib/live-data";

export default async function LeadsPage() {
  const leads = await getLeadsPageData();
  const sipOptions = await getSipConfigOptions();

  return (
    <AppShell
      title="Leads"
      description="Lead queue, campaign assignment, and suppression status for your actual agency data."
    >
      <SectionCard title="Lead queue" meta="Imported and normalized prospects">
        <LeadOpsPanel leads={leads} sipOptions={sipOptions} />
      </SectionCard>
    </AppShell>
  );
}
