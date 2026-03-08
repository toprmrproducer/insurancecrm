import { AppShell } from "@/components/app-shell";
import { SectionCard, StatCard } from "@/components/ui";
import { getAnalyticsData } from "@/lib/live-data";

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsData();
  const maxCalls = Math.max(...analytics.callsByDay.map((day) => day.value), 1);
  const maxOutcomes = Math.max(...analytics.outcomes.map((outcome) => outcome.value), 1);

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
        <SectionCard title="Call volume" meta="Seven-day activity trend">
          <div className="trend-chart">
            {analytics.callsByDay.map((day) => (
              <div key={day.label} className="trend-column">
                <div
                  className="trend-fill"
                  style={{ height: `${Math.max((day.value / maxCalls) * 180, 12)}px` }}
                />
                <strong>{day.value}</strong>
                <span className="muted">{day.label}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Outcome mix" meta="Latest result distribution">
          <div className="outcome-stack">
            {analytics.outcomes.map((outcome) => (
              <div key={outcome.label} className="outcome-row">
                <div>
                  <strong>{outcome.label}</strong>
                  <p className="muted">{outcome.value} records</p>
                </div>
                <div className="outcome-meter">
                  <div
                    className="outcome-meter-fill"
                    style={{ width: `${Math.max((outcome.value / maxOutcomes) * 100, 8)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
