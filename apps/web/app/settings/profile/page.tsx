import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/ui";
import { getProfilePageData } from "@/lib/live-data";

export default async function ProfileSettingsPage() {
  const profile = await getProfilePageData();

  return (
    <AppShell
      title="Profile"
      description="Signed-in user identity and agency details from the active workspace."
    >
      <div className="grid-2">
        <SectionCard title="User profile" meta="Signed-in agent information">
          <div className="list">
            <div className="list-row">
              <span className="muted">Name</span>
              <strong>{profile.profileName}</strong>
            </div>
            <div className="list-row">
              <span className="muted">Role</span>
              <strong>{profile.role}</strong>
            </div>
            <div className="list-row">
              <span className="muted">Email</span>
              <strong>{profile.email}</strong>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Agency" meta="High-level tenant settings">
          <div className="list">
            <div className="list-row">
              <span className="muted">Agency name</span>
              <strong>{profile.agencyName}</strong>
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
