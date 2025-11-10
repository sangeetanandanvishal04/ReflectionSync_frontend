// src/pages/bookings/AvailableRooms.tsx
import React, { useState } from "react";
import api from "../../api/axios";
import InlineAlert from "../../components/InlineAlert";
import { useNavigate } from "react-router-dom";

/**
 * Search available rooms between start & end datetime (and optional capacity).
 * Uses GET /bookings/available?start=...&end=...&capacity=...
 */

type Room = {
  id: number;
  floor_plan_id?: number;
  type?: string;
  label?: string;
  capacity?: number;
  x?: number; y?: number; width?: number; height?: number;
  props?: Record<string, any>;
};

function toISO(v: string) {
  if (!v) return "";
  // v is from input[type=datetime-local] (no timezone). Treat as local and convert to ISO.
  const d = new Date(v);
  return d.toISOString();
}

export default function AvailableRooms() {
  const nav = useNavigate();
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setInfo(null);
    if (!start || !end) {
      setError("Please select both start and end date/time.");
      return;
    }
    setLoading(true);
    try {
      const params: any = { start: toISO(start), end: toISO(end) };
      if (capacity) params.capacity = Number(capacity);
      const res = await api.get("/bookings/available", { params });
      setRooms(res.data ?? []);
      if (!res.data || res.data.length === 0) setInfo("No rooms available for the selected slot.");
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function bookRoom(r: Room) {
    // navigate to booking create with prefilled params
    const q = new URLSearchParams();
    q.set("overlay", String(r.id));
    if (start) q.set("start", start);
    if (end) q.set("end", end);
    nav(`/bookings/create?${q.toString()}`);
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Find available rooms</h3>
      <p className="hint">Search for rooms available during a time range.</p>

      {error && <InlineAlert type="error">{error}</InlineAlert>}
      {info && <InlineAlert type="info">{info}</InlineAlert>}

      <form onSubmit={search} style={{ marginTop: 10 }}>
        <div className="field">
          <label>Start</label>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field">
          <label>End</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="field">
          <label>Capacity (optional)</label>
          <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Searching..." : "Search"}</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setStart(""); setEnd(""); setCapacity(""); setRooms([]); setError(null); setInfo(null); }}>Reset</button>
        </div>
      </form>

      <div style={{ marginTop: 14 }}>
        {rooms.map((r) => (
          <div key={r.id} style={{ border: "1px solid #eef2f7", borderRadius: 10, padding: 12, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{r.label ?? `Room #${r.id}`}</div>
              <div className="hint">{r.capacity ? `${r.capacity} seats` : "Capacity unknown"}</div>
              <div className="hint" style={{ fontSize: 12, marginTop: 6 }}>Floorplan: {r.floor_plan_id ?? "—"}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <button className="btn btn-primary" onClick={() => bookRoom(r)}>Book</button>
              <button className="btn btn-ghost" onClick={() => nav(`/bookings/overlay/${r.id}`)}>View bookings</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}