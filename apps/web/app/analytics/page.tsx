import { AppShell } from "@/components/app-shell";
import { SectionCard, StatCard } from "@/components/ui";
import { demoAnalytics } from "@/lib/demo";

export default function AnalyticsPage() {
  return (
    <AppShell
      title="Analytics"
      description="Performance dashboard preview with KPI blocks standing in for the chart layer."
    >
      <div className="grid-4">
        <StatCard label="Booking rate" value={demoAnalytics.bookingRate} delta="Last 30 days" />
        <StatCard label="Transfer rate" value={demoAnalytics.transferRate} delta="Last 30 days" />
        <StatCard label="Avg call duration" value={demoAnalytics.avgDuration} delta="All campaigns" />
        <StatCard label="DNC rate" value={demoAnalytics.dncRate} delta="Needs monitoring" />
      </div>

      <div className="grid-2">
        <SectionCard title="Chart zone" meta="Replace with Recharts or Tremor">
          <div className="card hero-strip" style={{ minHeight: 320 }} />
        </SectionCard>
        <SectionCard title="Outcome mix" meta="Replace with pie/bar charts">
          <div className="card hero-strip" style={{ minHeight: 320 }} />
        </SectionCard>
      </div>
    </AppShell>
  );
}

