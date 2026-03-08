"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { Badge } from "@/components/ui";
import type { LeadRow, SipOption } from "@/lib/live-data";

type LeadOpsPanelProps = {
  leads: LeadRow[];
  sipOptions: SipOption[];
};

export function LeadOpsPanel({ leads, sipOptions }: LeadOpsPanelProps) {
  const router = useRouter();
  const activeSipOptions = useMemo(() => sipOptions.filter((option) => option.isActive), [sipOptions]);
  const [selectedSipConfigId, setSelectedSipConfigId] = useState(activeSipOptions[0]?.id ?? "");
  const [campaignType, setCampaignType] = useState<"appointment_setter" | "renewal_reminder">(
    "appointment_setter",
  );
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Choose a CSV file before importing.");
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("campaignType", campaignType);

      const response = await fetch("/api/leads/import", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Lead import failed.");
      }

      setMessage(`Imported ${payload.imported} leads. Skipped ${payload.skipped}.`);
      setFile(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lead import failed.");
    } finally {
      setImporting(false);
    }
  }

  async function handleCall(leadId: string) {
    if (!selectedSipConfigId) {
      setMessage("Select an active SIP line before placing a call.");
      return;
    }

    setCallingLeadId(leadId);
    setMessage(null);

    try {
      const response = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          leadId,
          sipConfigId: selectedSipConfigId,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to start call.");
      }

      setMessage(`Call started. Call ID: ${payload.callId}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start call.");
    } finally {
      setCallingLeadId(null);
    }
  }

  return (
    <div className="stack">
      <div className="toolbar-card">
        <form onSubmit={handleImport} className="toolbar-grid">
          <div className="field">
            <span className="field-label">Campaign for import</span>
            <select
              className="input"
              value={campaignType}
              onChange={(event) =>
                setCampaignType(event.target.value as "appointment_setter" | "renewal_reminder")
              }
              disabled={importing}
            >
              <option value="appointment_setter">Appointment Setter</option>
              <option value="renewal_reminder">Renewal Reminder</option>
            </select>
          </div>

          <label className="field">
            <span className="field-label">CSV file</span>
            <input
              className="input"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              disabled={importing}
            />
          </label>

          <div className="field">
            <span className="field-label">Call line</span>
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
          </div>

          <div className="toolbar-actions">
            <button className="button button-primary button-pill" type="submit" disabled={importing}>
              {importing ? "Importing..." : "Import CSV"}
            </button>
            <Link className="button button-outline button-pill" href="/settings/sip">
              Configure SIP
            </Link>
          </div>
        </form>

        {message ? <p className="muted" style={{ margin: 0 }}>{message}</p> : null}
      </div>

      {leads.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Campaign</th>
              <th>Location</th>
              <th>Premium</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const disabled =
                ["dnc", "appointment_booked", "transferred"].includes(lead.status) ||
                !selectedSipConfigId ||
                callingLeadId === lead.id;

              return (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.phone}</td>
                  <td>{lead.campaign}</td>
                  <td>{lead.location}</td>
                  <td>{lead.premium}</td>
                  <td>
                    <Badge
                      tone={
                        lead.status === "dnc"
                          ? "danger"
                          : lead.status === "appointment_booked"
                            ? "positive"
                            : "indigo"
                      }
                    >
                      {lead.status}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="button"
                      type="button"
                      disabled={disabled}
                      onClick={() => handleCall(lead.id)}
                    >
                      {callingLeadId === lead.id ? "Calling..." : "Call now"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="muted">No leads yet. Import a CSV to populate the queue.</p>
      )}
    </div>
  );
}
