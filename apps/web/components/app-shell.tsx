import Link from "next/link";
import type { ReactNode } from "react";

import { getAppShellData } from "@/lib/live-data";
import { SidebarNav } from "@/components/sidebar-nav";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/orders", label: "Orders" },
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
          <img className="brand-logo" src="/rajcrm-logo.svg" alt="Raj's CRM logo" />
          <div>
            <p className="eyebrow">Raj&apos;s CRM</p>
            <h2 className="sidebar-title">Insurance Control</h2>
            <p className="muted sidebar-copy">Lead intake, campaign dialing, and outcomes in one workspace.</p>
          </div>
        </div>

        <p className="nav-section-label">Navigation</p>
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
          <div className="topbar-search-wrap">
            <span className="topbar-search-icon">⌕</span>
            <input
              className="topbar-search-input"
              value=""
              placeholder="Search leads, calls, and campaigns"
              readOnly
              aria-label="Search"
            />
            <span className="topbar-shortcut">⌘ F</span>
          </div>

          <div className="topbar-actions">
            <Link className="icon-link" href="/settings/agent" aria-label="Agent settings">
              ⚙
            </Link>
            <Link className="icon-link" href="/calls" aria-label="Calls">
              ☎
            </Link>
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
