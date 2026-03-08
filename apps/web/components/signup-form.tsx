"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type SignupFormProps = {
  liveEnabled: boolean;
};

export function SignupForm({ liveEnabled }: SignupFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        agencyName,
        email,
        password,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create account.");
      setLoading(false);
      return;
    }

    setMessage(payload.message ?? "Account created.");
    if (!payload.requiresEmailConfirmation) {
      router.push("/login");
    }
    setLoading(false);
  }

  return (
    <div className="stack">
      <form onSubmit={handleSubmit} className="stack">
        <label className="field">
          <span className="field-label">Full name</span>
          <input
            className="input"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Raj Patel"
            disabled={loading}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Agency name</span>
          <input
            className="input"
            value={agencyName}
            onChange={(event) => setAgencyName(event.target.value)}
            placeholder="Raj's Insurance"
            disabled={loading}
            required
          />
        </label>

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

        <label className="field">
          <span className="field-label">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            disabled={loading}
            required
          />
        </label>

        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      {message ? <p className="muted">{message}</p> : null}

      <p className="muted" style={{ marginBottom: 0 }}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}

