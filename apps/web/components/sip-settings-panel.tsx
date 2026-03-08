"use client";

import { FormEvent, useEffect, useState } from "react";

type SipConfig = {
  id: string;
  label: string;
  phone_number: string;
  vobiz_sip_domain: string;
  livekit_outbound_trunk_id: string | null;
  livekit_inbound_trunk_id: string | null;
  is_active: boolean;
};

type SipSettingsPanelProps = {
  liveEnabled: boolean;
};

const initialForm = {
  label: "",
  vobizTrunkId: "",
  vobizSipDomain: "",
  vobizUsername: "",
  vobizPassword: "",
  phoneNumber: "",
};

export function SipSettingsPanel({ liveEnabled }: SipSettingsPanelProps) {
  const [configs, setConfigs] = useState<SipConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    let isMounted = true;

    async function loadConfigs() {
      try {
        const response = await fetch("/api/sip/configure", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load SIP configurations");
        }

        if (isMounted) {
          setConfigs(payload.sipConfigs ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Failed to load SIP configurations");
        }
      }
    }

    void loadConfigs();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/sip/configure", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save SIP configuration");
      }

      setForm(initialForm);
      setMessage(
        `Saved ${payload.sipConfig.label}. LiveKit outbound trunk: ${payload.sipConfig.livekit_outbound_trunk_id}.`,
      );

      setConfigs((current) => {
        const existing = current.filter((item) => item.id !== payload.sipConfig.id);
        return [payload.sipConfig, ...existing];
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save SIP configuration");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div className="card subtle-card">
        <p className="eyebrow">How Vobiz Setup Works</p>
        <ol className="simple-list muted">
          <li>Create an outbound trunk in Vobiz and copy the SIP domain, username, and password.</li>
          <li>Buy or assign a DID number to that Vobiz trunk.</li>
          <li>Paste those values into this page and save the line.</li>
          <li>The backend creates the matching LiveKit inbound and outbound trunks automatically.</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="card stack">
        <div className="grid-2">
          <label className="field">
            <span className="field-label">Line label</span>
            <input
              className="input"
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
              placeholder="Main Line"
              autoComplete="organization"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Phone number / DID</span>
            <input
              className="input"
              value={form.phoneNumber}
              onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })}
              placeholder="+13125550182"
              autoComplete="tel"
              required
            />
          </label>
        </div>

        <div className="grid-2">
          <label className="field">
            <span className="field-label">Vobiz SIP domain</span>
            <input
              className="input"
              value={form.vobizSipDomain}
              onChange={(event) => setForm({ ...form, vobizSipDomain: event.target.value })}
              placeholder="5f3a607b.sip.vobiz.ai"
              autoComplete="url"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Vobiz trunk id</span>
            <input
              className="input"
              value={form.vobizTrunkId}
              onChange={(event) => setForm({ ...form, vobizTrunkId: event.target.value })}
              placeholder="Optional reference from Vobiz"
              autoComplete="off"
            />
          </label>
        </div>

        <div className="grid-2">
          <label className="field">
            <span className="field-label">Vobiz username</span>
            <input
              className="input"
              value={form.vobizUsername}
              onChange={(event) => setForm({ ...form, vobizUsername: event.target.value })}
              placeholder="username"
              autoComplete="username"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Vobiz password</span>
            <input
              className="input"
              type="password"
              value={form.vobizPassword}
              onChange={(event) => setForm({ ...form, vobizPassword: event.target.value })}
              placeholder="password"
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        <button className="button button-primary" type="submit" disabled={loading}>
          {loading ? "Saving line..." : "Save SIP line"}
        </button>

        <p className="muted" style={{ margin: 0 }}>
          {liveEnabled
            ? "Submitting this form provisions the LiveKit trunks and stores the Vobiz connection."
            : "Live mode is not enabled yet. Add the production environment variables to make saving work."}
        </p>
      </form>

      {message ? <p className="muted">{message}</p> : null}

      <div className="card">
        <div className="section-head">
          <h2>Configured lines</h2>
          <p className="muted">These are the lines already saved for this agency.</p>
        </div>
        <div className="list">
          {configs.length === 0 ? (
            <p className="muted">No SIP lines saved yet.</p>
          ) : (
            configs.map((config) => (
              <div key={config.id} className="list-row">
                <div>
                  <strong>{config.label}</strong>
                  <p className="muted">
                    {config.phone_number} · {config.vobiz_sip_domain}
                  </p>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    Outbound: {config.livekit_outbound_trunk_id ?? "pending"} · Inbound:{" "}
                    {config.livekit_inbound_trunk_id ?? "pending"}
                  </p>
                </div>
                <span className={`badge ${config.is_active ? "badge-positive" : "badge-warning"}`}>
                  {config.is_active ? "active" : "inactive"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
