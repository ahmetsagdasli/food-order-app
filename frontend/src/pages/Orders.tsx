import { useEffect, useState } from "react";
import api from "../utils/api";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import { Link as RouterLink } from "react-router-dom";

type Item = { name: string; price: number; qty: number };
type Order = {
  _id: string;
  status: string;
  total: number;
  payment?: { status?: string };
  items: Item[];
  createdAt: string;
};

export default function Orders() {
  const [list, setList] = useState<Order[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setErr("");
    try {
      const { data } = await api.get("/api/orders");
      setList(data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Load failed");
    }
  };

  useEffect(() => { load(); }, []);

  const canCancel = (o: Order) => !["cancelled", "delivered"].includes(o.status);

  const cancel = async (id: string) => {
    setBusy(id);
    try {
      await api.post(`/api/orders/${id}/cancel`);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Cancel failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>My Orders</Typography>
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {!list.length ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Siparişiniz yok.</Typography>
          <Button sx={{ mt: 2 }} variant="contained" component={RouterLink} to="/products">
            Ürünlere git
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {list.map((o) => (
            <Paper key={o._id} sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                <Typography variant="subtitle1">
                  #{o._id.slice(-6)} · {new Date(o.createdAt).toLocaleString()}
                </Typography>
                <Typography>
                  Status: <b>{o.status}</b> · Payment: <b>{o.payment?.status || "unpaid"}</b> · Total: <b>{o.total.toFixed(2)} ₺</b>
                </Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: "grid", gap: .5 }}>
                {o.items.map((it, i) => (
                  <Typography key={i} variant="body2">
                    {it.name} × {it.qty} — {(it.price * it.qty).toFixed(2)} ₺
                  </Typography>
                ))}
              </Box>

              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                <Button size="small" component={RouterLink} to={`/orders/${o._id}`}>Detay</Button>
                {canCancel(o) && (
                  <Button size="small" color="error" variant="outlined" onClick={() => cancel(o._id)} disabled={busy === o._id}>
                    {busy === o._id ? "İptal ediliyor…" : "İptal Et"}
                  </Button>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
}
