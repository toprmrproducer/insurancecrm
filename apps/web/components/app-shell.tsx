import Link from "next/link";
import type { ReactNode } from "react";

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

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Raj&apos;s CRM</p>
          <h2 className="sidebar-title">Insurance control center</h2>
          <p className="muted">Live calling, lead operations, and analysis in one place.</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer card">
          <p className="eyebrow">Agency</p>
          <strong>Raj&apos;s Insurance</strong>
          <p className="muted" style={{ marginBottom: 0 }}>
            Demo preview mode can be deployed before backend secrets are wired.
          </p>
        </div>
      </aside>

      <section className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Preview</p>
            <h1>{title}</h1>
          </div>
          <p className="muted">{description}</p>
        </header>
        {children}
      </section>
    </main>
  );
}

