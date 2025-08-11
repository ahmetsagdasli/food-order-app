import "dotenv/config";
import Stripe from "stripe";
import { Order } from "../models/Order.js";

// -------- Lazy init: Stripe client'ı ilk ihtiyaçta yarat --------
let _stripe = null;
const getStripe = () => {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY missing. Set it in backend/.env");
  }
  _stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  return _stripe;
};

const toMinor = (amount) => Math.round(Number(amount) * 100);

/**
 * POST /api/payments/create-intent
 * body: { orderId }
 * auth: user/admin
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const isOwner = String(order.user) === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

    if (order.payment?.status === "paid") {
      return res.status(400).json({ error: "Order already paid" });
    }

    const currency = (process.env.CURRENCY || "usd").toLowerCase();
    const amount = toMinor(order.totalAmount);

    const stripe = getStripe();
    const pi = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { orderId: String(order._id), userId: req.user.id },
      automatic_payment_methods: { enabled: true },
    });

    return res.json({ clientSecret: pi.client_secret, paymentIntentId: pi.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

/**
 * Stripe Webhook
 * app.js içinde:
 * app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook)
 * ve bu satır express.json()'DAN ÖNCE olmalı.
 */
export const stripeWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!whSecret) return res.status(500).send("STRIPE_WEBHOOK_SECRET missing");

    const stripe = getStripe();
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const orderId = pi.metadata?.orderId;
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          "payment.status": "paid",
          "payment.transactionId": pi.id,
          status: "preparing",
        });
      }
    }

    return res.json({ received: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
