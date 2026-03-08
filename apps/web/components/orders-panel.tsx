"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui";
import type { OrderRow } from "@/lib/live-data";

type LeadOption = {
  id: string;
  name: string;
};

type OrdersPanelProps = {
  orders: OrderRow[];
  leads: LeadOption[];
};

const orderStatuses = ["new", "processing", "completed", "cancelled", "refunded"] as const;

export function OrdersPanel({ orders, leads }: OrdersPanelProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    title: "",
    leadId: "",
    amount: "",
    source: "manual",
    notes: "",
    status: "new",
  });
  const [drafts, setDrafts] = useState<
    Record<string, { status: string; notes: string; amount: string }>
  >({});

  const leadOptions = useMemo(
    () => leads.filter((lead) => Boolean(lead.name?.trim())).sort((a, b) => a.name.localeCompare(b.name)),
    [leads],
  );

  function getDraft(order: OrderRow) {
    return (
      drafts[order.id] ?? {
        status: order.status,
        notes: order.notes,
        amount: order.amount.replace(/[$,]/g, ""),
      }
    );
  }

  async function handleCreateOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: createForm.title,
          leadId: createForm.leadId || null,
          amount: createForm.amount ? Number(createForm.amount) : null,
          source: createForm.source || "manual",
          notes: createForm.notes || null,
          status: createForm.status,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create order.");
      }

      setCreateForm({
        title: "",
        leadId: "",
        amount: "",
        source: "manual",
        notes: "",
        status: "new",
      });
      setMessage(payload.message ?? "Order created.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create order.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveOrder(order: OrderRow) {
    const draft = getDraft(order);
    setSavingOrderId(order.id);
    setMessage(null);

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: draft.status,
          notes: draft.notes,
          amount: draft.amount ? Number(draft.amount) : null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update order.");
      }

      setMessage(payload.message ?? "Order updated.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update order.");
    } finally {
      setSavingOrderId(null);
    }
  }

  return (
    <div className="stack">
      <div className="ops-grid">
        <form onSubmit={handleCreateOrder} className="card stack">
          <div className="section-head">
            <div>
              <h2>Add order</h2>
              <p className="muted">Create an order linked to a lead and move it through your fulfillment pipeline.</p>
            </div>
          </div>

          <div className="grid-2">
            <label className="field">
              <span className="field-label">Order title</span>
              <input
                className="input"
                value={createForm.title}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Final expense policy"
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Amount</span>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={createForm.amount}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="129.00"
              />
            </label>
          </div>

          <div className="grid-3">
            <label className="field">
              <span className="field-label">Lead</span>
              <select
                className="input"
                value={createForm.leadId}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, leadId: event.target.value }))}
              >
                <option value="">Unlinked</option>
                {leadOptions.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Source</span>
              <input
                className="input"
                value={createForm.source}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, source: event.target.value }))}
                placeholder="manual / appointment_setter / renewal_reminder"
              />
            </label>
            <label className="field">
              <span className="field-label">Status</span>
              <select
                className="input"
                value={createForm.status}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span className="field-label">Notes</span>
            <input
              className="input"
              value={createForm.notes}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Order context and follow-up details"
            />
          </label>

          <div className="toolbar-actions">
            <button className="button button-primary button-pill" type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create order"}
            </button>
          </div>
        </form>

        <div className="card stack">
          <div className="section-head">
            <div>
              <h2>Recent orders</h2>
              <p className="muted">Update order status and notes directly from this board.</p>
            </div>
          </div>

          {orders.length > 0 ? (
            <div className="list">
              {orders.map((order) => {
                const draft = getDraft(order);

                return (
                  <article key={order.id} className="order-card">
                    <div className="order-card-head">
                      <div>
                        <strong>{order.title}</strong>
                        <p className="muted">{order.customer}</p>
                      </div>
                      <Badge tone={draft.status === "completed" ? "positive" : "indigo"}>{draft.status}</Badge>
                    </div>
                    <div className="grid-3">
                      <label className="field">
                        <span className="field-label">Status</span>
                        <select
                          className="input input-compact"
                          value={draft.status}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [order.id]: { ...getDraft(order), status: event.target.value },
                            }))
                          }
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span className="field-label">Amount</span>
                        <input
                          className="input input-compact"
                          value={draft.amount}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [order.id]: { ...getDraft(order), amount: event.target.value },
                            }))
                          }
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">Created</span>
                        <input className="input input-compact" value={order.createdAt} readOnly />
                      </label>
                    </div>
                    <label className="field">
                      <span className="field-label">Notes</span>
                      <input
                        className="input input-compact"
                        value={draft.notes}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [order.id]: { ...getDraft(order), notes: event.target.value },
                          }))
                        }
                      />
                    </label>
                    <div className="button-row">
                      <Badge tone="indigo">{order.source}</Badge>
                      <button
                        className="button"
                        type="button"
                        disabled={savingOrderId === order.id}
                        onClick={() => handleSaveOrder(order)}
                      >
                        {savingOrderId === order.id ? "Saving..." : "Save order"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="muted">No orders yet. Create your first one from the left panel.</p>
          )}
        </div>
      </div>

      {message ? <p className="muted" style={{ margin: 0 }}>{message}</p> : null}
    </div>
  );
}
