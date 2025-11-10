// src/pages/floorplans/FloorplanList.tsx
import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

type FP = {
  id: number;
  name?: string;
  building?: string;
  floor_number?: number;
  version?: number;
  created_at?: string;
};

export default function FloorplanList() {
  const [list, setList] = useState<FP[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/floorplans");
        if (!mounted) return;
        setList(res.data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load floorplans");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="card" style={{ width: "100%" }}>
      <h3 style={{ marginTop: 0 }}>Floorplans</h3>

      {loading ? (
        <div>Loading...</div>
      ) : list.length === 0 ? (
        <div>No floorplans uploaded yet. Click <strong>Upload Floorplan</strong> to add one.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Building</th>
              <th style={{ padding: 8 }}>Floor</th>
              <th style={{ padding: 8 }}>Version</th>
              <th style={{ padding: 8 }}>Uploaded</th>
              <th style={{ padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(fp => (
              <tr key={fp.id}>
                <td style={{ padding: 8 }}>{fp.name ?? "—"}</td>
                <td style={{ padding: 8 }}>{fp.building ?? "—"}</td>
                <td style={{ padding: 8 }}>{fp.floor_number ?? "—"}</td>
                <td style={{ padding: 8 }}>{fp.version ?? "—"}</td>
                <td style={{ padding: 8 }}>{fp.created_at ? new Date(fp.created_at).toLocaleString() : "—"}</td>
                <td style={{ padding: 8 }}>
                  <button className="btn btn-ghost" onClick={() => nav(`/editor/${fp.id}`)}>Open Editor</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}