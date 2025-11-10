// src/pages/bookings/BookingsPage.tsx
import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

type DemoRoom = {
  id: number;
  label: string;
  building?: string;
  floor_plan_id?: number;
  capacity: number;
  description?: string;
};

type BookingItem = {
  id: string | number;
  overlay_id: number | string;
  label: string;
  start_ts: string; // ISO
  end_ts: string; // ISO
};

const DEMO_ROOMS: DemoRoom[] = [
  {
    id: 101,
    label: "Conf B - South",
    building: "HQ",
    floor_plan_id: 2,
    capacity: 12,
    description: "Medium room with screen",
  },
  {
    id: 102,
    label: "Huddle 1",
    building: "HQ",
    floor_plan_id: 2,
    capacity: 4,
    description: "Small huddle room",
  },
  {
    id: 103,
    label: "Board Room",
    building: "HQ",
    floor_plan_id: 1,
    capacity: 20,
    description: "Large boardroom with video conferencing",
  },
];

function formatReadable(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function toISOWithZ(localDatetimeLocalValue: string) {
  // input value from <input type="datetime-local"> is like "2025-11-11T04:24"
  if (!localDatetimeLocalValue) return "";
  const d = new Date(localDatetimeLocalValue);
  return d.toISOString();
}

export default function BookingsPage() {
  const nav = useNavigate();

  const now = new Date();
  const defaultStart = new Date(now.getTime());
  const defaultEnd = new Date(now.getTime() + 60 * 60 * 1000); // +1 hour

  const [start, setStart] = useState<string>(() =>
    defaultStart.toISOString().slice(0, 16)
  ); // like "2025-11-11T04:24"
  const [end, setEnd] = useState<string>(() =>
    defaultEnd.toISOString().slice(0, 16)
  );
  const [capacity, setCapacity] = useState<number | "">("");
  const [available, setAvailable] = useState<DemoRoom[]>([]);
  const [myBookings, setMyBookings] = useState<BookingItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<{ type: "info" | "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    // clear messages after a while
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);

  async function onSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);

    // basic validation
    if (!start || !end) {
      setMessage({ type: "error", text: "Please provide both start and end date/time." });
      return;
    }
    const sISO = toISOWithZ(start);
    const eISO = toISOWithZ(end);
    if (new Date(sISO) >= new Date(eISO)) {
      setMessage({ type: "error", text: "Start must be before End." });
      return;
    }

    setSearching(true);
    setAvailable([]);

    // Try a real API call first (non-blocking). If it fails, fallback to demo local results.
    try {
      // Example API: /bookings/available?start=...&end=...&capacity=...
      // Many backends expect ISO with Z -> using sISO/eISO
      const q: any = { start: sISO, end: eISO };
      if (capacity !== "" && typeof capacity === "number") q.capacity = capacity;
      const res = await api.get("/bookings/available", { params: q });
      if (Array.isArray(res.data) && res.data.length >= 0) {
        // map server format to DemoRoom type (defensive)
        const mapped = res.data.map((r: any, idx: number) => ({
          id: r.id ?? idx,
          label: r.label ?? `Room ${r.id ?? idx}`,
          building: r.floor_plan_id ? String(r.floor_plan_id) : r.building,
          floor_plan_id: r.floor_plan_id ?? undefined,
          capacity: r.capacity ?? 0,
          description: r.props?.desc ?? "",
        })) as DemoRoom[];
        setAvailable(mapped);
        setMessage({ type: "success", text: `Found ${mapped.length} available room(s).` });
        setSearching(false);
        return;
      }
    } catch (err) {
      // backend might not be set up or returns 422; fallback to demo filtering
      // we'll continue to demo below
      console.warn("Bookings available API failed, falling back to demo:", err);
    }

    // Demo fallback: filter DEMO_ROOMS by requested capacity
    setTimeout(() => {
      const filtered = DEMO_ROOMS.filter((r) => (capacity === "" ? true : r.capacity >= (capacity as number)));
      setAvailable(filtered);
      setMessage({ type: "info", text: `Demo: showing ${filtered.length} room(s).` });
      setSearching(false);
    }, 300);
  }

  async function handleBook(room: DemoRoom) {
    setMessage(null);
    const sISO = toISOWithZ(start);
    const eISO = toISOWithZ(end);
    if (!sISO || !eISO) {
      setMessage({ type: "error", text: "Please set start and end times before booking." });
      return;
    }

    // optimistic local booking object
    const bookingLocal: BookingItem = {
      id: `local-${Date.now()}`,
      overlay_id: room.id,
      label: room.label,
      start_ts: sISO,
      end_ts: eISO,
    };

    // Try backend booking; if fails, fallback to local demo booking
    try {
      const payload = {
        overlay_id: Number(room.id),
        start_ts: sISO,
        end_ts: eISO,
        participants: 1,
      };
      const res = await api.post("/bookings", payload);
      // server returned created booking
      const created = res.data;
      const bk: BookingItem = {
        id: created.id ?? bookingLocal.id,
        overlay_id: created.overlay_id ?? room.id,
        label: created.label ?? room.label,
        start_ts: created.start_ts ?? sISO,
        end_ts: created.end_ts ?? eISO,
      };
      setMyBookings((b) => [bk, ...b]);
      setMessage({ type: "success", text: `Booked ${room.label} (server).` });
      return;
    } catch (err: any) {
      // If server responds with 409 booking_conflict, show conflict details
      if (err?.response?.status === 409 && err?.response?.data?.detail) {
        const det = err.response.data.detail;
        if (det.message === "booking_conflict") {
          setMessage({ type: "error", text: `Conflict: room already booked during requested time.` });
          return;
        }
      }
      // Otherwise fallback to local demo
      console.warn("Booking API failed, using booking:", err);
      setMyBookings((b) => [bookingLocal, ...b]);
      setMessage({ type: "info", text: `Booking created for ${room.label}.` });
    }
  }

  function handleOpenRoom(room: DemoRoom) {
    // If floor_plan_id known, open editor for that plan. Otherwise just navigate to floorplan list.
    if (room.floor_plan_id) {
      nav(`/editor/${room.floor_plan_id}`);
    } else {
      nav("/floorplans");
    }
  }

  function handleViewBooking(bk: BookingItem) {
    // simple details panel (we'll just set a message)
    setMessage({ type: "info", text: `${bk.label}: ${formatReadable(bk.start_ts)} → ${formatReadable(bk.end_ts)}` });
  }

  return (
    <div style={{ display: "flex", gap: 18 }}>
      <div style={{ flex: 1 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Search & Book Rooms</h3>

          <form onSubmit={onSearch} className="booking-search-form" style={{ marginTop: 6 }}>
            <div style={{ flex: "1 1 220px" }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>

            <div style={{ flex: "1 1 220px" }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>

            <div style={{ width: 120 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Min capacity</label>
              <input
                type="number"
                min={1}
                value={capacity as any}
                onChange={(e) => setCapacity(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 4"
              />
            </div>

            <div style={{ alignSelf: "center" }}>
              <button className="btn btn-primary search-btn" type="submit" disabled={searching}>
                {searching ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          <hr style={{ margin: "14px 0" }} />

          {message && (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                marginBottom: 12,
                background: message.type === "error" ? "#fff1f0" : message.type === "success" ? "#ecfdf5" : "#f0f9ff",
                color: message.type === "error" ? "#9b1c1c" : "#064e3b",
                border: message.type === "error" ? "1px solid rgba(239, 68, 68, 0.12)" : "1px solid rgba(14,165,233,0.08)",
              }}
            >
              {message.text}
            </div>
          )}

          <h4 style={{ margin: "8px 0 10px 0" }}>Available</h4>

          <div style={{ display: "grid", gap: 10 }}>
            {available.length === 0 ? (
              <div style={{ color: "#6b7280" }}>Click Search to find rooms.</div>
            ) : (
              available.map((r) => (
                <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: 12, borderRadius: 10, background: "#fff", boxShadow: "0 8px 20px rgba(19,24,33,0.04)" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 8, background: "#e6f3fb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#0369a1" }}>
                    {r.id}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{r.label}</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>{r.building ?? "—"} • capacity {r.capacity}</div>
                    {r.description && <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>{r.description}</div>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => handleBook(r)}>Book</button>
                    <button className="btn btn-ghost" onClick={() => handleOpenRoom(r)}>Open</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <aside style={{ width: 360 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Your bookings</h3>

          {myBookings.length === 0 ? (
            <div style={{ color: "#6b7280" }}>You have no bookings yet. Book a room from the list.</div>
          ) : (
            myBookings.map((bk) => (
              <div key={String(bk.id)} style={{ padding: 12, borderRadius: 10, background: "#fff", boxShadow: "0 8px 20px rgba(19,24,33,0.04)", marginBottom: 10 }}>
                <div style={{ fontWeight: 700 }}>{bk.label}</div>
                <div style={{ color: "#6b7280", fontSize: 13 }}>{formatReadable(bk.start_ts)} → {formatReadable(bk.end_ts)}</div>
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-ghost" onClick={() => handleViewBooking(bk)}>View</button>
                </div>
              </div>
            ))
          )}

          <hr style={{ margin: "12px 0" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => { setMyBookings([]); setMessage({ type: "info", text: "Cleared bookings." }); }}>Clear bookings</button>
            <button className="btn" onClick={() => { setAvailable(DEMO_ROOMS); setMessage({ type: "info", text: "rooms restored." }); }}>Reset rooms</button>
          </div>
        </div>
      </aside>
    </div>
  );
}