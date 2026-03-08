"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { CampaignCard, SipOption } from "@/lib/live-data";

import { Badge, SectionCard, StatCard } from "@/components/ui";

type CampaignRunnerPanelProps = {
  campaigns: CampaignCard[];
  sipOptions: SipOption[];
};

export function CampaignRunnerPanel({ campaigns, sipOptions }: CampaignRunnerPanelProps) {
  const router = useRouter();
  const activeSipOptions = sipOptions.filter((option) => option.isActive);
  const [selectedSipConfigId, setSelectedSipConfigId] = useState(activeSipOptions[0]?.id ?? "");
  const [maxConcurrent, setMaxConcurrent] = useState(3);
  const [loadingCampaignId, setLoadingCampaignId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleRun(campaignType: "appointment_setter" | "renewal_reminder") {
    if (!selectedSipConfigId) {
      setMessage("Choose a SIP line before launching a campaign.");
      return;
    }

    setLoadingCampaignId(campaignType);
    setMessage(null);

    try {
      const response = await fetch("/api/campaigns/run", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sipConfigId: selectedSipConfigId,
          campaignType,
          maxConcurrent,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Campaign launch failed.");
      }

      setMessage(`Initiated ${payload.initiated} calls. Failed: ${payload.failed}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Campaign launch failed.");
    } finally {
      setLoadingCampaignId(null);
    }
  }

  return (
    <div className="stack">
      <div className="toolbar-card toolbar-grid">
        <label className="field">
          <span className="field-label">SIP line</span>
          <select
            className="input"
            value={selectedSipConfigId}
            onChange={(event) => setSelectedSipConfigId(event.target.value)}
            disabled={activeSipOptions.length === 0}
          >
            {activeSipOptions.length === 0 ? (
              <option value="">No active SIP line</option>
            ) : (
              activeSipOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} · {option.phoneNumber}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Max concurrent calls</span>
          <input
            className="input"
            type="number"
            min={1}
            max={5}
            value={maxConcurrent}
            onChange={(event) => setMaxConcurrent(Number(event.target.value))}
          />
        </label>

        <div className="field">
          <span className="field-label">Campaign control</span>
          <p className="muted" style={{ margin: 0 }}>
            Select a SIP line and launch one of the live campaigns below.
          </p>
        </div>
      </div>

      {message ? <p className="muted" style={{ margin: 0 }}>{message}</p> : null}

      <div className="grid-2">
        {campaigns.map((campaign) => {
          const campaignType =
            campaign.id === "renewal_reminder" ? "renewal_reminder" : "appointment_setter";

          return (
            <SectionCard key={campaign.id} title={campaign.name} meta={`Voice assistant: ${campaign.assistant}`}>
              <div className="grid-3">
                <StatCard label="Queued" value={campaign.queued} delta="Ready to dial" />
                <StatCard label="Connected" value={campaign.connected} delta="Live workspace" />
                <StatCard label="Success rate" value={campaign.successRate} delta="Current base" />
              </div>
              <div className="button-row" style={{ marginTop: 16 }}>
                <button
                  className="button button-primary"
                  type="button"
                  disabled={!selectedSipConfigId || loadingCampaignId === campaign.id}
                  onClick={() => handleRun(campaignType)}
                >
                  {loadingCampaignId === campaign.id ? "Launching..." : "Run campaign"}
                </button>
                <Badge tone="indigo">Assistant: {campaign.assistant}</Badge>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
