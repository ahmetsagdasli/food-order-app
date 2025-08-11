import { useEffect, useMemo, useRef, useState } from "react";
import api from "../utils/api";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import { useAuth } from "../context/AuthContext";

type Item = { name: string; price: number; qty: number; restaurantId: string };
type Order = { _id: string; status: string; items: Item[]; total: number; createdAt: string };

const statusColor: Record<string, "default" | "primary" | "warning" | "success" | "error"> = {
  pending: "default",
  accepted: "primary",
  preparing: "warning",
  delivered: "success",
  cancelled: "error",
};

export default function MerchantOrders() {
  const [list, setList] = useState<Order[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { auth } = useAuth();
  const token = auth?.token;
  const esRef = useRef<EventSource | null>(null);

  const load = async () => {
    setErr("");
    try {
      const { data } = await api.get("/api/merchant/orders");
      setList(data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Load failed");
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!token) return;
    const url = `${window.location.protocol}//${window.location.hostname}:5000/api/merchant/orders/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("order", () => load());
    es.addEventListener("ping", () => {});

    es.onerror = () => { /* otomatik reconnect'e bırak */ };
    return () => es.close();
  }, [token]);

  const updateStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await api.post(`/api/merchant/orders/${id}/status`, { status });
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const group = useMemo(() => {
    const pending = list.filter((o) => ["pending"].includes(o.status));
    const active  = list.filter((o) => ["accepted","preparing"].includes(o.status));
    const done    = list.filter((o) => ["delivered","cancelled"].includes(o.status));
    return { pending, active, done };
  }, [list]);

  const Section = ({ title, items }: { title: string; items: Order[] }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
      <Stack spacing={2}>
        {items.map((o) => (
          <Paper key={o._id} sx={{ p: 2 }}>
            <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:1 }}>
              <Typography variant="subtitle1">#{o._id.slice(-6)} · {new Date(o.createdAt).toLocaleTimeString()}</Typography>
              <Chip size="small" label={o.status} color={statusColor[o.status] || "default"} />
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display:"grid", gap:.5 }}>
              {o.items.map((it, i) => (
                <Typography key={i} variant="body2">{it.name} × {it.qty} — {(it.price * it.qty).toFixed(2)} ₺</Typography>
              ))}
            </Box>
            <Box sx={{ display:"flex", justifyContent:"space-between", mt: 1.5 }}>
              <Typography><b>Total:</b> {o.total.toFixed(2)} ₺</Typography>
              <Stack direction="row" spacing={1}>
                {o.status === "pending" && (
                  <Button size="small" variant="contained" onClick={() => updateStatus(o._id, "accepted")} disabled={busy === o._id}>Accept</Button>
                )}
                {o.status === "accepted" && (
                  <Button size="small" variant="contained" onClick={() => updateStatus(o._id, "preparing")} disabled={busy === o._id}>Preparing</Button>
                )}
                {o.status === "preparing" && (
                  <Button size="small" variant="contained" onClick={() => updateStatus(o._id, "delivered")} disabled={busy === o._id}>Delivered</Button>
                )}
                {["pending","accepted"].includes(o.status) && (
                  <Button size="small" color="error" variant="outlined" onClick={() => updateStatus(o._id, "cancelled")} disabled={busy === o._id}>Cancel</Button>
                )}
              </Stack>
            </Box>
          </Paper>
        ))}
      </Stack>
    </Box>
  );

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>Incoming Orders</Typography>
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Section title="New" items={group.pending} />
      <Section title="In Progress" items={group.active} />
      <Section title="Completed / Cancelled" items={group.done} />
    </Container>
  );
}
