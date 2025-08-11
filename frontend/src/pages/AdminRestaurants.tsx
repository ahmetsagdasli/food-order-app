import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

type Owner = { name: string; email: string; role: string };
type Restaurant = {
  _id: string;
  name: string;
  isApproved: boolean;
  phone?: string;
  owner?: Owner;
  address?: { line1?: string; city?: string; district?: string; postalCode?: string };
  createdAt?: string;
};

export default function AdminRestaurants() {
  const [rows, setRows] = useState<Restaurant[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      const { data } = await api.get<Restaurant[]>("/api/restaurants");
      setRows(data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Load failed");
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      r.name?.toLowerCase().includes(s) ||
      r.owner?.name?.toLowerCase().includes(s) ||
      r.owner?.email?.toLowerCase().includes(s)
    );
  }, [rows, q]);

  const approve = async (id: string, v: boolean) => {
    setErr("");
    try {
      await api.patch(`/api/restaurants/${id}/approve`, { isApproved: v });
      await load();
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Update failed");
    }
  };

  return (
    <Container sx={{ mt:3 }}>
      <Typography variant="h5" gutterBottom>Admin · Restaurants</Typography>
      {err && <Alert severity="error" sx={{ mb:2 }}>{err}</Alert>}

      <Box sx={{ display:"flex", gap:2, mb:2 }}>
        <TextField
          placeholder="Filter by name/owner/email…"
          value={q}
          onChange={e=>setQ(e.target.value)}
          sx={{ flex:1 }}
        />
        <Button variant="outlined" onClick={load}>Refresh</Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(r => (
              <TableRow key={r._id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.owner ? `${r.owner.name} · ${r.owner.email}` : "—"}</TableCell>
                <TableCell>{r.phone || "—"}</TableCell>
                <TableCell>
                  {[r.address?.line1, r.address?.district, r.address?.city, r.address?.postalCode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </TableCell>
                <TableCell>
                  <Chip label={r.isApproved ? "Approved" : "Pending"} color={r.isApproved ? "success" : "warning"} />
                </TableCell>
                <TableCell align="right">
                  {r.isApproved ? (
                    <Button size="small" onClick={()=>approve(r._id, false)}>Unapprove</Button>
                  ) : (
                    <Button size="small" variant="contained" onClick={()=>approve(r._id, true)}>Approve</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" style={{ padding: 24 }}>No restaurants</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
