// src/pages/Dashboard.tsx
import { useAuth } from "../context/AuthProvider";

export default function Dashboard() {
  const auth = useAuth();

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Welcome</h2>
      <p className="hint">You're logged in{auth.user?.email ? ` as ${auth.user.email}` : ""}.</p>

      <div style={{ marginTop: 18 }}>
        <button className="btn btn-ghost" onClick={() => auth.logout()}>Logout</button>
      </div>

      <div style={{ marginTop: 18 }}>
        <strong>Token (stored):</strong>
        <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8, overflowX: "auto" }}>{auth.token ?? "—"}</pre>
      </div>
    </div>
  );
}
