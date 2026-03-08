import { AppShell } from "@/components/app-shell";
import { SectionCard, StatCard } from "@/components/ui";
import { getAnalyticsData } from "@/lib/live-data";

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsData();

  return (
    <AppShell
      title="Analytics"
      description="Live KPI view generated from current lead, call, and analysis records."
    >
      <div className="grid-4">
        <StatCard label="Booking rate" value={analytics.bookingRate} delta="Recorded outcomes" />
        <StatCard label="Transfer rate" value={analytics.transferRate} delta="Recorded outcomes" />
        <StatCard label="Avg call duration" value={analytics.avgDuration} delta="Completed calls" />
        <StatCard label="DNC rate" value={analytics.dncRate} delta="Lead base" />
      </div>

      <div className="grid-2">
        <SectionCard title="Performance note" meta="Current read on the agency workspace">
          <p className="muted">
            Booking, transfer, duration, and DNC metrics are calculated from your live lead, call,
            and analysis records. As the team imports leads and runs campaigns, these KPI blocks
            update automatically without any seeded filler data.
          </p>
        </SectionCard>
        <SectionCard title="Operational readout" meta="How to interpret the KPI set">
          <p className="muted">
            A healthy workspace should show booking and transfer rates rising while DNC stays low.
            If average duration climbs without conversions, tighten the campaign targeting or revise
            the voice prompt flow before scaling volume.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
