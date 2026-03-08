import { AppShell } from "@/components/app-shell";
import { AppointmentCalendar } from "@/components/appointment-calendar";
import { Badge, SectionCard } from "@/components/ui";
import { getAppointmentsPageData } from "@/lib/live-data";

export default async function AppointmentsPage() {
  const appointments = await getAppointmentsPageData();

  return (
    <AppShell
      title="Appointments"
      description="Scheduled callbacks and booked appointments from the live workspace."
    >
      {appointments.length > 0 ? (
        <div className="grid-2">
          <SectionCard title="Calendar" meta="Month view of booked callbacks and appointments">
            <AppointmentCalendar appointments={appointments} />
          </SectionCard>
          <SectionCard title="Upcoming appointments" meta="Booked follow-ups and callbacks">
            <div className="list">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="list-row">
                  <div>
                    <strong>{appointment.lead}</strong>
                    <p className="muted">{appointment.scheduledFor}</p>
                  </div>
                  <Badge tone={appointment.status === "completed" ? "positive" : "indigo"}>
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : (
        <SectionCard title="Calendar" meta="Month view of booked callbacks and appointments">
          <p className="muted">No appointments have been scheduled yet.</p>
        </SectionCard>
      )}
    </AppShell>
  );
}
