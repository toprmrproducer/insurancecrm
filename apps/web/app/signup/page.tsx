import { SignupForm } from "@/components/signup-form";
import { hasSupabaseAuthEnv, isDemoMode } from "@/lib/env";

export default function SignupPage() {
  const liveEnabled = !isDemoMode() && hasSupabaseAuthEnv();

  return (
    <main className="shell">
      <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <p className="muted">Raj&apos;s Insurance CRM</p>
        <h1 style={{ marginTop: 0 }}>Create account</h1>
        <p className="muted">
          Create the first admin account for a new agency. Supabase will handle email confirmation
          and password authentication.
        </p>
        <div style={{ marginTop: 24 }}>
          <SignupForm liveEnabled={liveEnabled} />
        </div>
      </section>
    </main>
  );
}

