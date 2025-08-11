import { useEffect, useState } from "react";
import api from "../utils/api";
import type { Order } from "../types";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";

const STATUSES = ["pending","preparing","on_the_way","delivered","cancelled"];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<string>("");
  const nav = useNavigate();

  const load = async () => {
    const { data } = await api.get<{items: Order[]}>("/api/orders", { params: { status: status || undefined, limit: 50 } });
    setOrders(data.items);
  };

  useEffect(() => { load(); }, [status]);

  const update = async (id: string, s: string) => {
    await api.patch(`/api/orders/${id}/status`, { status: s });
    await load();
  };

  return (
    <Container sx={{ mt:3 }}>
      <Typography variant="h5" gutterBottom>Admin · Orders</Typography>

      <Box sx={{ display:"flex", gap:2, mb:2 }}>
        <Select size="small" value={status} onChange={(e)=>setStatus(e.target.value)} displayEmpty>
          <MenuItem value="">All</MenuItem>
          {STATUSES.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}
        </Select>
        <Button variant="outlined" onClick={load}>Refresh</Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map(o=>(
              <TableRow key={o._id}>
                <TableCell>…{o._id.slice(-6)}</TableCell>
                <TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell>
                <TableCell>{o.items.length}</TableCell>
                <TableCell>{o.totalAmount.toFixed(2)} ₺</TableCell>
                <TableCell><Chip label={o.status}/></TableCell>
                <TableCell>
                  <Select size="small" value={o.status} onChange={(e)=>update(o._id, e.target.value)}>
                    {STATUSES.map(s=><MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                  <Button sx={{ ml:1 }} size="small" onClick={()=>nav(`/orders/${o._id}`)}>Details</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
