"use client";

import { useEffect, useState } from "react";

type CampaignConfig = {
  campaignType: "appointment_setter" | "renewal_reminder";
  model: string;
  voice: string;
  agentName: string;
  firstLine: string;
  prompt: string;
  isActive: boolean;
};

const labels = {
  appointment_setter: "Appointment Setter",
  renewal_reminder: "Renewal Reminder",
} as const;

export function AgentConfigPanel() {
  const [configs, setConfigs] = useState<CampaignConfig[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignConfig["campaignType"]>("appointment_setter");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadConfigs() {
      try {
        const response = await fetch("/api/agent-config", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load agent configuration.");
        }

        if (active) {
          setConfigs(payload.configs ?? []);
          if (payload.warning) {
            setMessage(payload.warning);
          }
        }
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : "Unable to load agent configuration.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadConfigs();
    return () => {
      active = false;
    };
  }, []);

  const activeConfig = configs.find((config) => config.campaignType === selectedCampaign);

  function updateConfig(field: keyof CampaignConfig, value: string) {
    setConfigs((current) =>
      current.map((config) =>
        config.campaignType === selectedCampaign ? { ...config, [field]: value } : config,
      ),
    );
  }

  async function handleSave() {
    if (!activeConfig) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/agent-config", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(activeConfig),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save agent configuration.");
      }

      setMessage(payload.message ?? "Agent configuration saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save agent configuration.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="muted">Loading agent configuration...</p>;
  }

  if (!activeConfig) {
    return <p className="muted">No agent configuration found.</p>;
  }

  return (
    <div className="stack">
      <div className="button-row">
        {configs.map((config) => (
          <button
            key={config.campaignType}
            className={`button ${selectedCampaign === config.campaignType ? "button-primary" : ""}`}
            type="button"
            onClick={() => setSelectedCampaign(config.campaignType)}
          >
            {labels[config.campaignType]}
          </button>
        ))}
      </div>

      <div className="grid-2">
        <label className="field">
          <span className="field-label">Gemini model</span>
          <input
            className="input"
            value={activeConfig.model}
            onChange={(event) => updateConfig("model", event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Voice</span>
          <input
            className="input"
            value={activeConfig.voice}
            onChange={(event) => updateConfig("voice", event.target.value)}
          />
        </label>
      </div>

      <div className="grid-2">
        <label className="field">
          <span className="field-label">Agent display name</span>
          <input
            className="input"
            value={activeConfig.agentName}
            onChange={(event) => updateConfig("agentName", event.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">Opening line</span>
          <input
            className="input"
            value={activeConfig.firstLine}
            onChange={(event) => updateConfig("firstLine", event.target.value)}
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">System prompt</span>
        <textarea
          className="input textarea-input"
          value={activeConfig.prompt}
          onChange={(event) => updateConfig("prompt", event.target.value)}
          rows={14}
        />
      </label>

      <div className="toolbar-actions">
        <button className="button button-primary button-pill" type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save agent configuration"}
        </button>
      </div>

      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
