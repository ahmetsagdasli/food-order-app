import { useEffect, useState } from "react";
import api from "../utils/api";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import ProductEditDialog from "../components/ProductEditDialog";
import type { ProductEditData } from "../components/ProductEditDialog";

type Product = { _id: string; name: string; price: number; category?: string; imageUrl?: string; description?: string; isAvailable?: boolean };
type Rest = { _id: string; name: string; isApproved: boolean };

export default function MerchantMenu() {
  const [items, setItems] = useState<Product[]>([]);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ name: "", price: "", category: "", imageUrl: "" });
  const [rest, setRest] = useState<Rest | null>(null);

  const [editing, setEditing] = useState<ProductEditData | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    setErr("");
    try {
      const r = await api.get<Rest>("/api/restaurants/me").catch(() => ({ data: null as any }));
      setRest(r.data);
      const { data } = await api.get<{ items: Product[] }>("/api/products", { params: { limit: 100, sort: "createdAt:desc", mine: true } });
      setItems(data.items);
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Load failed");
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setErr("");
    try {
      await api.post("/api/products", {
        name: form.name,
        price: Number(form.price),
        category: form.category || "general",
        imageUrl: form.imageUrl || "",
      });
      setForm({ name: "", price: "", category: "", imageUrl: "" });
      await load();
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Create failed");
    }
  };

  const remove = async (id: string) => {
    setErr("");
    try {
      await api.delete(`/api/products/${id}`);
      setItems(prev => prev.filter(x => x._id !== id));
    } catch (e:any) {
      setErr(e?.response?.data?.error || "Delete failed");
    }
  };

  const openEdit = (p: Product) => {
    setEditing({
      _id: p._id,
      name: p.name,
      price: p.price,
      category: p.category,
      imageUrl: p.imageUrl,
      description: p.description,
      isAvailable: p.isAvailable,
    });
    setEditOpen(true);
  };

  const handleSaved = (updated: ProductEditData) => {
    setItems(prev => prev.map(it => it._id === updated._id ? { ...it, ...updated } : it));
    setEditOpen(false);
    setEditing(null);
  };

  const approved = !!rest?.isApproved;

  return (
    <Container sx={{ mt:3 }}>
      <Box sx={{ display:"flex", alignItems:"center", gap:2, mb:2 }}>
        <Typography variant="h5" sx={{ flex:1 }}>My Menu</Typography>
        {rest ? (
          <Chip label={approved ? "Approved" : "Pending approval"} color={approved ? "success" : "warning"} />
        ) : (
          <Chip label="No restaurant" color="default" />
        )}
      </Box>

      {!rest && (
        <Alert severity="info" sx={{ mb:2 }}>
          You don't have a restaurant yet. Go to <b>My Restaurant</b> and create one. After admin approval, you can add items.
        </Alert>
      )}

      {err && <Alert severity="error" sx={{ mb:2 }}>{err}</Alert>}

      <Box sx={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:2, mb:2 }}>
        <TextField label="Name" value={form.name} onChange={e=>setForm(s=>({...s,name:e.target.value}))} />
        <TextField label="Price" type="number" value={form.price} onChange={e=>setForm(s=>({...s,price:e.target.value}))} />
        <TextField label="Category" value={form.category} onChange={e=>setForm(s=>({...s,category:e.target.value}))} />
        <TextField label="Image URL" value={form.imageUrl} onChange={e=>setForm(s=>({...s,imageUrl:e.target.value}))} />
      </Box>
      <Button variant="contained" onClick={create} disabled={!approved || !form.name || !form.price}>
        Create Product
      </Button>

      <Grid container spacing={2} sx={{ mt:1 }}>
        {items.map(p=>(
          <Grid item xs={12} md={6} lg={4} key={p._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{p.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {(p.category || "—")} · {p.price} ₺ {p.isAvailable === false ? " · (unavailable)" : ""}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={()=>openEdit(p)}>Edit</Button>
                <Button size="small" color="error" onClick={()=>remove(p._id)}>Delete</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <ProductEditDialog
        open={editOpen}
        product={editing}
        onClose={()=>{ setEditOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />
    </Container>
  );
}
