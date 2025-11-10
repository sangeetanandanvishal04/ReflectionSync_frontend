// src/pages/bookings/BookingList.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import InlineAlert from "../../components/InlineAlert";

type Booking = {
  id: number;
  overlay_id: number;
  start_ts: string;
  end_ts: string;
  participants?: string;
  organizer_id?: number;
  status?: string;
};

export default function BookingList() {
  const params = useParams<{ id?: string }>();
  const overlayFromRoute = params.id;
  const [overlayId, setOverlayId] = useState<string>(overlayFromRoute ?? "");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => { if (overlayFromRoute) setOverlayId(overlayFromRoute); }, [overlayFromRoute]);

  async function load() {
    setError(null);
    if (!overlayId) {
      setBookings([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/bookings/overlay/${overlayId}`);
      setBookings(res.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Bookings for overlay</h3>
      <div className="hint">Enter overlay (room) id to list bookings.</div>

      {error && <InlineAlert type="error">{error}</InlineAlert>}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input value={overlayId} onChange={(e) => setOverlayId(e.target.value)} placeholder="Overlay id (e.g. 3)" />
        <button className="btn btn-primary" onClick={load} disabled={loading}>{loading ? "Loading..." : "Load"}</button>
        <button className="btn btn-ghost" onClick={() => nav(`/bookings/create?overlay=${overlayId}`)}>Create booking</button>
      </div>

      <div style={{ marginTop: 12 }}>
        {bookings.length === 0 ? (
          <div className="hint">No bookings found for this overlay.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th style={{ padding: 8 }}>ID</th>
                <th style={{ padding: 8 }}>Start</th>
                <th style={{ padding: 8 }}>End</th>
                <th style={{ padding: 8 }}>Organizer</th>
                <th style={{ padding: 8 }}>Participants</th>
                <th style={{ padding: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td style={{ padding: 8 }}>{b.id}</td>
                  <td style={{ padding: 8 }}>{new Date(b.start_ts).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>{new Date(b.end_ts).toLocaleString()}</td>
                  <td style={{ padding: 8 }}>{b.organizer_id ?? "—"}</td>
                  <td style={{ padding: 8 }}>{b.participants ?? "—"}</td>
                  <td style={{ padding: 8 }}>{b.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}