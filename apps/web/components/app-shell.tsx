import Link from "next/link";
import type { ReactNode } from "react";

import { getAppShellData } from "@/lib/live-data";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/calls", label: "Calls" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/appointments", label: "Appointments" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings/sip", label: "SIP Settings" },
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
            <h2 className="sidebar-title">Insurance Control</h2>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer promo-card">
          <p className="eyebrow">Agency</p>
          <strong>{shell.agencyName}</strong>
          <p className="muted" style={{ marginBottom: 16 }}>
            Voice campaigns, lead routing, and review workflows in one workspace.
          </p>
          <button className="button button-primary" type="button">
            Open workspace
          </button>
        </div>
      </aside>

      <section className="content">
        <div className="topbar card">
          <div className="search-shell">
            <span className="search-icon">⌕</span>
            <span className="muted">Search leads, calls, campaigns</span>
            <span className="search-shortcut">⌘ F</span>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" type="button">
              ✉
            </button>
            <button className="icon-button" type="button">
              🔔
            </button>
            <div className="profile-pill">
              <div className="profile-avatar">{shell.userInitials}</div>
              <div>
                <strong>{shell.userName}</strong>
                <p className="muted profile-email">{shell.userEmail}</p>
              </div>
            </div>
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
