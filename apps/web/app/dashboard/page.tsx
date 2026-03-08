import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard, StatCard } from "@/components/ui";
import { getDashboardData } from "@/lib/live-data";
import Link from "next/link";

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <AppShell
      title="Dashboard"
      description="Monitor lead volume, campaign momentum, and agent follow-up performance from a clean operating dashboard."
    >
      <div className="dashboard-actions">
        <Link className="button button-primary button-pill" href="/campaigns">
          + Launch Campaign
        </Link>
        <Link className="button button-outline button-pill" href="/leads">
          Import Leads
        </Link>
      </div>

      <div className="grid-4">
        <StatCard
          label="Total leads"
          value={dashboard.stats.totalLeads}
          delta={`${dashboard.summary.activeCampaigns} active campaigns`}
          tone="highlight"
        />
        <StatCard
          label="Calls today"
          value={dashboard.stats.callsToday}
          delta={`${dashboard.summary.avgDuration} avg duration`}
        />
        <StatCard
          label="Appointments"
          value={dashboard.stats.appointments}
          delta={`${dashboard.summary.bookingRate} booking rate`}
        />
        <StatCard
          label="Transfers"
          value={dashboard.stats.transfers}
          delta={`${dashboard.summary.liveSipLines} live SIP lines`}
        />
      </div>

      <div className="dashboard-grid">
        <SectionCard title="Campaign analytics" meta="Weekly lead engagement rhythm">
          <div className="analytics-bars">
            <div className="bar hatch" />
            <div className="bar solid soft" />
            <div className="bar solid medium">
              <span className="bar-label">{dashboard.summary.bookingRate}</span>
            </div>
            <div className="bar solid dark" />
            <div className="bar hatch tall" />
            <div className="bar hatch short" />
            <div className="bar hatch medium" />
          </div>
          <div className="analytics-days muted">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
          </div>
        </SectionCard>

        <SectionCard title="Reminders" meta="Next priority block">
          <div className="reminder-card">
            <h3>Live queue posture</h3>
            <p className="muted">Current operating status</p>
            <p className="reminder-copy">
              {dashboard.stats.callsToday > 0
                ? `The system has logged ${dashboard.stats.callsToday} calls today and ${dashboard.stats.appointments} scheduled appointments.`
                : "No live calls have been logged yet. Import leads, configure SIP, and launch the first campaign."}
            </p>
            <Link className="button button-primary button-pill" href="/campaigns">
              Open campaign runner
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Priority list" meta="Most recent outcomes">
          <div className="project-list">
            {dashboard.recentCalls.length > 0 ? (
              dashboard.recentCalls.slice(0, 5).map((call, index) => (
                <div key={call.id} className="project-row">
                  <div className={`project-dot project-dot-${(index % 5) + 1}`} />
                  <div>
                    <strong>{call.lead}</strong>
                    <p className="muted project-copy">{call.outcome}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No calls have been completed yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Progress" meta="Today&apos;s calling throughput">
          <div className="progress-panel">
            <div className="progress-arc">
              <div className="progress-inner">
                <strong>{dashboard.summary.bookingRate}</strong>
                <span className="muted">Booking rate</span>
              </div>
            </div>
            <div className="legend-row muted">
              <span><i className="legend-dot legend-green" /> Appointments</span>
              <span><i className="legend-dot legend-deep" /> Transfers</span>
              <span><i className="legend-dot legend-hatch" /> Open queue</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Live timer" meta="Current operating window">
          <div className="timer-card">
            <p className="eyebrow">Calling Window</p>
            <strong className="timer-value">{dashboard.summary.avgDuration}</strong>
            <div className="timer-metrics">
              <span className="timer-chip">Calls today</span>
              <span className="timer-chip timer-chip-soft">{dashboard.stats.callsToday}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid-2">
        <SectionCard title="Recent call outcomes" meta="Latest completed conversations">
          <div className="list">
            {dashboard.recentCalls.length > 0 ? (
              dashboard.recentCalls.map((call) => (
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
              ))
            ) : (
              <p className="muted">No completed calls yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Recent orders" meta="Adjust incoming policy orders quickly">
          <div className="list">
            {dashboard.recentOrders.length > 0 ? (
              dashboard.recentOrders.map((order) => (
                <div key={order.id} className="list-row">
                  <div>
                    <strong>{order.title}</strong>
                    <p className="muted">{order.customer}</p>
                  </div>
                  <div className="stack" style={{ alignItems: "end" }}>
                    <Badge tone={order.status === "completed" ? "positive" : "indigo"}>
                      {order.status}
                    </Badge>
                    <span className="muted">{order.amount}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No orders yet. Add one from the Orders page.</p>
            )}
          </div>
          <div className="button-row" style={{ marginTop: 12 }}>
            <Link className="button button-outline" href="/orders">
              Open orders board
            </Link>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
