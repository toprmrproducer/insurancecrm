import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/ui";

export default function ProfileSettingsPage() {
  return (
    <AppShell
      title="Profile"
      description="User and agency settings preview for the first visual deploy."
    >
      <div className="grid-2">
        <SectionCard title="User profile" meta="Signed-in agent information">
          <div className="list">
            <div className="list-row">
              <span className="muted">Name</span>
              <strong>Raj Patel</strong>
            </div>
            <div className="list-row">
              <span className="muted">Role</span>
              <strong>Admin</strong>
            </div>
            <div className="list-row">
              <span className="muted">Email</span>
              <strong>raj@agency.com</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Agency" meta="High-level tenant settings">
          <div className="list">
            <div className="list-row">
              <span className="muted">Agency name</span>
              <strong>Raj&apos;s Insurance</strong>
            </div>
            <div className="list-row">
              <span className="muted">Timezone</span>
              <strong>America/Chicago</strong>
            </div>
            <div className="list-row">
              <span className="muted">Calling window</span>
              <strong>9:00 AM to 8:00 PM</strong>
            </div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
