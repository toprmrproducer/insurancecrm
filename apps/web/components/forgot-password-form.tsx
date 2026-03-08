"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ForgotPasswordFormProps = {
  liveEnabled: boolean;
};

export function ForgotPasswordForm({ liveEnabled }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!liveEnabled) {
      setMessage("Supabase auth is not configured yet on this deployment.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to send password reset email.");
      setLoading(false);
      return;
    }

    setMessage(payload.message ?? "Password reset email sent.");
    setLoading(false);
  }

  return (
    <div className="stack">
      <form onSubmit={handleSubmit} className="stack">
        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@agency.com"
            disabled={loading}
            required
          />
        </label>

        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset email"}
        </button>
      </form>

      {message ? <p className="muted">{message}</p> : null}

      <p className="muted" style={{ marginBottom: 0 }}>
        Remembered your password? <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}

