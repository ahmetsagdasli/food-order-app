import { useEffect, useState } from "react";
import api from "../utils/api";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";

type Rest = { _id?: string; name: string; isApproved: boolean; lat?: number | null; lng?: number | null; address?: string };

export default function MerchantRestaurant() {
  const [rest, setRest] = useState<Rest | null>(null);
  const [form, setForm] = useState<Rest>({ name: "", isApproved: false, lat: null, lng: null, address: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const load = async () => {
    setErr(""); setOk("");
    try {
      const { data } = await api.get<Rest>("/api/restaurants/me");
      setRest(data);
      setForm({
        name: data.name || "",
        isApproved: !!data.isApproved,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        address: data.address || "",
      });
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setRest(null);
      } else {
        setErr(e?.response?.data?.error || "Load failed");
      }
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setErr(""); setOk("");
    try {
      const { data } = await api.post("/api/restaurants/me", { name: form.name, address: form.address, lat: form.lat, lng: form.lng });
      setRest(data);
      setOk("Restaurant created. Pending admin approval.");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Create failed");
    }
  };

  const update = async () => {
    setErr(""); setOk("");
    try {
      const { data } = await api.patch("/api/restaurants/me", { name: form.name, address: form.address, lat: form.lat, lng: form.lng });
      setRest(data);
      setOk("Saved.");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Save failed");
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((s) => ({ ...s, lat: Number(pos.coords.latitude.toFixed(6)), lng: Number(pos.coords.longitude.toFixed(6)) }));
      },
      () => {}
    );
  };

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>My Restaurant</Typography>
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}

      <Paper sx={{ p: 3, display: "grid", gap: 2, maxWidth: 640 }}>
        <TextField label="Restaurant Name" value={form.name} onChange={(e)=>setForm(s=>({...s, name: e.target.value}))} />
        <TextField label="Address" value={form.address} onChange={(e)=>setForm(s=>({...s, address: e.target.value}))} />

        <Stack direction="row" spacing={2}>
          <TextField
            label="Latitude"
            type="number"
            value={form.lat ?? ""}
            onChange={(e)=>setForm(s=>({...s, lat: e.target.value === "" ? null : Number(e.target.value)}))}
          />
          <TextField
            label="Longitude"
            type="number"
            value={form.lng ?? ""}
            onChange={(e)=>setForm(s=>({...s, lng: e.target.value === "" ? null : Number(e.target.value)}))}
          />
          <Button onClick={useMyLocation}>Use my location</Button>
        </Stack>

        {!rest ? (
          <Button variant="contained" onClick={create} disabled={!form.name}>Create</Button>
        ) : (
          <Button variant="contained" onClick={update} disabled={!form.name}>Save</Button>
        )}
      </Paper>
    </Container>
  );
}
