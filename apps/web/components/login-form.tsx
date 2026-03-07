"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type LoginFormProps = {
  liveEnabled: boolean;
};

export function LoginForm({ liveEnabled }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!liveEnabled) {
      setMessage("Supabase is not configured yet on this deployment.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to sign in.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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

        <label className="field">
          <span className="field-label">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            disabled={loading}
            required
          />
        </label>

        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {message ? <p className="muted">{message}</p> : null}

      {!liveEnabled ? (
        <div className="card subtle-card">
          <p className="eyebrow">Backend Required</p>
          <p className="muted" style={{ marginBottom: 12 }}>
            This deployment is not connected to Supabase Auth yet. Add Supabase URL and anon key
            values in Coolify, redeploy, and then sign in with a real user.
          </p>
          <Link className="button" href="/dashboard">
            Open temporary workspace preview
          </Link>
        </div>
      ) : null}
    </div>
  );
}
