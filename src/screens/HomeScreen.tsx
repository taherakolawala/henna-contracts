import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { ContractSummary } from "../../shared/types";

interface Props {
  onNew: () => void;
  onOpen: (id: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()} ${hh}:${mi}`;
}

export function HomeScreen({ onNew, onOpen }: Props) {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const list = await api.listContracts();
    setContracts(list);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter((c) => (c.clientName || "").toLowerCase().includes(q));
  }, [contracts, search]);

  async function handleDelete(id: string, name: string) {
    const ok = window.confirm(
      `Delete contract for "${name || "Untitled"}"? This cannot be undone.`
    );
    if (!ok) return;
    await api.deleteContract(id);
    await refresh();
  }

  async function handleDownload(id: string) {
    try {
      console.log("[Home Download] start", id);
      await api.downloadPdf(id);
      console.log("[Home Download] done", id);
    } catch (err: any) {
      console.error("[Home Download] error", err);
      alert("Download failed: " + (err?.message || String(err)));
    }
  }

  return (
    <div className="screen home">
      <header className="app-header">
        <div className="title-block">
          <h1>Tampa Bay Henna</h1>
          <div className="subtitle">Contracts</div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onNew}>
          + New Contract
        </button>
      </header>

      <div className="toolbar">
        <input
          className="search"
          type="text"
          placeholder="Search by client name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table">
        <div className="table-head">
          <div className="col-name">Client Name</div>
          <div className="col-date">Last Edited</div>
          <div className="col-actions">Actions</div>
        </div>

        {loading ? (
          <div className="empty">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            {contracts.length === 0
              ? "No contracts yet. Click \"+ New Contract\" to get started."
              : "No contracts match your search."}
          </div>
        ) : (
          filtered.map((c) => (
            <div className="table-row" key={c.id}>
              <div className="col-name">{c.clientName || <em>Untitled</em>}</div>
              <div className="col-date">{formatDate(c.updatedAt)}</div>
              <div className="col-actions">
                <button className="btn" onClick={() => onOpen(c.id)}>
                  Open
                </button>
                <button className="btn" onClick={() => handleDownload(c.id)}>
                  Download PDF
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(c.id, c.clientName)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
