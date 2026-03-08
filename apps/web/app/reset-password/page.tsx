import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="shell">
      <section className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <p className="muted">Raj&apos;s Insurance CRM</p>
        <h1 style={{ marginTop: 0 }}>Set a new password</h1>
        <p className="muted">
          Enter a new password after following the recovery link from Supabase.
        </p>
        <div style={{ marginTop: 24 }}>
          <ResetPasswordForm />
        </div>
      </section>
    </main>
  );
}

