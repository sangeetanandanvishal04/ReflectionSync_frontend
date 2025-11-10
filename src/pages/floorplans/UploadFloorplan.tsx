// src/pages/floorplans/UploadFloorplan.tsx
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import api from "../../api/axios";

type Form = {
  name?: string;
  building?: string;
  floor_number?: number;
  pixels_per_meter?: number;
};

export default function UploadFloorplan() {
  const { register, handleSubmit } = useForm<Form>();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onSubmit(values: Form) {
    const files = fileRef.current?.files;
    if (!files || files.length === 0) {
      alert("Please choose a floorplan file to upload.");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      if (values.name) fd.append("name", values.name);
      if (values.building) fd.append("building", values.building);
      if (values.floor_number !== undefined && values.floor_number !== null) fd.append("floor_number", String(values.floor_number));
      if (values.pixels_per_meter !== undefined && values.pixels_per_meter !== null) fd.append("pixels_per_meter", String(values.pixels_per_meter));

      const res = await api.post("/floorplans", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const created = res.data;
      if (!created?.id) {
        // defensive fallback — log server response for debugging
        console.error("Upload response missing id:", res);
        alert("Upload succeeded but response missing id. Check server logs.");
        setLoading(false);
        return;
      }

      // normalize relative image_path to absolute if needed
      const base = api.defaults.baseURL?.replace(/\/$/, "") ?? "";
      if (created.image_path && typeof created.image_path === "string" && created.image_path.startsWith("/")) {
        created.image_path = base + created.image_path;
      }

      // navigate to editor for the uploaded floorplan
      nav(`/editor/${created.id}`);
    } catch (err: any) {
      // show helpful message; log the whole error for debugging
      console.error("Upload failed:", err);
      const serverMsg = err?.response?.data ?? err?.message ?? String(err);
      alert("Upload failed: " + (serverMsg.detail || serverMsg.message || JSON.stringify(serverMsg)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 700 }}>
      <h3 style={{ marginTop: 0 }}>Upload Floorplan</h3>
      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: 12 }}>
        <div className="field">
          <label>File</label>
          {/* use ref to reliably read files on submit */}
          <input ref={fileRef} type="file" accept="image/*,application/pdf" />
        </div>

        <div className="field">
          <label>Name</label>
          <input {...register("name")} placeholder="Floorplan name (optional)" />
        </div>

        <div className="field">
          <label>Building</label>
          <input {...register("building")} placeholder="Building (optional)" />
        </div>

        <div className="field">
          <label>Floor number</label>
          <input type="number" {...register("floor_number", { valueAsNumber: true })} />
        </div>

        <div className="field">
          <label>Pixels per meter</label>
          <input type="number" step="0.1" {...register("pixels_per_meter", { valueAsNumber: true })} />
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}