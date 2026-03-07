import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="shell">
      <section className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <p className="muted">Raj&apos;s Insurance CRM</p>
        <h1 style={{ marginTop: 0 }}>Sign in</h1>
        <p className="muted">
          Deploy preview mode can skip auth while you review the UI. When you are ready for live
          data, wire Supabase Auth and disable demo mode.
        </p>
        <div className="button-row" style={{ marginTop: 24 }}>
          <Link className="button button-primary" href="/dashboard">
            Enter demo preview
          </Link>
          <span className="button">Email/password form goes here</span>
        </div>
      </section>
    </main>
  );
}
