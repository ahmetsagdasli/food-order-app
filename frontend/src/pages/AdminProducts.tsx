import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";
import type { Product } from "../types";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import ProductEditDialog from "../components/ProductEditDialog";
import type { ProductEditData } from "../components/ProductEditDialog";
import Chip from "@mui/material/Chip";

type Restaurant = { _id: string; name: string };

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [err, setErr] = useState("");

  // create form
  const [form, setForm] = useState({ name: "", price: "", category: "", imageUrl: "" });
  const [restId, setRestId] = useState<string>("");

  // list filters
  const [filterRestId, setFilterRestId] = useState<string>("");

  // edit dialog
  const [editing, setEditing] = useState<ProductEditData | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const loadRestaurants = async () => {
    const { data } = await api.get<Restaurant[]>("/api/restaurants"); // admin endpoint
    setRestaurants(data);
    // ilk seçimi otomatik doldur (create formu)
    if (!restId && data.length) setRestId(data[0]._id);
  };

  const loadProducts = async (rid?: string) => {
    const params: any = { limit: 100, sort: "createdAt:desc" };
    if (rid) params.restaurantId = rid;
    const { data } = await api.get("/api/products", { params });
    setItems(data.items);
  };

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadRestaurants(), loadProducts()]);
      } catch (e: any) {
        setErr(e?.response?.data?.error || "Load failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    setErr("");
    try {
      await api.post("/api/products", {
        name: form.name,
        price: Number(form.price),
        category: form.category || "general",
        imageUrl: form.imageUrl || "",
        restaurantId: restId, // <-- ÖNEMLİ
      });
      setForm({ name: "", price: "", category: "", imageUrl: "" });
      await loadProducts(filterRestId || undefined);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Create failed");
    }
  };

  const remove = async (id: string) => {
    setErr("");
    try {
      await api.delete(`/api/products/${id}`);
      await loadProducts(filterRestId || undefined);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Delete failed");
    }
  };

  // id/_id fallback
  const openEdit = (p: Product) => {
    const pid = (p as any)._id ?? (p as any).id;
    setEditing({
      _id: pid,
      name: p.name,
      price: p.price,
      category: (p as any).category,
      imageUrl: (p as any).imageUrl,
      description: (p as any).description,
      isAvailable: (p as any).isAvailable,
    });
    setEditOpen(true);
  };

  const handleSaved = async (_updated: ProductEditData) => {
    setEditOpen(false);
    setEditing(null);
    await loadProducts(filterRestId || undefined);
  };

  const filteredItems = useMemo(() => items, [items]);

  return (
    <Container sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>Admin · Products</Typography>
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {/* Filter bar */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 2, mb: 2 }}>
        <TextField
          select
          label="Filter by restaurant"
          value={filterRestId}
          onChange={async (e) => {
            const v = e.target.value;
            setFilterRestId(v);
            await loadProducts(v || undefined);
          }}
        >
          <MenuItem value=""><em>All restaurants</em></MenuItem>
          {restaurants.map(r => (
            <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" onClick={() => loadProducts(filterRestId || undefined)}>Refresh</Button>
      </Box>

      {/* Create form */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 2, mb: 2 }}>
        <TextField label="Name" value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} />
        <TextField label="Price" type="number" value={form.price} onChange={(e) => setForm(s => ({ ...s, price: e.target.value }))} />
        <TextField label="Category" value={form.category} onChange={(e) => setForm(s => ({ ...s, category: e.target.value }))} />
        <TextField label="Image URL" value={form.imageUrl} onChange={(e) => setForm(s => ({ ...s, imageUrl: e.target.value }))} />
        <TextField
          select
          label="Restaurant"
          value={restId}
          onChange={(e) => setRestId(e.target.value)}
        >
          {restaurants.map(r => (
            <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>
          ))}
        </TextField>
      </Box>
      <Button
        variant="contained"
        onClick={create}
        disabled={!form.name || !form.price || !restId}
      >
        Create Product
      </Button>

      {/* List */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {filteredItems.map((p: any) => {
          const key = p._id ?? p.id;
          return (
            <Grid item xs={12} md={6} lg={4} key={key}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{p.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(p.category || "—")} · {p.price} ₺ {p.isAvailable === false ? " · (unavailable)" : ""}
                  </Typography>
                  {filterRestId && (
                    <Box sx={{ mt: 1 }}>
                      <Chip size="small" label={`rid: ${filterRestId.substring(0,6)}…`} />
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => openEdit(p)}>Edit</Button>
                  <Button size="small" color="error" onClick={() => remove(key)}>Delete</Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <ProductEditDialog
        open={editOpen}
        product={editing}
        onClose={() => { setEditOpen(false); setEditing(null); }}
        onSaved={handleSaved}
      />
    </Container>
  );
}
