import { AppShell } from "@/components/app-shell";
import { Badge, SectionCard } from "@/components/ui";
import { demoLeads } from "@/lib/demo";

export default function LeadsPage() {
  return (
    <AppShell
      title="Leads"
      description="Lead table preview with campaign type, status, and a clear path to call or suppress DNC contacts."
    >
      <SectionCard title="Lead queue" meta="Imported and normalized prospects">
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
            {demoLeads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.name}</td>
                <td>{lead.phone}</td>
                <td>{lead.campaign}</td>
                <td>{lead.city}</td>
                <td>{lead.premium}</td>
                <td>
                  <Badge tone={lead.status === "dnc" ? "danger" : lead.status === "appointment_booked" ? "positive" : "indigo"}>
                    {lead.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </AppShell>
  );
}

