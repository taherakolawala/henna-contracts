import React, { useEffect, useState } from "react";
import { api } from "../api";
import type {
  Contract,
  DepositStatus,
  EventEntry,
  LineItem,
} from "../../shared/types";
import { createEmptyContract } from "../../shared/types";
import { EventsSection } from "../components/EventsSection";
import { PricingSection } from "../components/PricingSection";

interface Props {
  contractId: string | null;
  onBack: () => void;
}

function newLineItemId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function ContractFormScreen({ contractId, onBack }: Props) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    (async () => {
      if (contractId) {
        const loaded = await api.loadContract(contractId);
        if (loaded) {
          setContract(loaded);
          return;
        }
      }
      const id = await api.newId();
      setContract(createEmptyContract(id));
    })();
  }, [contractId]);

  if (!contract) {
    return <div className="screen"><div className="empty">Loading...</div></div>;
  }

  function update(fn: (c: Contract) => void) {
    setContract((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev)) as Contract;
      fn(next);
      return next;
    });
  }

  async function handleSave() {
    if (!contract) return;
    setSaving(true);
    try {
      console.log("[Save] start", contract.id);
      await api.saveContract(contract);
      console.log("[Save] done", contract.id);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } catch (err: any) {
      console.error("[Save] error", err);
      alert("Save failed: " + (err?.message || String(err)));
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    if (!contract) return;
    try {
      console.log("[Download] start", contract.id);
      await api.saveContract(contract);
      console.log("[Download] saved, downloading");
      await api.downloadPdf(contract.id);
      console.log("[Download] done");
    } catch (err: any) {
      console.error("[Download] error", err);
      alert("Download failed: " + (err?.message || String(err)));
    }
  }

  function setEvents(events: EventEntry[]) {
    update((c) => {
      c.events = events;
      const validIds = new Set(events.map((e) => e.id));
      c.pricing = c.pricing.filter((p) => validIds.has(p.eventId));
      for (const ev of events) {
        if (!c.pricing.find((p) => p.eventId === ev.id)) {
          c.pricing.push({ eventId: ev.id, lineItems: [] });
        }
      }
    });
  }

  function setLineItems(eventId: string, items: LineItem[]) {
    update((c) => {
      const p = c.pricing.find((x) => x.eventId === eventId);
      if (p) p.lineItems = items;
      else c.pricing.push({ eventId, lineItems: items });
    });
  }

  return (
    <div className="screen form">
      <header className="form-header">
        <button className="btn" onClick={onBack}>
          &larr; Back
        </button>
        <div className="form-title">
          {contractId ? "Edit Contract" : "New Contract"}
        </div>
        <div className="form-actions">
          {savedFlash && <span className="saved-flash">Saved</span>}
          <button className="btn" onClick={handleDownload}>
            Download PDF
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <div className="form-body">
        <section className="form-section">
          <h2>Client Information</h2>
          <div className="field">
            <label>Name</label>
            <input
              type="text"
              value={contract.client.name}
              onChange={(e) =>
                update((c) => {
                  c.client.name = e.target.value;
                })
              }
            />
          </div>
          <div className="field">
            <label>Contact Phone</label>
            <input
              type="text"
              value={contract.client.phone}
              onChange={(e) =>
                update((c) => {
                  c.client.phone = e.target.value;
                })
              }
            />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="text"
              value={contract.client.email}
              onChange={(e) =>
                update((c) => {
                  c.client.email = e.target.value;
                })
              }
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input
              type="date"
              value={contract.client.dateSigned}
              onChange={(e) =>
                update((c) => {
                  c.client.dateSigned = e.target.value;
                })
              }
            />
          </div>
        </section>

        <section className="form-section">
          <h2>Events</h2>
          <EventsSection events={contract.events} onChange={setEvents} />
        </section>

        <section className="form-section">
          <h2>Pricing</h2>
          <PricingSection
            events={contract.events}
            pricing={contract.pricing}
            onChange={setLineItems}
            newId={newLineItemId}
          />
        </section>

        <section className="form-section">
          <h2>Payment</h2>
          <div className="field">
            <label>Deposit Amount ($)</label>
            <input
              type="text"
              value={contract.deposit.amount}
              onChange={(e) =>
                update((c) => {
                  c.deposit.amount = e.target.value;
                })
              }
            />
          </div>
          <div className="field">
            <label>Deposit Status</label>
            <div className="radio-group">
              {(["Not Received", "Received"] as DepositStatus[]).map((s) => (
                <label key={s} className="radio-label">
                  <input
                    type="radio"
                    name="depositStatus"
                    checked={contract.deposit.status === s}
                    onChange={() =>
                      update((c) => {
                        c.deposit.status = s;
                      })
                    }
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>
          {contract.deposit.status === "Received" && (
            <div className="field">
              <label>Date Deposit Received</label>
              <input
                type="date"
                value={contract.deposit.dateReceived}
                onChange={(e) =>
                  update((c) => {
                    c.deposit.dateReceived = e.target.value;
                  })
                }
              />
            </div>
          )}
        </section>

        <section className="form-section">
          <h2>Photography Consent</h2>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={contract.photographyConsent}
              onChange={(e) =>
                update((c) => {
                  c.photographyConsent = e.target.checked;
                })
              }
            />
            Include photography consent section in contract
          </label>
        </section>
      </div>
    </div>
  );
}
