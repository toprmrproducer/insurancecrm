import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/ui";
import { getLeadsPageData } from "@/lib/live-data";

export default async function LeadsPage() {
  const leads = await getLeadsPageData();

  return (
    <AppShell
      title="Leads"
      description="Lead queue, campaign assignment, and suppression status for your actual agency data."
    >
      <SectionCard title="Lead queue" meta="Imported and normalized prospects">
        {leads.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Campaign</th>
                <th>Location</th>
                <th>Premium</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.campaign}</td>
                  <td>{lead.location}</td>
                  <td>{lead.premium}</td>
                  <td>
                    <Badge
                      tone={
                        lead.status === "dnc"
                          ? "danger"
                          : lead.status === "appointment_booked"
                            ? "positive"
                            : "indigo"
                      }
                    >
                      {lead.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No leads yet. Import a CSV to populate the queue.</p>
        )}
      </SectionCard>
    </AppShell>
  );
}
