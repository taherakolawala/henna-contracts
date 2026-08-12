import React from "react";
import type { EventEntry } from "../../shared/types";

interface Props {
  events: EventEntry[];
  onChange: (events: EventEntry[]) => void;
}

function newEventId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function emptyEvent(): EventEntry {
  return {
    id: newEventId(),
    name: "",
    date: "",
    location: "",
    address: "",
    timings: "",
    numArtists: "",
  };
}

export function EventsSection({ events, onChange }: Props) {
  function updateOne(idx: number, patch: Partial<EventEntry>) {
    const next = events.map((e, i) => (i === idx ? { ...e, ...patch } : e));
    onChange(next);
  }

  function remove(idx: number) {
    onChange(events.filter((_, i) => i !== idx));
  }

  function add() {
    onChange([...events, emptyEvent()]);
  }

  return (
    <div>
      {events.map((ev, i) => (
        <div className="subcard" key={ev.id}>
          <div className="subcard-header">
            <div className="subcard-title">Event {i + 1}</div>
            {events.length > 1 && (
              <button className="btn btn-small btn-danger" onClick={() => remove(i)}>
                Remove
              </button>
            )}
          </div>
          <div className="field">
            <label>Event Name</label>
            <input
              type="text"
              placeholder="e.g. Bridal Henna, Party Henna"
              value={ev.name}
              onChange={(e) => updateOne(i, { name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Date of Service</label>
            <input
              type="date"
              value={ev.date}
              onChange={(e) => updateOne(i, { date: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Location</label>
            <input
              type="text"
              value={ev.location}
              onChange={(e) => updateOne(i, { location: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Address</label>
            <input
              type="text"
              value={ev.address}
              onChange={(e) => updateOne(i, { address: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Timings</label>
            <input
              type="text"
              placeholder="e.g. 4:00 PM - 7:00 PM"
              value={ev.timings}
              onChange={(e) => updateOne(i, { timings: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Number of Artists</label>
            <input
              type="text"
              value={ev.numArtists}
              onChange={(e) => updateOne(i, { numArtists: e.target.value })}
            />
          </div>
        </div>
      ))}
      <button className="btn" onClick={add}>
        + Add Event
      </button>
    </div>
  );
}
