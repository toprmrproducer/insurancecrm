import { LoginForm } from "@/components/login-form";
import { hasSupabaseAuthEnv, isDemoMode } from "@/lib/env";

export default function LoginPage() {
  const liveEnabled = !isDemoMode() && hasSupabaseAuthEnv();

  return (
    <main className="shell">
      <section className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <p className="muted">Raj&apos;s Insurance CRM</p>
        <h1 style={{ marginTop: 0 }}>Sign in</h1>
        <p className="muted">
          {liveEnabled
            ? "Use your Supabase email and password to access the CRM."
            : "This deployment is not connected to Supabase Auth yet. Add production environment variables to enable real sign-in."}
        </p>
        <div style={{ marginTop: 24 }}>
          <LoginForm liveEnabled={liveEnabled} />
        </div>
      </section>
    </main>
  );
}
