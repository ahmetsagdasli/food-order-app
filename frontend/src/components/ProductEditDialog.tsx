import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import api from "../utils/api";

export type ProductEditData = {
  _id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  description?: string;
  isAvailable?: boolean;
};

export default function ProductEditDialog({
  open,
  onClose,
  product,
  onSaved,
}: {
  open: boolean;
  product: ProductEditData | null;
  onClose: () => void;
  onSaved: (updated: ProductEditData) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    imageUrl: "",
    description: "",
    isAvailable: true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!product) return;
    setErr("");
    setForm({
      name: product.name || "",
      price: String(product.price ?? ""),
      category: product.category || "",
      imageUrl: product.imageUrl || "",
      description: product.description || "",
      isAvailable: product.isAvailable ?? true,
    });
  }, [product]);

  const handleSave = async () => {
    if (!product?._id) return;
    setErr("");
    const priceNum = Number(form.price);
    if (!form.name.trim()) return setErr("Name is required");
    if (Number.isNaN(priceNum) || priceNum < 0) return setErr("Price must be a non-negative number");

    try {
      setSaving(true);
      const payload: any = {
        name: form.name.trim(),
        price: priceNum,
        category: form.category || "general",
        imageUrl: form.imageUrl || "",
        description: form.description || "",
        isAvailable: !!form.isAvailable,
      };
      const { data } = await api.put(`/api/products/${product._id}`, payload);
      onSaved(data);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit product</DialogTitle>
      <DialogContent dividers>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} required />
          <TextField label="Price" type="number" value={form.price} onChange={(e) => setForm(s => ({ ...s, price: e.target.value }))} required />
          <TextField label="Category" value={form.category} onChange={(e) => setForm(s => ({ ...s, category: e.target.value }))} />
          <TextField label="Image URL" value={form.imageUrl} onChange={(e) => setForm(s => ({ ...s, imageUrl: e.target.value }))} />
          <TextField label="Description" value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} multiline minRows={2} />
          <FormControlLabel control={<Switch checked={form.isAvailable} onChange={(e) => setForm(s => ({ ...s, isAvailable: e.target.checked }))} />} label="Available" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
