// frontend/src/pages/Cart.tsx
import { useEffect, useMemo, useCallback, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  Grid,
  IconButton,
  Button,
  Box,
  Divider,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  getCart,
  updateQty,
  removeItem,
} from "../utils/cart";
import type { CartItem } from "../utils/cart";

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const navigate = useNavigate();

  const formatCurrency = useCallback(
    (value: number) =>
      new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value),
    []
  );

  const loadCart = useCallback(() => {
    setItems(getCart());
  }, []);

  useEffect(() => {
    loadCart();
    const onChange = () => loadCart();
    window.addEventListener("cart:change", onChange as EventListener);
    return () => window.removeEventListener("cart:change", onChange as EventListener);
  }, [loadCart]);

  // Toplamı her render’da güncel tut (store’daki snapshot yerine mevcut items’tan hesapla)
  const total = useMemo(
    () => items.reduce((sum, it) => sum + it.price * it.qty, 0),
    [items]
  );

  const increase = useCallback(
    (id: string) => {
      const current = items.find((x) => x.productId === id)?.qty ?? 0;
      updateQty(id, current + 1);
    },
    [items]
  );

  const decrease = useCallback(
    (id: string) => {
      const current = items.find((x) => x.productId === id)?.qty ?? 0;
      updateQty(id, Math.max(0, current - 1));
    },
    [items]
  );

  const setExact = useCallback((id: string, value: string | number) => {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    updateQty(id, n);
  }, []);

  const remove = useCallback((id: string) => {
    removeItem(id);
  }, []);

  if (items.length === 0) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Sepet
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography>Sepetiniz boş.</Typography>
          <Button
            component={RouterLink}
            to="/products"
            sx={{ mt: 2 }}
            variant="contained"
          >
            Ürünlere git
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>
        Sepet
      </Typography>

      <Paper sx={{ p: 2 }}>
        {items.map((it) => (
          <Box key={it.productId}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle1" noWrap>
                  {it.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {it.category || "—"}
                </Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Typography>{formatCurrency(it.price)}</Typography>
              </Grid>

              <Grid item xs={12} md={3}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => decrease(it.productId)}
                    disabled={it.qty <= 0}
                    aria-label="decrease quantity"
                  >
                    <RemoveIcon />
                  </IconButton>

                  <TextField
                    size="small"
                    value={it.qty}
                    onChange={(e) => setExact(it.productId, e.target.value)}
                    inputProps={{
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                      style: { width: 56, textAlign: "center" },
                      "aria-label": "quantity",
                    }}
                  />

                  <IconButton
                    size="small"
                    onClick={() => increase(it.productId)}
                    aria-label="increase quantity"
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Grid>

              <Grid item xs={12} md={1}>
                <IconButton
                  color="error"
                  onClick={() => remove(it.productId)}
                  aria-label="remove item"
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1.5 }} />
          </Box>
        ))}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
          }}
        >
          <Typography variant="h6">Toplam</Typography>
          <Typography variant="h6">{formatCurrency(total)}</Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 1 }}>
          <Button onClick={() => navigate("/products")}>Alışverişe devam et</Button>
          <Button variant="contained" onClick={() => navigate("/checkout")}>
            Ödemeye geç
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
