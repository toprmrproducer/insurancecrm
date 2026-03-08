import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { hasSupabaseAuthEnv } from "@/lib/env";

export default function ForgotPasswordPage() {
  const liveEnabled = hasSupabaseAuthEnv();

  return (
    <main className="shell">
      <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <p className="muted">Raj&apos;s Insurance CRM</p>
        <h1 style={{ marginTop: 0 }}>Forgot password</h1>
        <p className="muted">
          Supabase will send a secure password reset email to the address on your account.
        </p>
        <div style={{ marginTop: 24 }}>
          <ForgotPasswordForm liveEnabled={liveEnabled} />
        </div>
      </section>
    </main>
  );
}
