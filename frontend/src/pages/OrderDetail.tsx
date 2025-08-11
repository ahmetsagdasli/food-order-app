import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

type Item = { name: string; price: number; qty: number };
type Payment = { status: "unpaid" | "paid" | "refunded" | "cancelled"; provider?: string; transactionId?: string };
type Order = {
  _id: string;
  status: string;
  payment: Payment;
  items: Item[];
  total: number;
  createdAt: string;
  cancelledAt?: string;
};

export default function OrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState<Order | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionErr, setActionErr] = useState("");

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.get(`/api/orders/${id}`);
      setData(data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const canCancel = data && !["cancelled", "delivered"].includes(data.status);

  const doCancel = async () => {
    if (!id) return;
    setActionErr("");
    try {
      await api.post(`/api/orders/${id}/cancel`);
      await load();
    } catch (e: any) {
      setActionErr(e?.response?.data?.error || "Cancel failed");
    }
  };

  if (loading) return <Container sx={{ mt: 4 }}><Typography>Loading…</Typography></Container>;
  if (err) return <Container sx={{ mt: 4 }}><Alert severity="error">{err}</Alert></Container>;
  if (!data) return null;

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">Order #{data._id.slice(-6)}</Typography>
          <Typography>Status: <b>{data.status}</b> · Payment: <b>{data.payment?.status}</b></Typography>
        </Box>

        {actionErr && <Alert severity="error" sx={{ mb: 2 }}>{actionErr}</Alert>}

        <Box sx={{ display: "grid", gap: 1, mb: 2 }}>
          {data.items.map((it, idx) => (
            <Box key={idx} sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>{it.name} × {it.qty}</Typography>
              <Typography>{(it.price * it.qty).toFixed(2)} ₺</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          <Typography variant="subtitle1"><b>Total</b></Typography>
          <Typography variant="subtitle1"><b>{data.total.toFixed(2)} ₺</b></Typography>
        </Box>

        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          {canCancel && (
            <Button color="error" variant="outlined" onClick={doCancel}>
              Cancel Order
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
