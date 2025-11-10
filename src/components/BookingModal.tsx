// src/components/BookingModal.tsx
import { useState } from "react";

type Room = {
  id: string;
  name: string;
  capacity: number;
  building?: string;
  floor?: number;
};

type Props = {
  room: Room;
  initialStart?: string;
  initialEnd?: string;
  onClose: () => void;
  onConfirm: (payload: { roomId: string; start: string; end: string; participants?: number }) => boolean | Promise<boolean>;
};

export default function BookingModal({ room, initialStart = "", initialEnd = "", onClose, onConfirm }: Props) {
  const [start, setStart] = useState<string>(initialStart);
  const [end, setEnd] = useState<string>(initialEnd);
  const [participants, setParticipants] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doConfirm() {
    setError(null);
    if (!start || !end) {
      setError("Start and end times are required");
      return;
    }
    if (end <= start) {
      setError("End must be later than start");
      return;
    }
    setBusy(true);
    try {
      const ok = await onConfirm({ roomId: room.id, start, end, participants: participants === "" ? undefined : Number(participants) });
      if (!ok) {
        // onConfirm returns false on conflict in demo
        setError("Could not create booking (demo conflict).");
        setBusy(false);
        return;
      }
      // success
      setBusy(false);
    } catch (err: any) {
      setError(err?.message || "Booking failed");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>Book: {room.name}</h4>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, color: "#6b7280" }}>{room.building} • floor {room.floor} • capacity {room.capacity}</div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", fontSize: 13 }}>Start</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>

          <div style={{ marginTop: 8 }}>
            <label style={{ display: "block", fontSize: 13 }}>End</label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>

          <div style={{ marginTop: 8 }}>
            <label style={{ display: "block", fontSize: 13 }}>Participants</label>
            <input type="number" min={1} value={participants as any} onChange={(e) => setParticipants(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>

          {error && <div style={{ marginTop: 10, color: "#b91c1c" }}>{error}</div>}
        </div>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={doConfirm} disabled={busy}>{busy ? "Booking…" : "Confirm booking"}</button>
        </div>
      </div>
    </div>
  );
}