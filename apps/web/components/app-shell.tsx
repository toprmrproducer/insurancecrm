import Link from "next/link";
import type { ReactNode } from "react";

import { getAppShellData } from "@/lib/live-data";
import { SidebarNav } from "@/components/sidebar-nav";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/calls", label: "Calls" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/appointments", label: "Appointments" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings/sip", label: "SIP Settings" },
  { href: "/settings/agent", label: "Agent Settings" },
  { href: "/settings/profile", label: "Profile" },
];

export async function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const shell = await getAppShellData();

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">R</div>
          <div>
            <p className="eyebrow">Raj&apos;s CRM</p>
            <h2 className="sidebar-title">Insurance CRM</h2>
            <p className="muted sidebar-copy">Calling, lead routing, and follow-up operations.</p>
          </div>
        </div>

        <SidebarNav items={navItems} />

        <div className="sidebar-footer promo-card">
          <p className="eyebrow">Agency</p>
          <strong>{shell.agencyName}</strong>
          <p className="muted" style={{ marginBottom: 16 }}>
            Voice campaigns, lead routing, and review workflows in one workspace.
          </p>
          <Link className="button button-primary" href="/settings/profile">
            View profile
          </Link>
        </div>
      </aside>

      <section className="content">
        <div className="topbar card">
          <div className="workspace-summary">
            <p className="eyebrow">Workspace</p>
            <strong>{shell.agencyName}</strong>
            <p className="muted workspace-copy">
              Connected CRM workspace for live leads, call activity, and SIP operations.
            </p>
          </div>

          <div className="topbar-actions">
            <div className="profile-pill">
              <div className="profile-avatar">{shell.userInitials}</div>
              <div>
                <strong>{shell.userName}</strong>
                <p className="muted profile-email">{shell.userEmail}</p>
              </div>
            </div>
            <Link className="button button-outline" href="/settings/sip">
              SIP settings
            </Link>
            <form action="/api/auth/logout" method="post">
              <button className="button" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>

        <header className="page-header">
          <div>
            <p className="eyebrow">Operations</p>
            <h1>{title}</h1>
          </div>
          <p className="muted">{description}</p>
        </header>
        {children}
      </section>
    </main>
  );
}
