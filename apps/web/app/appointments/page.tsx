import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/ui";
import { demoAppointments } from "@/lib/demo";

export default function AppointmentsPage() {
  return (
    <AppShell
      title="Appointments"
      description="Calendar-view placeholder with a compact weekly appointment board for the first deploy preview."
    >
      <SectionCard title="Upcoming appointments" meta="Calendar integration can replace this board later">
        <div className="grid-2">
          {demoAppointments.map((appointment) => (
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
      </SectionCard>
    </AppShell>
  );
}

