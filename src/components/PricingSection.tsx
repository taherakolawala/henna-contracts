import React from "react";
import type { EventEntry, EventPricing, LineItem } from "../../shared/types";

interface Props {
  events: EventEntry[];
  pricing: EventPricing[];
  onChange: (eventId: string, items: LineItem[]) => void;
  newId: () => string;
}

export function PricingSection({ events, pricing, onChange, newId }: Props) {
  function itemsFor(eventId: string): LineItem[] {
    return pricing.find((p) => p.eventId === eventId)?.lineItems || [];
  }

  function addItem(eventId: string) {
    const current = itemsFor(eventId);
    onChange(eventId, [...current, { id: newId(), description: "", amount: "" }]);
  }

  function updateItem(eventId: string, idx: number, patch: Partial<LineItem>) {
    const current = itemsFor(eventId);
    onChange(
      eventId,
      current.map((li, i) => (i === idx ? { ...li, ...patch } : li))
    );
  }

  function removeItem(eventId: string, idx: number) {
    const current = itemsFor(eventId);
    onChange(eventId, current.filter((_, i) => i !== idx));
  }

  let grandTotal = 0;

  return (
    <div>
      {events.map((ev, i) => {
        const items = itemsFor(ev.id);
        let subtotal = 0;
        for (const li of items) {
          const n = Number(li.amount);
          if (isFinite(n)) subtotal += n;
        }
        grandTotal += subtotal;
        return (
          <div className="subcard" key={ev.id}>
            <div className="subcard-header">
              <div className="subcard-title">
                Event {i + 1}
                {ev.name ? `: ${ev.name}` : ""}
              </div>
            </div>
            {items.length === 0 && (
              <div className="hint">No line items yet.</div>
            )}
            {items.map((li, idx) => (
              <div className="line-item-row" key={li.id}>
                <input
                  className="li-desc-input"
                  type="text"
                  placeholder="Description (e.g. Bridal Hands)"
                  value={li.description}
                  onChange={(e) =>
                    updateItem(ev.id, idx, { description: e.target.value })
                  }
                />
                <input
                  className="li-amt-input"
                  type="text"
                  placeholder="Amount"
                  value={li.amount}
                  onChange={(e) =>
                    updateItem(ev.id, idx, { amount: e.target.value })
                  }
                />
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => removeItem(ev.id, idx)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button className="btn btn-small" onClick={() => addItem(ev.id)}>
              + Add Line Item
            </button>
            {items.length > 0 && (
              <div className="subtotal-row">Subtotal: ${subtotal.toFixed(2)}</div>
            )}
          </div>
        );
      })}
      <div className="grand-total-row">Grand Total: ${grandTotal.toFixed(2)}</div>
    </div>
  );
}
