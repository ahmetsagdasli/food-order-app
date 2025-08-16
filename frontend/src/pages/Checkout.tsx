// frontend/src/pages/Checkout.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
);

type CartItem = {
  productId: string;
  qty: number;
  name?: string;
  price?: number;
};

const getCart = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  } catch {
    return [];
  }
};

const clearCart = () => {
  localStorage.removeItem("cart");
};

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);

  // Sunucudan ürün detaylarını çek
  const fetchCartDetails = useCallback(async () => {
    setLoadingCart(true);
    try {
      const cart = getCart();
      if (!cart.length) {
        setErr("Your cart is empty.");
        setLoadingCart(false);
        return;
      }

      // API: /api/products/bulk?ids[]=...&ids[]=...
      const ids = cart.map((c) => c.productId);
      const { data: products } = await api.get("/api/products/bulk", {
        params: { ids },
      });

      const merged = cart.map((c) => {
        const p = products.find((x: any) => x._id === c.productId);
        return {
          ...c,
          name: p?.name || "Product",
          price: p?.price || 0,
        };
      });

      setCartItems(merged);
    } catch (error: any) {
      setErr(error?.response?.data?.error || "Failed to load cart details");
    } finally {
      setLoadingCart(false);
    }
  }, []);

  useEffect(() => {
    fetchCartDetails();
  }, [fetchCartDetails]);

  const handlePayment = useCallback(async () => {
    setErr("");
    setSuccess("");

    if (!stripe || !elements) return;
    const cart = getCart();
    if (!cart.length) {
      setErr("Your cart is empty.");
      return;
    }

    try {
      setLoading(true);

      // 1) Create order
      const { data: order } = await api.post("/api/orders", { items: cart });

      // 2) Create PaymentIntent
      const { data: pi } = await api.post("/api/payments/create-intent", {
        orderId: order._id,
      });
      setTotal(pi.amount ? pi.amount / 100 : null);

      // 3) Confirm payment
      const result = await stripe.confirmCardPayment(pi.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { name: name || "Customer" },
        },
      });

      if (result.error) {
        setErr(result.error.message || "Payment failed");
        return;
      }

      if (result.paymentIntent?.status !== "succeeded") {
        setErr("Payment not completed");
        return;
      }

      // 4) Mark order as paid
      await api.post(`/api/orders/${order._id}/pay`, {
        transactionId: pi.paymentIntentId,
      });

      clearCart();
      setSuccess("Payment successful! Redirecting to your order...");
      setTimeout(() => navigate(`/orders/${order._id}`), 1500);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  }, [stripe, elements, name, navigate]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Checkout
      </Typography>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Sipariş Özeti */}
      {loadingCart ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      ) : cartItems.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Sipariş Özeti</Typography>
          <List dense>
            {cartItems.map((item) => (
              <ListItem key={item.productId} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={`${item.name} x ${item.qty}`}
                  secondary={`${(item.price! * item.qty).toFixed(2)} ${
                    import.meta.env.VITE_CURRENCY || "USD"
                  }`}
                />
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle1" fontWeight="bold">
            Toplam:{" "}
            {cartItems
              .reduce((acc, cur) => acc + (cur.price || 0) * cur.qty, 0)
              .toFixed(2)}{" "}
            {import.meta.env.VITE_CURRENCY || "USD"}
          </Typography>
        </Box>
      )}

      {/* Ödeme Formu */}
      <Box sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
        <TextField
          label="Name on card"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Box
          sx={{
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
          }}
        >
          <CardElement options={{ hidePostalCode: true }} />
        </Box>

        <Button
          variant="contained"
          onClick={handlePayment}
          disabled={loading || !stripe || loadingCart}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Processing..." : "Pay"}
        </Button>

        {total != null && (
          <Typography variant="body2" color="text.secondary">
            Charged: {total.toFixed(2)}{" "}
            {import.meta.env.VITE_CURRENCY || "USD"}
          </Typography>
        )}

        <Typography variant="body2" color="text.secondary">
          Test card: 4242 4242 4242 4242 · any future date · any CVC
        </Typography>
      </Box>
    </Paper>
  );
}

export default function Checkout() {
  const options = useMemo(() => ({ appearance: { theme: "stripe" } }), []);
  return (
    <Container sx={{ mt: 4, mb: 6 }}>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm />
      </Elements>
    </Container>
  );
}
