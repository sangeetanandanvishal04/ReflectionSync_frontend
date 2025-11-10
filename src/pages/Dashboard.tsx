// src/pages/Dashboard.tsx
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const auth = useAuth();
  const nav = useNavigate();

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Welcome</h2>
      <p className="hint">You're logged in{auth.user?.email ? ` as ${auth.user.email}` : ""}.</p>

      <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
        <button className="btn btn-primary" onClick={() => nav("/upload")}>Upload Floorplan</button>
        <button className="btn btn-ghost" onClick={() => nav("/floorplans")}>Floorplans List</button>
        <button className="btn btn-ghost" onClick={() => nav("/bookings")}>Bookings</button>
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={() => auth.logout()}>Logout</button>
      </div>
    </div>
  );
}