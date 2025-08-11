import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import { useState } from "react";
import { addToCart } from "../utils/cart";
import { useAuth } from "../context/AuthContext";

type P = {
  _id?: string; id?: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  description?: string;
};

const FALLBACK =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
  <rect width="100%" height="100%" fill="#f2f2f2"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial" font-size="28" fill="#999">
    no image
  </text>
</svg>`);

export default function ProductCard({ product }: { product: P }) {
  const key = (product as any)._id ?? (product as any).id;
  const src = product.imageUrl || FALLBACK;
  const { auth } = useAuth();
  const role = auth?.user?.role;
  const [ok, setOk] = useState(false);

  const onAdd = () => {
    addToCart(product as any, 1);
    setOk(true);
  };

  return (
    <Card
      key={key}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      {/* Görsel */}
      <Box sx={{ position: "relative", pt: "75%", overflow: "hidden" }}>
        <CardMedia
          component="img"
          src={src}
          alt={product.name}
          onError={(e: any) => { if (e?.currentTarget?.src !== FALLBACK) e.currentTarget.src = FALLBACK; }}
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform .3s ease",
            "&:hover": { transform: "scale(1.02)" }
          }}
        />
      </Box>

      {/* Metin + CTA */}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" gutterBottom noWrap sx={{ fontSize: 18, fontWeight: 600 }}>
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 14 }}>
          {(product.category || "—")} · {product.price} ₺
        </Typography>
        {product.description && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }} noWrap>
            {product.description}
          </Typography>
        )}

        {/* Sadece müşteri (user) rolüne göster */}
        {role === "user" && (
          <Stack direction="row" sx={{ mt: 1.5 }}>
            <Button variant="contained" size="small" onClick={onAdd}>
              Sepete Ekle
            </Button>
          </Stack>
        )}
      </CardContent>

      <Snackbar
        open={ok}
        autoHideDuration={1600}
        onClose={() => setOk(false)}
        message="Ürün sepete eklendi"
      />
    </Card>
  );
}
