import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

type CartItem = { productId: string; qty: number };

function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem("cart") || "[]"); }
  catch { return []; }
}
function clearCart() { localStorage.removeItem("cart"); }

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    // Toplamı server'dan hesaplatmak istersen burada /api/cart/price vb. çağırabilirsin
    // Biz şimdilik sipariş oluşturma sırasında hesaplıyoruz.
    const cart = getCart();
    if (!cart.length) setErr("Your cart is empty.");
  }, []);

  const pay = async () => {
    setErr("");
    if (!stripe || !elements) return;

    const cart = getCart();
    if (!cart.length) { setErr("Your cart is empty."); return; }

    try {
      setLoading(true);

      // 1) Order create
      const order = (await api.post("/api/orders", { items: cart })).data;

      // 2) PaymentIntent
      const pi = (await api.post("/api/payments/create-intent", { orderId: order._id })).data; // { clientSecret, paymentIntentId, amount }
      setTotal(pi.amount ? pi.amount / 100 : null);

      // 3) Card confirm
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

      // 4) Fallback: mark as paid
      await api.post(`/api/orders/${order._id}/pay`, { transactionId: pi.paymentIntentId });

      clearCart();
      nav(`/orders/${order._id}`);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Checkout</Typography>
      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      <Box sx={{ display: "grid", gap: 2, maxWidth: 480 }}>
        <TextField label="Name on card" value={name} onChange={(e)=>setName(e.target.value)} />
        <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
          <CardElement options={{ hidePostalCode: true }} />
        </Box>
        <Button variant="contained" onClick={pay} disabled={loading || !stripe}>Pay</Button>
        {total != null && (
          <Typography variant="body2" color="text.secondary">Charged: {total.toFixed(2)} {import.meta.env.VITE_CURRENCY || "USD"}</Typography>
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
