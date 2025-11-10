// src/pages/floorplans/Editor.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as fabricNamespace from "fabric";
import api from "../../api/axios";
import { v4 as uuidv4 } from "uuid";

const fabric: any = (fabricNamespace as any).fabric ?? (fabricNamespace as any);

type Overlay = {
  id?: number | string;
  type: string;
  label?: string;
  capacity?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  props?: Record<string, any>;
};

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const canvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [headerTop, setHeaderTop] = useState<number>(72);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientVersion, setClientVersion] = useState<number>(0);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [metaLabel, setMetaLabel] = useState("");
  const [metaCapacity, setMetaCapacity] = useState<number | "">("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // compute header height so overlay sits beneath header
  useEffect(() => {
    const header = document.querySelector(".header") as HTMLElement | null;
    setHeaderTop(header?.clientHeight ? header.clientHeight : 72);
  }, []);

  // init canvas once
  useEffect(() => {
    try {
      const c = new fabric.Canvas("fp-canvas", {
        selection: true,
        preserveObjectStacking: true,
      });
      canvasRef.current = c;

      c.on("selection:created", onSelectionChanged);
      c.on("selection:updated", onSelectionChanged);
      c.on("selection:cleared", () => {
        setSelectedId(null);
        setMetaLabel("");
        setMetaCapacity("");
      });

      c.on("object:modified", () => {
        const obj = c.getActiveObject();
        if (obj) {
          const idv = (obj as any).overlayId;
          setSelectedId(idv ?? null);
          setMetaLabel((obj as any).label ?? "");
          setMetaCapacity((obj as any).capacity ?? "");
        }
      });
    } catch (e: any) {
      console.error("Canvas init failed", e);
      setError("Failed to initialize editor.");
    }

    return () => {
      try {
        const c = canvasRef.current;
        if (c) {
          c.dispose();
          canvasRef.current = null;
        }
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSelectionChanged() {
    try {
      const c = canvasRef.current;
      if (!c) return;
      const obj = c.getActiveObject();
      if (!obj) {
        setSelectedId(null);
        setMetaLabel("");
        setMetaCapacity("");
        return;
      }
      const idv = (obj as any).overlayId;
      setSelectedId(idv ?? null);
      setMetaLabel((obj as any).label ?? "");
      setMetaCapacity((obj as any).capacity ?? "");
    } catch (err) {
      console.warn("selection error", err);
    }
  }

  // Load floorplan metadata + overlays
  useEffect(() => {
    if (!id) {
      setError("Floorplan id missing");
      setLoading(false);
      return;
    }
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/floorplans/${id}`);
        const fp = res.data;
        if (!mounted) return;
        let imgPath = fp?.image_path ?? null;
        if (imgPath && typeof imgPath === "string" && imgPath.startsWith("/")) {
          const base = api.defaults.baseURL?.replace(/\/$/, "") ?? "";
          imgPath = base + imgPath;
        }
        setImageUrl(imgPath);
        setClientVersion(fp?.version ?? 1);

        try {
          const ovRes = await api.get(`/floorplans/${id}/overlays`);
          if (!mounted) return;
          setOverlays(ovRes.data?.overlays ?? []);
        } catch {
          try {
            const vRes = await api.get(`/floorplans/${id}/versions`);
            if (!mounted) return;
            const vs = vRes.data;
            if (Array.isArray(vs) && vs.length > 0) {
              const latest = vs[0];
              const ch = latest?.changes?.overlays ?? [];
              setOverlays(ch);
            } else {
              setOverlays([]);
            }
          } catch {
            setOverlays([]);
          }
        }
      } catch (err: any) {
        console.error("Failed to load floorplan", err);
        setError("Failed to load floorplan. Check console for details.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  // Once imageUrl or overlays change -> draw background + overlays
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    try {
      c.getObjects().forEach((obj: any) => c.remove(obj));
    } catch {}

    if (!imageUrl) {
      c.clear();
      return;
    }

    (fabric.Image as any).fromURL(imageUrl, (img: any) => {
      try {
        const containerWidth = containerRef.current?.clientWidth ?? 1100;
        const imgWidth = img.width ?? 1000;
        const scale = Math.min(1, containerWidth / imgWidth);
        const w = Math.round(imgWidth * scale);
        const h = Math.round((img.height ?? 800) * scale);

        c.setDimensions({ width: w, height: h });

        (c as any).setBackgroundImage(img, c.renderAll.bind(c), {
          originX: "left",
          originY: "top",
          scaleX: scale,
          scaleY: scale,
        });

        overlays.forEach((ov) => {
          const left = Math.round((ov.x ?? 0) * scale);
          const top = Math.round((ov.y ?? 0) * scale);
          const width = Math.round((ov.width ?? 0) * scale);
          const height = Math.round((ov.height ?? 0) * scale);

          const opts: any = {
            left,
            top,
            width,
            height,
            fill: ov.type === "seat" ? "rgba(0,128,0,0.15)" : "rgba(255,255,255,0.06)",
            stroke: "#333",
            strokeWidth: 1,
            selectable: true,
          };

          const rect = new fabric.Rect(opts);
          rect.set("overlayId", ov.id ?? uuidv4());
          rect.set("overlayType", ov.type ?? "room");
          rect.set("label", ov.label ?? "");
          rect.set("capacity", ov.capacity ?? undefined);
          rect.set("props", ov.props ?? {});
          c.add(rect);
        });

        c.requestRenderAll();
      } catch (err) {
        console.error("Error drawing image/overlays:", err);
        setError("Failed to render floorplan image.");
      }
    }, { crossOrigin: "anonymous" } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl, overlays]);

  // helpers
  function addRoom() {
    const c = canvasRef.current;
    if (!c) return;
    const rect = new fabric.Rect({
      left: 30,
      top: 30,
      width: 140,
      height: 90,
      fill: "rgba(255,255,255,0.06)",
      stroke: "#e6e6e6",
      strokeWidth: 1,
      selectable: true,
    });
    rect.set("overlayId", uuidv4());
    rect.set("overlayType", "room");
    rect.set("label", "");
    rect.set("capacity", undefined);
    (rect as any).hasControls = true;
    c.add(rect);
    c.setActiveObject(rect);
    c.requestRenderAll();
    onSelectionChanged();
  }

  function addSeat() {
    const c = canvasRef.current;
    if (!c) return;
    const size = 24;
    const rect = new fabric.Rect({
      left: 30,
      top: 30,
      width: size,
      height: size,
      fill: "rgba(0,128,0,0.15)",
      stroke: "#0b6623",
      strokeWidth: 1,
      selectable: true,
    });
    rect.set("overlayId", uuidv4());
    rect.set("overlayType", "seat");
    rect.set("label", "");
    rect.set("capacity", 1);
    c.add(rect);
    c.setActiveObject(rect);
    c.requestRenderAll();
    onSelectionChanged();
  }

  function deleteSelected() {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (!obj) {
      alert("Select an object first");
      return;
    }
    c.remove(obj);
    setSelectedId(null);
    setMetaLabel("");
    setMetaCapacity("");
    c.requestRenderAll();
  }

  function exportOverlays(): Overlay[] {
    const c = canvasRef.current!;
    if (!c || !imageUrl) return [];
    const bg = (c as any).backgroundImage as any | undefined;
    const scaleX = bg?.scaleX ?? 1;
    const objs = c.getObjects().filter((o: any) => !(o instanceof fabric.Image));
    const exported: Overlay[] = objs.map((o: any) => {
      const left = (o.left ?? 0) / (scaleX || 1);
      const top = (o.top ?? 0) / (scaleX || 1);
      const width = (typeof o.getScaledWidth === "function" ? o.getScaledWidth() : (o.width ?? 0)) / (scaleX || 1);
      const height = (typeof o.getScaledHeight === "function" ? o.getScaledHeight() : (o.height ?? 0)) / (scaleX || 1);
      return {
        id: o.overlayId,
        type: o.overlayType || "room",
        label: o.label || undefined,
        capacity: o.capacity ?? undefined,
        x: Math.round(left),
        y: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
        props: o.props || {},
      } as Overlay;
    });
    return exported;
  }

  async function saveOverlays() {
    if (!id) return;
    try {
      const payload = {
        floor_plan_id: Number(id),
        client_version: clientVersion,
        overlays: exportOverlays(),
      };
      const res = await api.put(`/floorplans/${id}/save`, payload);
      const newVer = res.data?.new_version;
      if (typeof newVer === "number") {
        setClientVersion(newVer);
      }
      alert("Saved overlays (v" + (newVer ?? clientVersion) + ")");
    } catch (err: any) {
      console.error("Save failed", err);
      if (err.response?.status === 409 && err.response?.data?.message === "version_mismatch") {
        const serverVersion = err.response.data.server_version;
        const serverOverlays = err.response.data.server_overlays;
        if (confirm(`Version mismatch (server v${serverVersion}). Reload server overlays? OK to reload`)) {
          setClientVersion(serverVersion);
          const mapped: Overlay[] = (serverOverlays || []).map((o: any) => ({
            id: o.id,
            type: o.type,
            label: o.label,
            capacity: o.capacity,
            x: o.x,
            y: o.y,
            width: o.width,
            height: o.height,
            props: o.props || {},
          }));
          setOverlays(mapped);
          alert("Reloaded server overlays.");
        } else {
          alert("Save aborted.");
        }
      } else {
        alert("Save failed: " + (err?.message ?? "Unknown error"));
      }
    }
  }

  function exportJSON() {
    const data = exportOverlays();
    const pretty = JSON.stringify(data, null, 2);
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<pre>${pretty}</pre>`);
      w.document.title = "Overlays JSON";
    } else {
      alert(pretty);
    }
  }

  function applyMetadataToSelected() {
    const c = canvasRef.current;
    if (!c) return;
    const obj = c.getActiveObject();
    if (!obj) {
      alert("Select an object first.");
      return;
    }
    (obj as any).label = metaLabel;
    (obj as any).capacity = metaCapacity === "" ? undefined : Number(metaCapacity);
    (obj as any).props = (obj as any).props ?? {};
    c.requestRenderAll();
  }

  function zoomIn() {
    const c = canvasRef.current; if (!c) return;
    c.setZoom((c.getZoom() || 1) * 1.2);
  }
  function zoomOut() {
    const c = canvasRef.current; if (!c) return;
    c.setZoom((c.getZoom() || 1) / 1.2);
  }
  function fitToScreen() {
    const c = canvasRef.current; if (!c) return;
    const containerW = containerRef.current?.clientWidth ?? 900;
    const bg = (c as any).backgroundImage as any | undefined;
    if (!bg) return;
    const imgW = bg.width ?? 1;
    const scale = Math.min(1, containerW / (imgW * (bg.scaleX ?? 1)));
    c.setZoom(scale);
  }

  if (loading) {
    return <div className="card">Loading editor...</div>;
  }
  if (error) {
    return <div className="card"><h3>Editor</h3><div style={{ color: "red" }}>{error}</div></div>;
  }

  // layout: full-screen editor area under headerTop
  return (
    <div
      style={{
        position: "fixed",
        top: headerTop,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#f3f6f9",
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => nav("/floorplans")}>⟵ Back</button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Floorplan Editor</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Floorplan: {id} — Version: {clientVersion}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={exportJSON}>Export JSON</button>
          <button className="btn btn-primary" onClick={saveOverlays}>Save</button>
        </div>
      </div>

      {/* Main content area */}
      <div style={{ display: "flex", flex: 1, gap: 12, padding: 18 }}>
        {/* Canvas panel (black) */}
        <div ref={containerRef} style={{ flex: 1, background: "#000", borderRadius: 8, padding: 14, display: "flex", justifyContent: "center", alignItems: "center", overflow: "auto" }}>
          {/* canvas element: give it an inline style so it fills available inner size */}
          <canvas id="fp-canvas" style={{ display: "block", background: "#000" }} />
        </div>

        {/* Right sidebar */}
        <aside style={{ width: 360 }}>
          <div className="card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Tools</h3>

            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <button className="btn" onClick={addRoom}>Add Room</button>
              <button className="btn" onClick={addSeat}>Add Seat</button>
              <button className="btn" onClick={deleteSelected}>Delete</button>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" onClick={zoomOut}>−</button>
                <button className="btn btn-ghost" onClick={fitToScreen}>Fit</button>
                <button className="btn btn-ghost" onClick={zoomIn}>+</button>
              </div>
            </div>

            <hr style={{ margin: "12px 0" }} />

            <div>
              <h4 style={{ margin: "8px 0" }}>Selected overlay</h4>
              {selectedId ? (
                <>
                  <div style={{ marginBottom: 8 }}><strong>ID:</strong> {String(selectedId)}</div>
                  <div className="field">
                    <label>Label</label>
                    <input value={metaLabel} onChange={(e) => setMetaLabel(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Capacity</label>
                    <input type="number" value={metaCapacity as any} onChange={(e) => setMetaCapacity(e.target.value === "" ? "" : Number(e.target.value))} />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button className="btn btn-primary" onClick={applyMetadataToSelected}>Apply</button>
                  </div>
                </>
              ) : (
                <div style={{ color: "#6b7280" }}>No overlay selected. Click a shape on the canvas.</div>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn btn-ghost" onClick={() => nav("/floorplans")}>Back to list</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}