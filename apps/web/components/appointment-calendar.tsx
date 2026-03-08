import type { AppointmentRow } from "@/lib/live-data";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date) {
  const value = new Date(date);
  value.setDate(value.getDate() - value.getDay());
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfWeek(date: Date) {
  const value = startOfWeek(date);
  value.setDate(value.getDate() + 6);
  value.setHours(23, 59, 59, 999);
  return value;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function AppointmentCalendar({ appointments }: { appointments: AppointmentRow[] }) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const cells: Date[] = [];

  for (let cursor = new Date(calendarStart); cursor <= calendarEnd; cursor.setDate(cursor.getDate() + 1)) {
    cells.push(new Date(cursor));
  }

  return (
    <div className="calendar-shell">
      <div className="calendar-head">
        <div>
          <p className="eyebrow">Appointment calendar</p>
          <h2>{today.toLocaleString("en-US", { month: "long", year: "numeric" })}</h2>
        </div>
        <div className="legend-row muted">
          <span>
            <i className="legend-dot legend-green" /> Scheduled
          </span>
          <span>
            <i className="legend-dot legend-deep" /> Completed
          </span>
          <span>
            <i className="legend-dot legend-hatch" /> Other status
          </span>
        </div>
      </div>

      <div className="calendar-grid calendar-grid-labels">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
          <div key={label} className="calendar-label">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((cellDate) => {
          const dayAppointments = appointments.filter((appointment) =>
            sameDay(new Date(appointment.scheduledForIso), cellDate),
          );
          const inCurrentMonth = cellDate.getMonth() === today.getMonth();

          return (
            <article
              key={cellDate.toISOString()}
              className={`calendar-cell ${inCurrentMonth ? "" : "calendar-cell-muted"} ${
                sameDay(cellDate, today) ? "calendar-cell-today" : ""
              }`}
            >
              <div className="calendar-cell-head">
                <strong>{cellDate.getDate()}</strong>
                <span className="muted">{dayAppointments.length || ""}</span>
              </div>
              <div className="calendar-events">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`calendar-event calendar-event-${appointment.status.replace(/_/g, "-")}`}
                  >
                    <strong>{appointment.lead}</strong>
                    <span>{new Date(appointment.scheduledForIso).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}</span>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
