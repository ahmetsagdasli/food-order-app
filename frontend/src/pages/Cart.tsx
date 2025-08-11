import { useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { getCart, updateQty, removeItem, totalSnapshot } from "../utils/cart";
import type { CartItem } from "../utils/cart";
import { useNavigate, Link as RouterLink } from "react-router-dom";

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const nav = useNavigate();

  const load = () => setItems(getCart());

  useEffect(() => {
    load();
    const onChange = () => load();
    window.addEventListener("cart:change", onChange as any);
    return () => window.removeEventListener("cart:change", onChange as any);
  }, []);

  const inc = (id: string) =>
    updateQty(id, (items.find((x) => x.productId === id)?.qty || 0) + 1);
  const dec = (id: string) =>
    updateQty(id, (items.find((x) => x.productId === id)?.qty || 0) - 1);
  const set = (id: string, v: number) =>
    updateQty(id, Math.max(0, Math.floor(Number(v) || 0)));
  const del = (id: string) => removeItem(id);

  const total = totalSnapshot();

  if (!items.length) {
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
                <Typography>{it.price.toFixed(2)} ₺</Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <IconButton size="small" onClick={() => dec(it.productId)}>
                    <RemoveIcon />
                  </IconButton>
                  <TextField
                    size="small"
                    value={it.qty}
                    onChange={(e) => set(it.productId, Number(e.target.value))}
                    inputProps={{
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                      style: { width: 48, textAlign: "center" },
                    }}
                  />
                  <IconButton size="small" onClick={() => inc(it.productId)}>
                    <AddIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} md={1}>
                <IconButton color="error" onClick={() => del(it.productId)}>
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
          <Typography variant="h6">{total.toFixed(2)} ₺</Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 1 }}>
          <Button onClick={() => nav("/products")}>Alışverişe devam et</Button>
          <Button variant="contained" onClick={() => nav("/checkout")}>
            Ödemeye geç
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
