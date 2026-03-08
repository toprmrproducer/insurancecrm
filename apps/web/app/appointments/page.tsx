import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/ui";
import { getAppointmentsPageData } from "@/lib/live-data";

export default async function AppointmentsPage() {
  const appointments = await getAppointmentsPageData();

  return (
    <AppShell
      title="Appointments"
      description="Scheduled callbacks and booked appointments from the live workspace."
    >
      <SectionCard title="Upcoming appointments" meta="Booked follow-ups and callbacks">
        {appointments.length > 0 ? (
          <div className="grid-2">
            {appointments.map((appointment) => (
              <article key={appointment.id} className="card">
                <p className="eyebrow">{appointment.scheduledFor}</p>
                <h3 style={{ marginTop: 0 }}>{appointment.lead}</h3>
                <Badge tone="positive">{appointment.status}</Badge>
                <div className="button-row" style={{ marginTop: 16 }}>
                  <span className="button">Mark complete</span>
                  <span className="button">Reschedule</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No appointments have been scheduled yet.</p>
        )}
      </SectionCard>
    </AppShell>
  );
}
