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
            This view is now powered by live counts from your Supabase tables. As calls complete and
            analyses are stored, the KPI blocks above will change automatically.
          </p>
        </SectionCard>
        <SectionCard title="Next step" meta="What to wire after the data layer">
          <p className="muted">
            Replace this section with line, bar, and pie charts once you want a richer analytics
            layer. The fake placeholder panels have been removed.
          </p>
        </SectionCard>
      </div>
    </AppShell>
  );
}
