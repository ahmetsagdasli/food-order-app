// frontend/src/components/ProductEditDialog.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

export type ProductEditData = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  category?: string;
  isAvailable?: boolean;
};

type Props = {
  open: boolean;
  /** AdminProducts: sadece id ver, diyalog ürünü kendisi çeker */
  productId?: string | null;
  /** MerchantMenu: ürün objesi ver, diyalog doğrudan doldurur */
  product?: ProductEditData | null;
  onClose: () => void;
  onSaved?: (product: ProductEditData) => void;

  /** Optimistic update kancası: submit başında çalışır.
   *  Bir rollback fonksiyonu döndürürsen, hata halinde geri alınır. */
  onOptimistic?: (draft: ProductEditData) => void | (() => void);

  /** Hata bilgilendirmesi için opsiyonel kanca */
  onError?: (message: string) => void;
};

// Vite env
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000";

const ProductEditDialog: React.FC<Props> = ({
  open,
  productId,
  product,
  onClose,
  onSaved,
  onOptimistic,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // Form string tabanlı (number alanlar submit’te parse edilir)
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const previousObjectUrlRef = useRef<string>("");

  const cleanupObjectUrl = useCallback(() => {
    if (previousObjectUrlRef.current) {
      URL.revokeObjectURL(previousObjectUrlRef.current);
      previousObjectUrlRef.current = "";
    }
  }, []);

  const fillFromProduct = useCallback((p: ProductEditData) => {
    setForm({
      name: p?.name ?? "",
      price: p?.price != null ? String(p.price) : "",
      description: p?.description ?? "",
      imageUrl: p?.imageUrl ?? "",
    });
    setPreview(p?.imageUrl ?? "");
  }, []);

  // Ürünü getir / formu doldur
  useEffect(() => {
    let cancelled = false;

    const load = async (id: string) => {
      setLoading(true);
      setError("");
      try {
        const { data } = await axios.get<ProductEditData>(`${API_BASE}/api/products/${id}`);
        if (!cancelled) fillFromProduct(data);
      } catch (e: any) {
        if (!cancelled) {
          const msg = e?.response?.data?.message || e.message || "Failed to load product";
          setError(msg);
          onError?.(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (!open) {
      cleanupObjectUrl();
      setFile(null);
      setPreview("");
      setError("");
      return;
    }

    // Öncelik: doğrudan verilen product
    if (product && product._id) {
      fillFromProduct(product);
      return () => {
        cancelled = true;
      };
    }

    // Alternatif: id ile yükleme
    if (productId) {
      load(productId);
      return () => {
        cancelled = true;
      };
    }

    // Ne product ne id verilmişse
    setError("Product id missing");

    return () => {
      cancelled = true;
    };
  }, [open, product, productId, cleanupObjectUrl, fillFromProduct, onError]);

  const fileInputKey = useMemo(
    () =>
      file
        ? `file-${file.name}-${file.size}-${file.lastModified}`
        : `file-empty-${form.imageUrl}`,
    [file, form.imageUrl]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] || null;
      setError("");
      if (!f) {
        setFile(null);
        setPreview(form.imageUrl || "");
        cleanupObjectUrl();
        return;
      }
      setFile(f);
      cleanupObjectUrl();
      const url = URL.createObjectURL(f);
      previousObjectUrlRef.current = url;
      setPreview(url);
    },
    [cleanupObjectUrl, form.imageUrl]
  );

  const handleClearImage = useCallback(() => {
    setFile(null);
    cleanupObjectUrl();
    setPreview(form.imageUrl || "");
  }, [cleanupObjectUrl, form.imageUrl]);

  const handleClose = useCallback(() => {
    cleanupObjectUrl();
    setFile(null);
    setPreview("");
    setError("");
    onClose();
  }, [cleanupObjectUrl, onClose]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const id = product?._id ?? productId ?? "";
      if (!id) {
        const msg = "Product id missing";
        setError(msg);
        onError?.(msg);
        return;
      }

      const priceNum = Number(form.price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        const msg = "Price must be a non-negative number";
        setError(msg);
        onError?.(msg);
        return;
      }

      setSaving(true);
      setError("");

      // Optimistic draft (image server’da değişebilir, yine de isim/price/desc için yeterli)
      const draft: ProductEditData = {
        _id: id,
        name: form.name.trim(),
        price: priceNum,
        description: form.description,
        imageUrl: preview || form.imageUrl,
        // category/isAvailable mevcutsa parent tarafında korunacak
        category: product?.category,
        isAvailable: product?.isAvailable,
      };

      let rollback: void | (() => void);
      try {
        rollback = onOptimistic?.(draft);

        const data = new FormData();
        data.append("name", draft.name);
        data.append("price", String(draft.price));
        data.append("description", draft.description || "");
        if (file) data.append("image", file);

        const res = await axios.put<{ product: ProductEditData }>(
          `${API_BASE}/api/products/${id}`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const updated = res.data?.product ?? draft;
        onSaved?.(updated);
        handleClose();
      } catch (err: any) {
        // Optimistic rollback
        if (typeof rollback === "function") {
          try {
            rollback();
          } catch {
            /* ignore rollback errors */
          }
        }
        const msg = err?.response?.data?.message || err?.message || "Save failed";
        setError(msg);
        onError?.(msg);
      } finally {
        setSaving(false);
      }
    },
    [product?._id, productId, form.name, form.price, form.description, form.imageUrl, preview, file, onOptimistic, onSaved, onError, handleClose, product?.category, product?.isAvailable]
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Edit Product</DialogTitle>

      <form onSubmit={handleSave}>
        <DialogContent dividers>
          {loading ? (
            <Box py={6} display="flex" gap={2} alignItems="center" justifyContent="center">
              <CircularProgress />
              <Typography>Loading…</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {!!error && (
                <Grid size={{ xs: 12 }}>
                  <Box
                    p={2}
                    sx={{ bgcolor: "#ffe6e6", color: "#b00020", borderRadius: 2, fontSize: 14 }}
                  >
                    {error}
                  </Box>
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 8 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Price"
                      name="price"
                      type="number"
                      inputProps={{ step: "0.01", min: 0 }}
                      value={form.price}
                      onChange={handleChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      fullWidth
                      multiline
                      minRows={3}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Image
                </Typography>

                <input
                  key={fileInputKey}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ marginBottom: 12 }}
                />

                {preview ? (
                  <Box
                    component="img"
                    src={preview}
                    alt="preview"
                    sx={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "1px solid #eee",
                      mb: 1,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: 200,
                      borderRadius: 2,
                      border: "1px dashed #ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1,
                      fontSize: 13,
                      color: "#777",
                    }}
                  >
                    No image
                  </Box>
                )}

                <Box display="flex" gap={1}>
                  <Button variant="outlined" onClick={handleClearImage} type="button">
                    Reset Preview
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving || loading}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductEditDialog;
