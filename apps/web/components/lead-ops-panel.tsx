"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DragEvent, FormEvent, useMemo, useState } from "react";

import { Badge } from "@/components/ui";
import type { LeadRow, SipOption } from "@/lib/live-data";

type LeadOpsPanelProps = {
  leads: LeadRow[];
  sipOptions: SipOption[];
};

const statusOptions = [
  "new",
  "called",
  "callback_scheduled",
  "appointment_booked",
  "not_interested",
  "dnc",
  "transferred",
  "ineligible",
] as const;

const campaignOptions = [
  { value: "appointment_setter", label: "Appointment Setter" },
  { value: "renewal_reminder", label: "Renewal Reminder" },
] as const;

const pipelineColumns = [
  { status: "new", label: "New" },
  { status: "called", label: "Contacted" },
  { status: "callback_scheduled", label: "Callback" },
  { status: "appointment_booked", label: "Booked" },
  { status: "transferred", label: "Transferred" },
  { status: "dnc", label: "DNC" },
] as const;

type LeadFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  zip: string;
  campaignType: "appointment_setter" | "renewal_reminder";
  notes: string;
};

const blankLead: LeadFormState = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  city: "",
  state: "",
  zip: "",
  campaignType: "appointment_setter" as const,
  notes: "",
};

export function LeadOpsPanel({ leads, sipOptions }: LeadOpsPanelProps) {
  const router = useRouter();
  const activeSipOptions = useMemo(() => sipOptions.filter((option) => option.isActive), [sipOptions]);
  const [selectedSipConfigId, setSelectedSipConfigId] = useState(activeSipOptions[0]?.id ?? "");
  const [campaignType, setCampaignType] = useState<"appointment_setter" | "renewal_reminder">(
    "appointment_setter",
  );
  const [autoLaunchAfterImport, setAutoLaunchAfterImport] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [leadForm, setLeadForm] = useState(blankLead);
  const [leadDrafts, setLeadDrafts] = useState<
    Record<
      string,
      {
        status: string;
        campaignType: LeadRow["campaignType"];
        notes: string;
        nextFollowupAt: string;
      }
    >
  >({});
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [savingLead, setSavingLead] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function getDraft(lead: LeadRow) {
    return (
      leadDrafts[lead.id] ?? {
        status: lead.status,
        campaignType: lead.campaignType,
        notes: lead.notes,
        nextFollowupAt: lead.nextFollowupAt ? lead.nextFollowupAt.slice(0, 16) : "",
      }
    );
  }

  async function handleCreateLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingLead(true);
    setMessage(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(leadForm),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save lead.");
      }

      setLeadForm(blankLead);
      setMessage(payload.message ?? "Lead saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save lead.");
    } finally {
      setSavingLead(false);
    }
  }

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

      if (autoLaunchAfterImport && selectedSipConfigId && payload.leadIds?.length) {
        const launchResponse = await fetch("/api/campaigns/run", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sipConfigId: selectedSipConfigId,
            campaignType,
            maxConcurrent: 3,
            leadIds: payload.leadIds,
          }),
        });
        const launchPayload = await launchResponse.json();
        if (!launchResponse.ok) {
          throw new Error(launchPayload.error ?? "Imported leads were saved, but auto-dial failed.");
        }
        setMessage(
          `Imported ${payload.imported} leads and launched ${launchPayload.initiated} calls. Failed: ${launchPayload.failed}.`,
        );
      } else {
        setMessage(`Imported ${payload.imported} leads. Skipped ${payload.skipped}.`);
      }

      setFile(null);
      setShowImportModal(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lead import failed.");
    } finally {
      setImporting(false);
    }
  }

  function handleFileDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0] ?? null;
    if (droppedFile) {
      setFile(droppedFile);
    }
  }

  async function handleUpdateLead(lead: LeadRow) {
    const draft = getDraft(lead);
    setUpdatingLeadId(lead.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: draft.status,
          campaignType: draft.campaignType,
          notes: draft.notes,
          nextFollowupAt: draft.nextFollowupAt
            ? new Date(draft.nextFollowupAt).toISOString()
            : null,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update lead.");
      }

      setMessage(payload.message ?? "Lead updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update lead.");
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function moveLeadToStatus(lead: LeadRow, status: string) {
    const current = getDraft(lead);
    if (current.status === status) {
      return;
    }

    setMovingLeadId(lead.id);
    setMessage(null);

    setLeadDrafts((drafts) => ({
      ...drafts,
      [lead.id]: {
        ...current,
        status,
      },
    }));

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to move lead.");
      }

      setMessage(`${lead.name} moved to ${status}.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to move lead.");
      setLeadDrafts((drafts) => ({
        ...drafts,
        [lead.id]: current,
      }));
    } finally {
      setMovingLeadId(null);
      setDragLeadId(null);
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
      <div className="ops-grid">
        <form onSubmit={handleCreateLead} className="card stack">
          <div className="section-head">
            <div>
              <h2>Add lead</h2>
              <p className="muted">Create a lead manually without waiting for a CSV import.</p>
            </div>
          </div>

          <div className="grid-2">
            <label className="field">
              <span className="field-label">First name</span>
              <input
                className="input"
                value={leadForm.firstName}
                onChange={(event) => setLeadForm({ ...leadForm, firstName: event.target.value })}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Last name</span>
              <input
                className="input"
                value={leadForm.lastName}
                onChange={(event) => setLeadForm({ ...leadForm, lastName: event.target.value })}
              />
            </label>
          </div>

          <div className="grid-2">
            <label className="field">
              <span className="field-label">Phone</span>
              <input
                className="input"
                value={leadForm.phone}
                onChange={(event) => setLeadForm({ ...leadForm, phone: event.target.value })}
                placeholder="+1 312 555 0182"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Email</span>
              <input
                className="input"
                value={leadForm.email}
                onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })}
                type="email"
              />
            </label>
          </div>

          <div className="grid-3">
            <label className="field">
              <span className="field-label">City</span>
              <input
                className="input"
                value={leadForm.city}
                onChange={(event) => setLeadForm({ ...leadForm, city: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">State</span>
              <input
                className="input"
                value={leadForm.state}
                onChange={(event) => setLeadForm({ ...leadForm, state: event.target.value })}
              />
            </label>
            <label className="field">
              <span className="field-label">ZIP</span>
              <input
                className="input"
                value={leadForm.zip}
                onChange={(event) => setLeadForm({ ...leadForm, zip: event.target.value })}
              />
            </label>
          </div>

          <div className="grid-2">
            <label className="field">
              <span className="field-label">Campaign</span>
              <select
                className="input"
                value={leadForm.campaignType}
                onChange={(event) =>
                  setLeadForm({
                    ...leadForm,
                    campaignType: event.target.value as "appointment_setter" | "renewal_reminder",
                  })
                }
              >
                {campaignOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Notes</span>
              <input
                className="input"
                value={leadForm.notes}
                onChange={(event) => setLeadForm({ ...leadForm, notes: event.target.value })}
                placeholder="Any context for the next caller"
              />
            </label>
          </div>

          <div className="toolbar-actions">
            <button className="button button-primary button-pill" type="submit" disabled={savingLead}>
              {savingLead ? "Saving..." : "Add lead"}
            </button>
          </div>
        </form>

        <div className="stack">
          <div className="card stack">
            <div className="section-head">
              <div>
                <h2>Import CSV</h2>
                <p className="muted">Open a drag-and-drop importer for bulk lead uploads.</p>
              </div>
            </div>

            <div className="toolbar-actions">
              <button className="button button-primary button-pill" type="button" onClick={() => setShowImportModal(true)}>
                Open importer
              </button>
            </div>
          </div>

          <div className="card stack">
            <div className="section-head">
              <div>
                <h2>Calling line</h2>
                <p className="muted">Select the live SIP line used for call-now and campaign actions.</p>
              </div>
            </div>

            <div className="field">
              <span className="field-label">Active SIP line</span>
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
              <Link className="button button-outline button-pill" href="/settings/sip">
                Configure SIP
              </Link>
            </div>
          </div>
        </div>
      </div>

      {message ? <p className="muted" style={{ margin: 0 }}>{message}</p> : null}

      <section className="lead-pipeline">
        {pipelineColumns.map((column) => {
          const columnLeads = leads.filter((lead) => getDraft(lead).status === column.status);

          return (
            <article
              key={column.status}
              className="pipeline-column"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (!dragLeadId) {
                  return;
                }
                const draggedLead = leads.find((lead) => lead.id === dragLeadId);
                if (!draggedLead) {
                  return;
                }
                void moveLeadToStatus(draggedLead, column.status);
              }}
            >
              <header className="pipeline-column-head">
                <strong>{column.label}</strong>
                <Badge tone="indigo">{columnLeads.length}</Badge>
              </header>
              <div className="pipeline-column-body">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`pipeline-card ${movingLeadId === lead.id ? "pipeline-card-loading" : ""}`}
                    draggable
                    onDragStart={() => setDragLeadId(lead.id)}
                  >
                    <strong>{lead.name}</strong>
                    <p className="muted">{lead.phone}</p>
                    <p className="muted">{lead.campaign}</p>
                    <div className="button-row">
                      <button className="button" type="button" onClick={() => handleCall(lead.id)}>
                        Call
                      </button>
                      <button className="button button-outline" type="button" onClick={() => handleUpdateLead(lead)}>
                        Save
                      </button>
                    </div>
                  </div>
                ))}
                {columnLeads.length === 0 ? <p className="muted">Drop lead here</p> : null}
              </div>
            </article>
          );
        })}
      </section>

      {showImportModal ? (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="section-head">
              <div>
                <h2>Import lead CSV</h2>
                <p className="muted">
                  Drag and drop a CSV or choose a file. The importer will normalize phone columns,
                  map basic lead fields, and save them straight into the queue.
                </p>
              </div>
            </div>

            <form onSubmit={handleImport} className="stack">
              <label className="field">
                <span className="field-label">Campaign for import</span>
                <select
                  className="input"
                  value={campaignType}
                  onChange={(event) =>
                    setCampaignType(event.target.value as "appointment_setter" | "renewal_reminder")
                  }
                  disabled={importing}
                >
                  {campaignOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div
                className="dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleFileDrop}
              >
                <strong>{file ? file.name : "Drop CSV here"}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  or click below to browse for a `.csv` file
                </p>
              </div>

              <label className="field">
                <span className="field-label">Choose file</span>
                <input
                  className="input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  disabled={importing}
                />
              </label>

              <label className="field" style={{ flexDirection: "row", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={autoLaunchAfterImport}
                  onChange={(event) => setAutoLaunchAfterImport(event.target.checked)}
                />
                <span className="field-label">
                  Start calling imported leads immediately using the selected SIP line
                </span>
              </label>

              <div className="toolbar-actions">
                <button className="button button-primary button-pill" type="submit" disabled={importing}>
                  {importing ? "Importing..." : "Import CSV"}
                </button>
                <button className="button button-outline button-pill" type="button" onClick={() => setShowImportModal(false)}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {leads.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Campaign</th>
              <th>Status</th>
              <th>Next call</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const draft = getDraft(lead);
              const disabled =
                ["dnc", "appointment_booked", "transferred"].includes(lead.status) ||
                !selectedSipConfigId ||
                callingLeadId === lead.id;

              return (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.name}</strong>
                    <p className="muted" style={{ margin: "6px 0 0" }}>
                      {lead.location}
                    </p>
                  </td>
                  <td>
                    <strong>{lead.phone}</strong>
                    <p className="muted" style={{ margin: "6px 0 0" }}>
                      {lead.email}
                    </p>
                  </td>
                  <td>
                    <select
                      className="input input-compact"
                      value={draft.campaignType}
                      onChange={(event) =>
                        setLeadDrafts((current) => ({
                          ...current,
                          [lead.id]: {
                            ...getDraft(lead),
                            campaignType: event.target.value as LeadRow["campaignType"],
                          },
                        }))
                      }
                    >
                      {campaignOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="muted" style={{ margin: "6px 0 0" }}>
                      {lead.premium}
                    </p>
                  </td>
                  <td>
                    <select
                      className="input input-compact"
                      value={draft.status}
                      onChange={(event) =>
                        setLeadDrafts((current) => ({
                          ...current,
                          [lead.id]: {
                            ...getDraft(lead),
                            status: event.target.value,
                          },
                        }))
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <div style={{ marginTop: 8 }}>
                      <Badge
                        tone={
                          draft.status === "dnc"
                            ? "danger"
                            : draft.status === "appointment_booked"
                              ? "positive"
                              : "indigo"
                        }
                      >
                        {draft.status}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <input
                      className="input input-compact"
                      type="datetime-local"
                      value={draft.nextFollowupAt}
                      onChange={(event) =>
                        setLeadDrafts((current) => ({
                          ...current,
                          [lead.id]: {
                            ...getDraft(lead),
                            nextFollowupAt: event.target.value,
                          },
                        }))
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input input-compact"
                      value={draft.notes}
                      onChange={(event) =>
                        setLeadDrafts((current) => ({
                          ...current,
                          [lead.id]: {
                            ...getDraft(lead),
                            notes: event.target.value,
                          },
                        }))
                      }
                      placeholder="Add context"
                    />
                  </td>
                  <td>
                    <div className="lead-row-actions">
                      <button
                        className="button"
                        type="button"
                        disabled={updatingLeadId === lead.id}
                        onClick={() => handleUpdateLead(lead)}
                      >
                        {updatingLeadId === lead.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="button button-primary"
                        type="button"
                        disabled={disabled}
                        onClick={() => handleCall(lead.id)}
                      >
                        {callingLeadId === lead.id ? "Calling..." : "Call now"}
                      </button>
                    </div>
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
