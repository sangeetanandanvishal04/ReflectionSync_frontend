// src/pages/bookings/CreateBooking.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import InlineAlert from "../../components/InlineAlert";

/**
 * Query params:
 *   ?overlay=123&start=2025-11-10T10:00&end=2025-11-10T11:00
 *
 * POST /bookings
 * body: { overlay_id, start_ts, end_ts, participants }
 */

function toISOFromLocal(v: string) {
  if (!v) return "";
  return new Date(v).toISOString();
}

export default function CreateBooking() {
  const loc = useLocation();
  const nav = useNavigate();
  const qp = new URLSearchParams(loc.search);
  const overlayQ = qp.get("overlay") ?? "";
  const startQ = qp.get("start") ?? "";
  const endQ = qp.get("end") ?? "";

  const [overlayId, setOverlayId] = useState<string>(overlayQ);
  const [start, setStart] = useState<string>(startQ);
  const [end, setEnd] = useState<string>(endQ);
  const [participants, setParticipants] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<any[] | null>(null);

  useEffect(() => {
    if (overlayQ) setOverlayId(overlayQ);
    if (startQ) setStart(startQ);
    if (endQ) setEnd(endQ);
  }, [overlayQ, startQ, endQ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setConflicts(null);
    if (!overlayId || !start || !end) {
      setError("Please provide overlay, start and end date/time.");
      return;
    }
    setLoading(true);
    try {
      const body = {
        overlay_id: Number(overlayId),
        start_ts: toISOFromLocal(start),
        end_ts: toISOFromLocal(end),
        participants: participants || undefined,
      };
      const res = await api.post("/bookings", body);
      setSuccess("Booking created successfully (id: " + res.data.id + ")");
      // keep form but provide link to view booking or list
    } catch (err: any) {
      // handle conflict (409) or other errors
      const detail = err?.response?.data?.detail;
      if (err?.response?.status === 409 && detail?.message === "booking_conflict") {
        setError("Booking conflict with existing bookings.");
        setConflicts(detail.conflicts ?? []);
      } else {
        setError(detail?.detail || detail?.message || err?.message || "Failed to create booking");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Create Booking</h3>
      <p className="hint">Reserve a selected room. Conflicts will be shown inline.</p>

      {error && <InlineAlert type="error">{error}</InlineAlert>}
      {success && <InlineAlert type="success">{success}</InlineAlert>}
      {conflicts && conflicts.length > 0 && (
        <InlineAlert type="error">
          <div><strong>Conflicting bookings:</strong></div>
          <ul style={{ marginTop: 8 }}>
            {conflicts.map((c: any) => (
              <li key={c.id} style={{ marginBottom: 6 }}>
                <div><strong>ID:</strong> {c.id} — organizer: {c.organizer_id ?? "—"}</div>
                <div className="hint">{c.start_ts} → {c.end_ts}</div>
              </li>
            ))}
          </ul>
        </InlineAlert>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: 10 }}>
        <div className="field">
          <label>Overlay / Room ID</label>
          <input value={overlayId} onChange={(e) => setOverlayId(e.target.value)} placeholder="Overlay id (e.g. 3)" />
        </div>

        <div className="field">
          <label>Start</label>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>

        <div className="field">
          <label>End</label>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>

        <div className="field">
          <label>Participants (optional)</label>
          <input value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="John, Jane, ..." />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Booking..." : "Create booking"}</button>
          <button type="button" className="btn btn-ghost" onClick={() => nav("/bookings")}>Back</button>
        </div>
      </form>
    </div>
  );
}