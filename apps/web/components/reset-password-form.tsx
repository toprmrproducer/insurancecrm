"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        password,
        confirmPassword,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "Unable to update password.");
      setLoading(false);
      return;
    }

    setMessage(payload.message ?? "Password updated.");
    setLoading(false);
    router.push("/login");
  }

  return (
    <div className="stack">
      <form onSubmit={handleSubmit} className="stack">
        <label className="field">
          <span className="field-label">New password</span>
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

        <label className="field">
          <span className="field-label">Confirm new password</span>
          <input
            className="input"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your new password"
            disabled={loading}
            required
          />
        </label>

        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      {message ? <p className="muted">{message}</p> : null}

      <p className="muted" style={{ marginBottom: 0 }}>
        Back to <Link href="/login">sign in</Link>
      </p>
    </div>
  );
}

